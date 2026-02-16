import os
import uuid
import traceback
from threading import Thread
from io import BytesIO
from flask import Flask, request, jsonify, send_file, make_response
import pyttsx3
from gtts import gTTS
from pydub import AudioSegment
from pydub.effects import speedup
from flask_cors import CORS
import sys

# ---------------- SHARED HELPERS ----------------
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared_helpers import add_video_for_user, get_user_videos

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # absolute path to current folder
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

# ensure folders exist
for folder in [AUDIO_DIR, TEMP_DIR]:
    os.makedirs(folder, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# ---------------- GLOBAL ----------------
progress_status = {}  # audio_id -> %

# ================== TTS CORE ==================
def generate_tts(text, language="en", voice="male", rate=118, speed=1.0, volume=1.0, pitch=0):
    """
    Generate TTS audio and return BytesIO containing mp3 data.
    """
    try:
        if not text or not text.strip():
            raise ValueError("Text is empty")

        # IMPORTANT FIX: gTTS only supports mp3
        use_gtts = language == "ur" or voice.lower() == "female"
        ext = "mp3" if use_gtts else "wav"
        temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{ext}")

        # Choose engine
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

        # Process audio
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

    except Exception:
        traceback.print_exc()
        return None

# ----------------- Updated save & async -----------------
def save_tts_to_user(user_id, audio_id, audio_io):
    """
    Save generated audio to user directory and update DB ONLY if successful.
    """
    try:
        user_dir = os.path.join(AUDIO_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)
        output_path = os.path.join(user_dir, f"{audio_id}.mp3")

        with open(output_path, "wb") as f:
            f.write(audio_io.read())
        audio_io.seek(0)

        # Only now update DB
        try:
            add_video_for_user(user_id, "tool1", audio_id, f"{audio_id}.mp3")
        except Exception:
            traceback.print_exc()

        return output_path
    except Exception:
        traceback.print_exc()
        return None


def generate_tts_async(user_id, audio_id, text, language, voice, rate, speed, volume, pitch):
    """
    Background thread for async TTS generation.
    Updates progress_status safely.
    """
    try:
        if not user_id:
            progress_status[audio_id] = -1
            return

        progress_status[audio_id] = 10  # started

        audio_io = generate_tts(text, language, voice, rate, speed, volume, pitch)
        if not audio_io:
            progress_status[audio_id] = -1
            return

        progress_status[audio_id] = 50  # generated

        saved_path = save_tts_to_user(user_id, audio_id, audio_io)
        if saved_path:
            progress_status[audio_id] = 100  # finished
        else:
            progress_status[audio_id] = -1

    except Exception:
        progress_status[audio_id] = -1
        traceback.print_exc()

# ================== ROUTES ==================
@app.route("/")
def home():
    return "Voiceover API running"

@app.route("/generate/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover():
    """
    Synchronous voiceover generation. Returns mp3 directly.
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
    Asynchronous voiceover generation. Returns audio_id immediately.
    """
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    audio_id = str(uuid.uuid4())
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
    if request.method == "OPTIONS":
        return "", 200
    return jsonify({"progress": progress_status.get(audio_id, 0)})

@app.route("/public/voiceover/<user_id>", methods=["GET", "OPTIONS"])
def list_user_audio(user_id):
    if request.method == "OPTIONS":
        return "", 200
    files = get_user_videos(user_id)
    return jsonify(files)

@app.route("/public/voiceover/<user_id>/<audio_id>.mp3")
def serve_audio(user_id, audio_id):
    path = os.path.join(AUDIO_DIR, user_id, f"{audio_id}.mp3")
    if os.path.exists(path):
        return send_file(path, mimetype="audio/mpeg")
    elif audio_id in progress_status:
        return jsonify({"error": "Audio generation in progress"}), 404
    else:
        return jsonify({"error": "File not found"}), 404

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(port=9001, debug=True)
