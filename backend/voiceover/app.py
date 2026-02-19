import os
import sys
import uuid
import sqlite3
import traceback
from datetime import datetime
from threading import Thread, Lock
from io import BytesIO
from flask import Flask, request, jsonify, send_file, make_response, send_from_directory, Response
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
DB_FILE = os.getenv("DB_FILE", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "main.db"))

for folder in [AUDIO_DIR, TEMP_DIR]:
    os.makedirs(folder, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "http://localhost:5173",
]}}, supports_credentials=True)

# ---------------- GLOBALS ----------------
progress_status = {}
progress_lock = Lock()

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

# ================== 9 CINEMATIC ENGLISH VOICES ==================
CINEMATIC_ENGLISH_VOICES = [
    {"name": "en-US-DavisNeural",       "shortName": "US - Davis (Deep Narrator)",   "gender": "Male",   "locale": "en-US"},
    {"name": "en-US-GuyNeural",         "shortName": "US - Guy (Storyteller)",        "gender": "Male",   "locale": "en-US"},
    {"name": "en-US-TonyNeural",        "shortName": "US - Tony (Documentary)",       "gender": "Male",   "locale": "en-US"},
    {"name": "en-GB-RyanNeural",        "shortName": "UK - Ryan (British Narrator)",  "gender": "Male",   "locale": "en-GB"},
    {"name": "en-US-ChristopherNeural", "shortName": "US - Christopher (Calm)",       "gender": "Male",   "locale": "en-US"},
    {"name": "en-US-JennyNeural",       "shortName": "US - Jenny (Warm Narrator)",    "gender": "Female", "locale": "en-US"},
    {"name": "en-US-AriaNeural",        "shortName": "US - Aria (Clear & Smooth)",    "gender": "Female", "locale": "en-US"},
    {"name": "en-US-SaraNeural",        "shortName": "US - Sara (Professional)",      "gender": "Female", "locale": "en-US"},
    {"name": "en-GB-SoniaNeural",       "shortName": "UK - Sonia (British Narrator)", "gender": "Female", "locale": "en-GB"},
]

# ================== EDGE-TTS UTILS ==================

async def _edge_tts_async(text, voice, out_path):
    """Simple Edge-TTS call — no rate param (avoids NoAudioReceived)"""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)

def generate_edge_tts_sync(text, voice, out_path):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(_edge_tts_async(text, voice, out_path))
    loop.close()

def list_edge_voices():
    return CINEMATIC_ENGLISH_VOICES

# ================== TTS CORE ==================

def generate_tts(text, language="en", voice="male", rate=118, speed=1.0, volume=1.0, pitch=0):
    try:
        if not text or not text.strip():
            raise ValueError("Text is empty")
        language = language.lower().strip()
        print(f"🎙️ TTS | lang={language} | voice={voice} | speed={speed} | pitch={pitch}")

        if language == "ur":
            return _generate_urdu_tts(text, voice, speed, volume, pitch)
        elif voice.lower() in ["male", "female"]:
            return _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch)
        else:
            return _generate_edge_tts_audio(text, voice, speed, volume, pitch)

    except Exception as e:
        print(f"❌ generate_tts error: {e}")
        traceback.print_exc()
        return None


def _apply_effects(audio, speed, volume, pitch):
    if speed != 1.0:
        audio = speedup(audio, playback_speed=speed)
    volume = min(max(volume, 0.0), 2.0)
    audio = audio + (20 * (volume - 1.0))
    if pitch != 0:
        new_fr = int(audio.frame_rate * (2.0 ** (pitch / 12.0)))
        audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_fr})
        audio = audio.set_frame_rate(44100)
    return audio


def _generate_urdu_tts(text, voice, speed, volume, pitch):
    profile = URDU_PROFILES.get(voice)
    if profile:
        pitch = profile["pitch"]
        speed = profile["speed"]
        volume = profile["volume"]
        print(f"✅ Urdu profile '{voice}'")

    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_urdu.mp3")
    try:
        gTTS(text=text, lang="ur").save(temp_file)
        audio = AudioSegment.from_file(temp_file)
        audio = _apply_effects(audio, speed, volume, pitch)
        out = BytesIO()
        audio.export(out, format="mp3")
        out.seek(0)
        print("✅ Urdu audio done")
        return out
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def _generate_legacy_tts(text, language, voice, rate, speed, volume, pitch):
    use_gtts = voice.lower() == "female"
    ext = "mp3" if use_gtts else "wav"
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_legacy.{ext}")
    try:
        if use_gtts:
            gTTS(text=text, lang="en").save(temp_file)
            audio = AudioSegment.from_mp3(temp_file)
        else:
            engine = pyttsx3.init()
            engine.setProperty("rate", rate)
            engine.setProperty("volume", max(0.0, min(volume, 2.0)))
            voices = engine.getProperty("voices")
            sel = voices[0].id
            for v in voices:
                if "david" in v.name.lower() or "male" in v.name.lower():
                    sel = v.id
                    break
            engine.setProperty("voice", sel)
            engine.save_to_file(text, temp_file)
            engine.runAndWait()
            audio = AudioSegment.from_wav(temp_file)
        audio = _apply_effects(audio, speed, volume, pitch)
        out = BytesIO()
        audio.export(out, format="mp3")
        out.seek(0)
        print("✅ Legacy TTS done")
        return out
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def _generate_edge_tts_audio(text, voice, speed, volume, pitch):
    """Edge-TTS — simple call, no rate param passed to avoid NoAudioReceived"""
    temp_file = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_edge.mp3")
    try:
        generate_edge_tts_sync(text, voice, temp_file)
        if not os.path.exists(temp_file) or os.path.getsize(temp_file) < 100:
            raise Exception("Edge-TTS returned empty file")
        audio = AudioSegment.from_file(temp_file)
        audio = _apply_effects(audio, speed, volume, pitch)
        out = BytesIO()
        audio.export(out, format="mp3")
        out.seek(0)
        print("✅ Edge-TTS audio done")
        return out
    except Exception as e:
        print(f"❌ Edge-TTS failed: {e} — falling back to gTTS")
        # Fallback: gTTS English
        try:
            fb = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_fb.mp3")
            gTTS(text=text, lang="en").save(fb)
            audio = AudioSegment.from_mp3(fb)
            audio = _apply_effects(audio, speed, volume, pitch)
            out = BytesIO()
            audio.export(out, format="mp3")
            out.seek(0)
            if os.path.exists(fb):
                os.remove(fb)
            print("✅ gTTS fallback done")
            return out
        except Exception as fe:
            print(f"❌ gTTS fallback also failed: {fe}")
            return None
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


# ----------------- Save & Async -----------------
def save_tts_to_user(user_id, audio_id, audio_io):
    try:
        audio_io.seek(0)
        audio_bytes = audio_io.read()

        # ✅ Direct MySQL mein save karo
        import mysql.connector
        from dotenv import load_dotenv
        load_dotenv()

        mysql_conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "animvox_mysql")
        )
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute(
            "INSERT INTO user_videos (user_id, tool, video_id, file_path, audio_data, created_at) VALUES (%s, 'tool1', %s, %s, %s, %s)",
            (user_id, audio_id, f"{audio_id}.mp3", audio_bytes, datetime.utcnow().isoformat())
        )
        mysql_conn.commit()
        mysql_cur.close()
        mysql_conn.close()

        audio_io.seek(0)
        print(f"✅ Audio saved to MySQL: {audio_id}")
        return audio_id
    except Exception:
        traceback.print_exc()
        return None


def generate_tts_async(user_id, audio_id, text, language, voice, rate, speed, volume, pitch):
    try:
        if not user_id:
            with progress_lock:
                progress_status[audio_id] = -1
            return
        with progress_lock:
            progress_status[audio_id] = 10
        print(f"🔄 Generating audio_id={audio_id}")

        audio_io = generate_tts(text, language, voice, rate, speed, volume, pitch)
        if not audio_io:
            with progress_lock:
                progress_status[audio_id] = -1
            return
        with progress_lock:
            progress_status[audio_id] = 50

        saved = save_tts_to_user(user_id, audio_id, audio_io)
        with progress_lock:
            progress_status[audio_id] = 100 if saved else -1
        print(f"{'✅' if saved else '❌'} audio_id={audio_id}")
    except Exception:
        with progress_lock:
            progress_status[audio_id] = -1
        traceback.print_exc()


# ================== ROUTES ==================
@app.route("/")
def home():
    return "Voiceover API running ✅"


@app.route("/voices")
def get_voices():
    urdu_profiles = [{"name": k, "type": "urdu"} for k in URDU_PROFILES.keys()]
    edge_list = [
        {"name": v["name"], "shortName": v["shortName"], "gender": v["gender"], "locale": v["locale"], "type": "edge"}
        for v in CINEMATIC_ENGLISH_VOICES
    ]
    return jsonify({"urdu_profiles": urdu_profiles, "edge_voices": edge_list})


@app.route("/generate/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover():
    if request.method == "OPTIONS":
        return "", 200
    data = request.get_json()
    audio_id = str(uuid.uuid4())
    audio_io = generate_tts(
        data.get("text"), data.get("language", "en"), data.get("voice", "male"),
        int(data.get("rate", 118)), float(data.get("speed", 1.0)),
        float(data.get("volume", 1.0)), float(data.get("pitch", 0))
    )
    if audio_io is None:
        return jsonify({"error": "Failed to generate audio"}), 500
    user_id = data.get("user_id")
    if user_id:
        save_tts_to_user(user_id, audio_id, audio_io)
    response = make_response(audio_io.read())
    response.headers.set("Content-Type", "audio/mpeg")
    response.headers.set("Content-Disposition", f"inline; filename={audio_id}.mp3")
    return response


@app.route("/internal/voiceover", methods=["POST", "OPTIONS"])
def generate_voiceover_async():
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
            user_id, audio_id,
            data.get("text"), data.get("language", "en"), data.get("voice", "male"),
            int(data.get("rate", 118)), float(data.get("speed", 1.0)),
            float(data.get("volume", 1.0)), float(data.get("pitch", 0)),
        ),
        daemon=True,
    ).start()
    return jsonify({"status": "started", "audio_id": audio_id})


@app.route("/progress/<audio_id>", methods=["GET", "OPTIONS"])
def progress(audio_id):
    if request.method == "OPTIONS":
        return "", 200
    with progress_lock:
        prog = progress_status.get(audio_id, 0)
    status = "done" if prog >= 100 else ("error" if prog == -1 else "processing")
    return jsonify({"progress": prog, "status": status})


@app.route("/public/voiceover/<user_id>", methods=["GET", "OPTIONS"])
def list_user_audio(user_id):
    if request.method == "OPTIONS":
        return "", 200
    files = get_user_videos(user_id)
    return jsonify([f for f in files if f.get("tool") == "tool1"])


@app.route("/public/voiceover/<user_id>/<audio_id>.mp3")
def serve_audio(user_id, audio_id):
    try:
        import mysql.connector
        from dotenv import load_dotenv
        load_dotenv()

        mysql_conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "animvox_mysql")
        )
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute(
            "SELECT audio_data FROM user_videos WHERE user_id=%s AND video_id=%s AND tool='tool1'",
            (user_id, audio_id)
        )
        row = mysql_cur.fetchone()
        mysql_cur.close()
        mysql_conn.close()

        if row and row[0]:
            return Response(BytesIO(row[0]).read(), mimetype="audio/mpeg",
                            headers={"Content-Disposition": f"inline; filename={audio_id}.mp3"})
        return jsonify({"error": "File not found"}), 404
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to serve audio"}), 500


if __name__ == "__main__":
    app.run(port=9001, debug=True, host="0.0.0.0")