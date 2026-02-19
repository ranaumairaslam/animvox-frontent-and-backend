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
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",   # Next.js
    "http://localhost:5173",   # Vite
]}}, supports_credentials=True)

# ---------------- GLOBALS ----------------
progress_status = {}  # audio_id -> 0-100 (-1 for error)
progress_lock = Lock()  # thread-safe updates
all_edge_voices = []  # cache for Edge-TTS voices

# ================== URDU VOICE PROFILES ==================
URDU_PROFILES = {
    "Narrator":     {"pitch": 0,  "speed": 1.0,  "volume": 1.0},
    "Child (Boy)":  {"pitch": 4,  "speed": 1.2,  "volume": 1.0},
    "Child (Girl)": {"pitch": 5,  "speed": 1.25, "volume": 1.0},
    "Elder":        {"pitch": -2, "speed": 0.9,  "volume": 1.0},
    "Hero":         {"pitch": 0,  "speed": 1.05, "volume": 1.0},
    "Villain":      {"pitch": -1, "speed": 0.95, "volume": 1.0},
    "Mother":       {"pitch": 1,  "speed": 1.0,  "volume": 1.0},
    "Emotion":      {"pitch": 2,  "speed": 1.1,  "volume": 1.0},
    "Neutral":      {"pitch": 0,  "speed": 1.0,  "volume": 1.0},
    "Happy":        {"pitch": 2,  "speed": 1.1,  "volume": 1.1},
    "Sad":          {"pitch": -2, "speed": 0.9,  "volume": 0.9},
    "Angry":        {"pitch": -1, "speed": 1.2,  "volume": 1.2},
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
        print(f"❌ Edge-TTS error: {e}")
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
            print(f"❌ Failed to fetch Edge voices: {e}")
            all_edge_voices = []
    return all_edge_voices

# ================== TTS CORE ==================
def generate_tts(text, language="en", voice="male", rate=118, speed=1.0, volume=1.0, pitch=0):
    """
    Generate TTS audio and return BytesIO containing mp3 data.
    
    Language routing:
    - "ur"     -> gTTS with Urdu voice profiles (pitch/speed/volume applied)
    - "en" + "male"/"female" -> pyttsx3 (legacy)
    - "en" + Edge-TTS voice name -> Edge-TTS
    """
    try:
        if not text or not text.strip():
            raise ValueError("Text is empty")

        language = language.lower().strip()
        print(f"🎙️ Generating TTS | lang={language} | voice={voice} | speed={speed} | pitch={pitch}")

        # ✅ Urdu: always use gTTS + profile
        if language == "ur":
            return _generate_urdu_tts(text, voice, speed, volume, pitch)

        # ✅ English legacy: male/female -> pyttsx3
        elif voice.lower() in ["male", "female"]:
            return _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch)

        # ✅ Edge-TTS: proper Edge voice name like "en-US-GuyNeural"
        else:
            return _generate_edge_tts_audio(text, voice, speed, volume, pitch)

    except Exception as e:
        print(f"❌ generate_tts error: {e}")
        traceback.print_exc()
        return None


def _generate_urdu_tts(text, voice, speed, volume, pitch):
    """Generate Urdu TTS with voice profiles using gTTS"""
    # Get profile params (fallback to passed params if profile not found)
    profile = URDU_PROFILES.get(voice, None)
    if profile:
        pitch = profile["pitch"]
        speed = profile["speed"]
        volume = profile["volume"]
        print(f"✅ Urdu profile '{voice}' -> pitch={pitch} speed={speed} volume={volume}")
    else:
        print(f"⚠️ Unknown Urdu profile '{voice}', using default params")

    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_urdu.mp3")

    try:
        # Generate base gTTS audio
        tts = gTTS(text=text, lang="ur")
        tts.save(temp_file)
        print(f"✅ gTTS saved to {temp_file}")

        # Load and process audio
        audio = AudioSegment.from_file(temp_file)

        # Adjust speed
        if speed != 1.0:
            audio = speedup(audio, playback_speed=speed)

        # Adjust volume safely
        volume = min(max(volume, 0.0), 2.0)
        audio = audio + (20 * (volume - 1.0))

        # Adjust pitch
        if pitch != 0:
            if pitch > 0:
                new_frame_rate = int(audio.frame_rate * (2.0 ** (pitch / 12.0)))
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_frame_rate})
                audio = audio.set_frame_rate(44100)
            else:
                # Negative pitch: slow down slightly to simulate deeper voice
                factor = 1.0 + (-pitch * 0.05)
                audio = speedup(audio, playback_speed=1.0 / factor)

        # Export to BytesIO
        output_io = BytesIO()
        audio.export(output_io, format="mp3")
        output_io.seek(0)
        print(f"✅ Urdu audio generated successfully")
        return output_io

    finally:
        # Always cleanup temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)


def _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch):
    """Generate TTS using pyttsx3 (male) or gTTS (female/urdu)"""
    use_gtts = voice.lower() == "female"
    ext = "mp3" if use_gtts else "wav"
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_legacy.{ext}")

    try:
        if use_gtts:
            lang_code = "ur" if language == "ur" else "en"
            gTTS(text=text, lang=lang_code).save(temp_file)
            audio = AudioSegment.from_mp3(temp_file)
        else:
            engine = pyttsx3.init()
            engine.setProperty("rate", rate)
            engine.setProperty("volume", max(0.0, min(volume, 2.0)))

            voices = engine.getProperty("voices")
            selected_voice = voices[0].id  # default
            for v in voices:
                name = v.name.lower()
                if "david" in name or "male" in name:
                    selected_voice = v.id
                    break

            engine.setProperty("voice", selected_voice)
            engine.save_to_file(text, temp_file)
            engine.runAndWait()
            audio = AudioSegment.from_wav(temp_file)

        # Apply effects
        if speed != 1.0:
            audio = speedup(audio, speed)
        audio += 20 * (volume - 1)
        if pitch != 0:
            new_rate = int(audio.frame_rate * (2 ** (pitch / 12)))
            audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_rate})
            audio = audio.set_frame_rate(44100)

        output_io = BytesIO()
        audio.export(output_io, format="mp3")
        output_io.seek(0)
        print(f"✅ Legacy TTS generated successfully")
        return output_io

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def _generate_edge_tts_audio(text, voice, speed, volume, pitch):
    """Generate TTS using Edge-TTS (requires valid Edge voice name)"""
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_edge.mp3")

    try:
        generate_edge_tts_sync(text, voice, temp_file)
        audio = AudioSegment.from_file(temp_file)

        if speed != 1.0:
            audio = speedup(audio, playback_speed=speed)
        volume = min(max(volume, 0.0), 2.0)
        audio = audio + (20 * (volume - 1.0))
        if pitch != 0:
            new_frame_rate = int(audio.frame_rate * (2.0 ** (pitch / 12.0)))
            audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_frame_rate})
            audio = audio.set_frame_rate(44100)

        output_io = BytesIO()
        audio.export(output_io, format="mp3")
        output_io.seek(0)
        print(f"✅ Edge-TTS audio generated successfully")
        return output_io

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


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

        print(f"✅ Audio saved: {output_path}")
        return output_path
    except Exception:
        traceback.print_exc()
        return None


def generate_tts_async(user_id, audio_id, text, language, voice, rate, speed, volume, pitch):
    """Background thread/task for async TTS generation — updates progress_status"""
    try:
        if not user_id:
            with progress_lock:
                progress_status[audio_id] = -1
            print(f"❌ No user_id for audio_id={audio_id}")
            return

        with progress_lock:
            progress_status[audio_id] = 10  # started
        print(f"🔄 Generating TTS for audio_id={audio_id}")

        audio_io = generate_tts(text, language, voice, rate, speed, volume, pitch)
        if not audio_io:
            with progress_lock:
                progress_status[audio_id] = -1
            print(f"❌ generate_tts returned None for audio_id={audio_id}")
            return

        with progress_lock:
            progress_status[audio_id] = 50  # generated

        saved_path = save_tts_to_user(user_id, audio_id, audio_io)
        if saved_path:
            with progress_lock:
                progress_status[audio_id] = 100  # finished ✅
            print(f"✅ audio_id={audio_id} complete!")
        else:
            with progress_lock:
                progress_status[audio_id] = -1
            print(f"❌ Failed to save audio_id={audio_id}")

    except Exception:
        with progress_lock:
            progress_status[audio_id] = -1
        print(f"❌ Exception in generate_tts_async for audio_id={audio_id}")
        traceback.print_exc()


# ================== ROUTES ==================
@app.route("/")
def home():
    return "Voiceover API running ✅"


@app.route("/voices")
def get_voices():
    voices = list_edge_voices()
    return jsonify([{
        "name": v["Name"],
        "shortName": v.get("ShortName"),
        "gender": v.get("Gender"),
        "locale": v.get("Locale")
    } for v in voices])


@app.route("/generate/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover():
    """Synchronous voiceover generation (OLD ROUTE - kept for compatibility)"""
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
    """Asynchronous voiceover generation (MAIN ROUTE) — returns audio_id immediately"""
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
        daemon=True,
    ).start()

    return jsonify({"status": "started", "audio_id": audio_id})


@app.route("/progress/<audio_id>", methods=["GET", "OPTIONS"])
def progress(audio_id):
    """Get generation progress — returns progress (0-100) and status string"""
    if request.method == "OPTIONS":
        return "", 200
    with progress_lock:
        prog = progress_status.get(audio_id, 0)
    
    if prog >= 100:
        status = "done"
    elif prog == -1:
        status = "error"
    else:
        status = "processing"
    
    return jsonify({"progress": prog, "status": status})


@app.route("/public/voiceover/<user_id>", methods=["GET", "OPTIONS"])
def list_user_audio(user_id):
    """List all voiceover files for a user"""
    if request.method == "OPTIONS":
        return "", 200
    files = get_user_videos(user_id)
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