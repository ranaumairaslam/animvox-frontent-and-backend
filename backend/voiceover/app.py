import os
import sys
import uuid
import traceback
from threading import Thread, Lock
from io import BytesIO
from flask import Flask, request, jsonify, send_file, make_response, send_from_directory
from flask_cors import CORS
import pyttsx3
from gtts import gTTS
from pydub import AudioSegment
from pydub.effects import speedup
import asyncio
import edge_tts

# ---------------- SHARED HELPERS ----------------
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared_helpers import add_video_for_user, get_user_videos

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

# ensure folders exist
for folder in [AUDIO_DIR, TEMP_DIR]:
    os.makedirs(folder, exist_ok=True)

# Flask app
app = Flask(__name__)

# CORS configuration for frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# ---------------- GLOBALS ----------------
progress_status = {}  # audio_id -> 0-100 (-1 for error)
progress_lock = Lock()  # thread-safe updates
all_edge_voices = []  # cache for Edge-TTS voices

# ================== URDU VOICE PROFILES ==================
URDU_PROFILES = {
    "Narrator":    {"pitch": 0, "speed": 1.0, "volume": 1.0},
    "Child (Boy)": {"pitch": 4, "speed": 1.2, "volume": 1.0},
    "Child (Girl)":{"pitch": 5, "speed": 1.25,"volume": 1.0},
    "Elder":       {"pitch": -2,"speed": 0.9, "volume": 1.0},
    "Hero":        {"pitch": 0, "speed": 1.05,"volume": 1.0},
    "Villain":     {"pitch": -1,"speed": 0.95,"volume": 1.0},
    "Mother":      {"pitch": 1, "speed": 1.0, "volume": 1.0},
    "Emotion":     {"pitch": 2, "speed": 1.1, "volume": 1.0},
    "Neutral":     {"pitch": 0, "speed": 1.0, "volume": 1.0},
    "Happy":       {"pitch": 2, "speed": 1.1, "volume": 1.1},
    "Sad":         {"pitch": -2,"speed": 0.9, "volume": 0.9},
    "Angry":       {"pitch": -1,"speed": 1.2, "volume": 1.2},
}

# ================== EDGE-TTS UTILS ==================
async def _generate_edge_tts(text, voice, out_path):
    """Generate Edge-TTS audio asynchronously"""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)

def generate_edge_tts_sync(text, voice, out_path):
    """Run Edge-TTS in a separate event loop for parallel execution"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_generate_edge_tts(text, voice, out_path))
        loop.close()
    except Exception as e:
        print("❌ Edge-TTS error:", e)
        traceback.print_exc()
        raise

def list_edge_voices():
    """Fetch and cache available Edge-TTS voices"""
    global all_edge_voices
    if not all_edge_voices:
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            all_edge_voices = loop.run_until_complete(edge_tts.list_voices())
            loop.close()
        except Exception as e:
            print("❌ Failed to fetch Edge voices:", e)
            all_edge_voices = []
    return all_edge_voices

# ================== TTS CORE ==================
def generate_tts(text, language="en", voice="male", rate=118, speed=1.0, volume=1.0, pitch=0):
    """
    Generate TTS audio and return BytesIO containing mp3 data.
    Supports both old pyttsx3/gTTS and new Edge-TTS engines.
    """
    try:
        if not text or not text.strip():
            raise ValueError("Text is empty")

        language = language.lower()
        
        # Determine which engine to use
        if language == "ur":
            # Urdu: use gTTS with profiles
            return _generate_urdu_tts(text, voice, speed, volume, pitch)
        elif voice.lower() in ["male", "female"]:
            # Old-style voice selection: use pyttsx3 or gTTS
            return _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch)
        else:
            # New-style: assume Edge-TTS voice name
            return _generate_edge_tts_audio(text, voice, speed, volume, pitch)

    except Exception:
        traceback.print_exc()
        return None

def _generate_urdu_tts(text, voice, speed, volume, pitch):
    """Generate Urdu TTS with voice profiles"""
    profile_params = URDU_PROFILES.get(voice, {"pitch": pitch, "speed": speed, "volume": volume})
    pitch = profile_params["pitch"]
    speed = profile_params["speed"]
    volume = profile_params["volume"]

    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_temp.mp3")
    
    # Generate base gTTS audio
    tts = gTTS(text=text, lang="ur")
    tts.save(temp_file)
    
    # Load and process audio
    audio = AudioSegment.from_file(temp_file)
    
    # Adjust speed
    if speed != 1.0:
        audio = speedup(audio, playback_speed=speed)
    
    # Adjust volume safely
    volume = min(max(volume, 0.0), 2.0)
    audio = audio + (20 * (volume - 1.0))
    
    # Adjust pitch safely (avoid shrill sounds for negative pitch)
    if pitch != 0:
        if pitch > 0:
            new_frame_rate = int(audio.frame_rate * (2.0 ** (pitch / 12.0)))
        else:
            # Negative pitch: slow down to simulate deeper voice
            factor = 1.0 + (-pitch * 0.05)  # 5% slower per negative semitone
            audio = speedup(audio, playback_speed=1.0 / factor)
            new_frame_rate = audio.frame_rate
        
        audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_frame_rate})
        audio = audio.set_frame_rate(44100)
    
    # Export to BytesIO
    output_io = BytesIO()
    audio.export(output_io, format="mp3")
    output_io.seek(0)
    
    os.remove(temp_file)
    return output_io

def _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch):
    """Generate TTS using old pyttsx3/gTTS method (for backward compatibility)"""
    use_gtts = language == "ur" or voice.lower() == "female"
    ext = "mp3" if use_gtts else "wav"
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{ext}")

    if use_gtts:
        lang_code = "ur" if language == "ur" else "en"
        gTTS(text=text, lang=lang_code).save(temp_file)
        audio = AudioSegment.from_mp3(temp_file)
    else:
        engine = pyttsx3.init()
        engine.setProperty("rate", rate)
        engine.setProperty("volume", max(0.0, min(volume, 2.0)))

        voices = engine.getProperty("voices")
        selected_voice = None
        for v in voices:
            name = v.name.lower()
            if "male" in voice.lower() and ("david" in name or "male" in name):
                selected_voice = v.id
                break

        if selected_voice is None:
            selected_voice = voices[0].id

        engine.setProperty("voice", selected_voice)
        engine.save_to_file(text, temp_file)
        engine.runAndWait()

        audio = AudioSegment.from_wav(temp_file)

    # Process audio effects
    if speed != 1.0:
        audio = speedup(audio, speed)

    audio += 20 * (volume - 1)

    if pitch != 0:
        new_rate = int(audio.frame_rate * (2 ** (pitch / 12)))
        audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_rate})
        audio = audio.set_frame_rate(44100)

    # Export to BytesIO
    output_io = BytesIO()
    audio.export(output_io, format="mp3")
    output_io.seek(0)

    os.remove(temp_file)
    return output_io

def _generate_edge_tts_audio(text, voice, speed, volume, pitch):
    """Generate TTS using Edge-TTS"""
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_temp.wav")
    
    # Generate Edge-TTS audio
    generate_edge_tts_sync(text, voice, temp_file)
    audio = AudioSegment.from_file(temp_file)
    
    # Post-processing
    if speed != 1.0:
        audio = speedup(audio, playback_speed=speed)
    
    volume = min(max(volume, 0.0), 2.0)
    audio = audio + (20 * (volume - 1.0))
    
    if pitch != 0:
        new_frame_rate = int(audio.frame_rate * (2.0 ** (pitch / 12.0)))
        audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_frame_rate})
        audio = audio.set_frame_rate(44100)
    
    # Export to BytesIO
    output_io = BytesIO()
    audio.export(output_io, format="mp3")
    output_io.seek(0)
    
    os.remove(temp_file)
    return output_io

# ----------------- Save & Async -----------------
def save_tts_to_user(user_id, audio_id, audio_io):
    """Save generated audio to user directory and update DB"""
    try:
        user_dir = os.path.join(AUDIO_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)
        output_path = os.path.join(user_dir, f"{audio_id}.mp3")

        with open(output_path, "wb") as f:
            f.write(audio_io.read())
        audio_io.seek(0)

        # Update database
        try:
            add_video_for_user(user_id, "tool1", audio_id, f"{audio_id}.mp3")
        except Exception:
            traceback.print_exc()

        return output_path
    except Exception:
        traceback.print_exc()
        return None

def generate_tts_async(user_id, audio_id, text, language, voice, rate, speed, volume, pitch):
    """Background thread for async TTS generation"""
    try:
        if not user_id:
            with progress_lock:
                progress_status[audio_id] = -1
            return

        with progress_lock:
            progress_status[audio_id] = 10  # started

        audio_io = generate_tts(text, language, voice, rate, speed, volume, pitch)
        if not audio_io:
            with progress_lock:
                progress_status[audio_id] = -1
            return

        with progress_lock:
            progress_status[audio_id] = 50  # generated

        saved_path = save_tts_to_user(user_id, audio_id, audio_io)
        if saved_path:
            with progress_lock:
                progress_status[audio_id] = 100  # finished
        else:
            with progress_lock:
                progress_status[audio_id] = -1

    except Exception:
        with progress_lock:
            progress_status[audio_id] = -1
        traceback.print_exc()

# ================== ROUTES ==================
@app.route("/")
def home():
    """Serve React app or API status"""
    return "Voiceover API running"

@app.route("/voices")
def get_voices():
    """Get available Edge-TTS voices"""
    voices = list_edge_voices()
    return jsonify([{
        "name": v["Name"],
        "shortName": v.get("ShortName"),
        "gender": v.get("Gender"),
        "locale": v.get("Locale")
    } for v in voices])

@app.route("/generate/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover():
    """
    Synchronous voiceover generation (OLD ROUTE - kept for compatibility).
    Returns mp3 directly.
    """
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()
    text = data.get("text")
    language = data.get("language", "en")
    voice = data.get("voice", "male")
    rate = int(data.get("rate", 118))
    speed = float(data.get("speed", 1.0))
    volume = float(data.get("volume", 1.0))
    pitch = float(data.get("pitch", 0))
    user_id = data.get("user_id")
    audio_id = str(uuid.uuid4())

    audio_io = generate_tts(text, language, voice, rate, speed, volume, pitch)
    if audio_io is None:
        return jsonify({"error": "Failed to generate audio"}), 500

    if user_id:
        save_tts_to_user(user_id, audio_id, audio_io)

    response = make_response(audio_io.read())
    response.headers.set("Content-Type", "audio/mpeg")
    response.headers.set("Content-Disposition", f"inline; filename={audio_id}.mp3")
    return response

@app.route("/internal/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover_async():
    """
    Asynchronous voiceover generation (MAIN ROUTE).
    Returns audio_id immediately.
    """
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    audio_id = str(uuid.uuid4())
    with progress_lock:
        progress_status[audio_id] = 0

    Thread(
        target=generate_tts_async,
        args=(
            user_id,
            audio_id,
            data.get("text"),
            data.get("language", "en"),
            data.get("voice", "male"),
            int(data.get("rate", 118)),
            float(data.get("speed", 1.0)),
            float(data.get("volume", 1.0)),
            float(data.get("pitch", 0)),
        ),
    ).start()

    return jsonify({"status": "started", "audio_id": audio_id})

@app.route("/progress/<audio_id>", methods=["GET", "OPTIONS"])
def progress(audio_id):
    """Get generation progress for audio_id"""
    if request.method == "OPTIONS":
        return "", 200
    with progress_lock:
        prog = progress_status.get(audio_id, 0)
    return jsonify({"progress": prog})

@app.route("/public/voiceover/<user_id>", methods=["GET", "OPTIONS"])
def list_user_audio(user_id):
    """List all audio files for a user"""
    if request.method == "OPTIONS":
        return "", 200
    files = get_user_videos(user_id)
    # Filter only tool1 (voiceover) files
    voiceover_files = [f for f in files if f.get("tool") == "tool1"]
    return jsonify(voiceover_files)

@app.route("/public/voiceover/<user_id>/<audio_id>.mp3")
def serve_audio(user_id, audio_id):
    """Serve specific audio file for user"""
    path = os.path.join(AUDIO_DIR, user_id, f"{audio_id}.mp3")
    if os.path.exists(path):
        return send_file(path, mimetype="audio/mpeg")
    elif audio_id in progress_status:
        return jsonify({"error": "Audio generation in progress"}), 404
    else:
        return jsonify({"error": "File not found"}), 404

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(port=9001, debug=True, host="0.0.0.0")