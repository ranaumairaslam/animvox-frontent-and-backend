import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory, make_response
from flask import Response
from flask_cors import CORS, cross_origin
import jwt
from functools import wraps
import threading
from threading import Thread
from task_queue import task_queue, start_workers, get_queue_size
from io import BytesIO

import json
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from shared_helpers import get_conn

# ================== LOAD .ENV SECRETS ==================
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ADMINS = {os.getenv("ADMIN_EMAIL"): os.getenv("ADMIN_PASSWORD")}
DB_FILE = os.getenv("DB_FILE", "main.db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "animvox_mysql")

# ---- Shared helpers ----
from shared_helpers import add_video_for_user, get_user_videos, delete_old_videos, VIDEO_DIRS

# ---- Tool functions ----
from voiceover.app import (
    generate_tts_async as tool1_generate,
    progress_status as tool1_progress,
    generate_tts,
    save_tts_to_user,
    list_edge_voices,
)
from videos_static.app import generate_video_async as tool2_generate, progress_status as tool2_progress
from videos_animated.app import generate_story_video as tool3_generate, progress_status as tool3_progress

# ---- Config ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__)

# ✅ START WORKER THREADS FOR TASK QUEUE
print("=" * 60)
print("🚀 INITIALIZING ANIMVOX API SERVER")
print("=" * 60)
start_workers(num_workers=3)  # 3 workers for parallel processing

# -------------------- ROOT ROUTE --------------------
@app.route('/')
def home():
    queue_size = get_queue_size()
    return jsonify({
        "message": "Welcome to AnimVox API!",
        "queue_size": queue_size,
        "status": "running"
    })

# -------------------- CONSOLIDATED CORS --------------------
CORS(
    app,
    resources={
        r"/admin/*": {"origins": "http://localhost:5174"},
        r"/user/*": {"origins": "http://localhost:5173"},
        r"/signup": {"origins": "http://localhost:5173"},
        r"/login": {"origins": "http://localhost:5173"},
        r"/voices": {"origins": "http://localhost:5173"},
        r"/generate/voiceover": {"origins": "http://localhost:5173"},
        r"/internal/voiceover": {"origins": "http://localhost:5173"},
        r"/public/voiceover/*": {"origins": "http://localhost:5173"},
        r"/public/static/*": {"origins": "http://localhost:5173"},      
        r"/public/animated/*": {"origins": "http://localhost:5173"},    
        r"/generate/*": {"origins": "http://localhost:5173"},
        r"/progress/*": {"origins": "http://localhost:5173"},
        r"/download/*": {"origins": "http://localhost:5173"},
    },
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)

# ================= INIT DB =================
def init_db():
    first_time = not os.path.exists(DB_FILE)
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        plan TEXT,
        role TEXT,
        suspend INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS user_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        tool TEXT,
        video_id TEXT,
        file_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        tool1_videos INTEGER DEFAULT 0,
        tool2_videos INTEGER DEFAULT 0,
        tool3_videos INTEGER DEFAULT 0,
        price REAL DEFAULT 0.0
    )
    """)

    conn.commit()
    conn.close()

    if first_time:
        print("✅ Database created and initialized.")
    else:
        print("✅ Database exists. Checked tables.")

init_db()

# ================= JWT DECORATORS =================
def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return '', 200

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Admin token missing"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if data.get("role") != "admin":
                return jsonify({"error": "Admin access required"}), 403
        except Exception as e:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return '', 200

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "User token missing"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = data.get("user_id")
            if not user_id:
                return jsonify({"error": "Invalid token"}), 401

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT suspend FROM users WHERE id=?", (user_id,))
            row = c.fetchone()
            conn.close()
            if row and row[0] == 1:
                return jsonify({"error": "Account suspended"}), 403

        except Exception as e:
            return jsonify({"error": "Invalid token"}), 401

        return f(user_id=user_id, *args, **kwargs)
    return decorated

# ================= PLAN LIMITS =================
def check_plan_limit(user_id, tool):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("SELECT plan FROM users WHERE id=?", (user_id,))
    row = c.fetchone()
    plan_name = row[0] if row else "free"

    if plan_name == "free":
        free_limits = {
            "tool1": 1,   
            "tool2": 1,   
            "tool3": 1    
        }
        max_allowed = free_limits.get(tool, 0)
        conn.close()
        return True, max_allowed

    c.execute(
        "SELECT tool1_videos, tool2_videos, tool3_videos FROM plans WHERE name=?",
        (plan_name,)
    )
    plan_row = c.fetchone()

    c.execute(
        "SELECT COUNT(*) FROM user_videos WHERE user_id=? AND tool=?",
        (user_id, tool)
    )
    used_count = c.fetchone()[0]

    conn.close()

    if plan_row:
        limits = {
            "tool1": plan_row[0],
            "tool2": plan_row[1],
            "tool3": plan_row[2]
        }
        max_allowed = limits.get(tool, 0)
    else:
        max_allowed = 0

    return (used_count < max_allowed), max_allowed

# ================= AUTH ROUTES =================
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, password FROM users WHERE email=?", (email,))
    row = c.fetchone()
    conn.close()

    if row and check_password_hash(row[1], password):
        token = jwt.encode({"user_id": row[0]}, SECRET_KEY, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        return jsonify({"user_id": row[0], "token": token})

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute("SELECT id FROM users WHERE email=?", (email,))
    if c.fetchone():
        conn.close()
        return jsonify({"error": "User already exists"}), 400
    
    user_id = str(uuid.uuid4())
    hashed_password = generate_password_hash(password)
    
    c.execute("""
        INSERT INTO users (id, email, password, plan, role, created_at)
        VALUES (?, ?, ?, 'free', 'user', ?)
    """, (user_id, email, hashed_password, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()
    
    token = jwt.encode({"user_id": user_id}, SECRET_KEY, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    
    return jsonify({"user_id": user_id, "token": token})

# ================= USER PROFILE ROUTES =================
@app.route("/user/profile", methods=["GET"])
@token_required
def get_user_profile(user_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()

        c.execute("""
            SELECT email, plan, role, created_at, suspend
            FROM users
            WHERE id=?
        """, (user_id,))

        row = c.fetchone()
        if not row:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "email": row[0],
            "plan": row[1],
            "role": row[2],
            "created_at": row[3],
            "suspend": bool(row[4])
        })

    except Exception as e:
        print("❌ Profile fetch error:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route("/user/profile", methods=["PUT"])
@token_required
def update_user_profile(user_id):
    data = request.json or {}

    name = data.get("name")
    mobile = data.get("mobile")

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("""
        UPDATE users
        SET name = ?, mobile = ?
        WHERE id = ?
    """, (name, mobile, user_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "Profile updated successfully"})

@app.route("/user/videos", methods=["GET"])
@token_required
def get_user_videos_route(user_id):
    try:
        videos = get_user_videos(user_id)
        return jsonify(videos)
    except Exception as e:
        print("❌ Error fetching videos:", e)
        return jsonify({"error": "Failed to fetch videos"}), 500

@app.route("/user/videos/<video_id>", methods=["DELETE"])
@token_required
def delete_user_video(user_id, video_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute("SELECT tool, file_path FROM user_videos WHERE user_id=? AND video_id=?", 
                  (user_id, video_id))
        row = c.fetchone()
        
        if not row:
            conn.close()
            return jsonify({"error": "Video not found"}), 404
        
        tool, file_path = row
        
        c.execute("DELETE FROM user_videos WHERE user_id=? AND video_id=?", 
                  (user_id, video_id))
        conn.commit()
        conn.close()
        
        full_path = os.path.join(VIDEO_DIRS.get(tool, ""), user_id, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        
        return jsonify({"message": "Video deleted successfully"})
        
    except Exception as e:
        print("❌ Error deleting video:", e)
        return jsonify({"error": "Failed to delete video"}), 500

# =================== ADMIN ROUTES ===================

@app.route("/admin/login", methods=["POST"])
@cross_origin(origins="http://localhost:5174", supports_credentials=True)
def admin_login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if ADMINS.get(email) == password:
        token = jwt.encode(
            {
                "admin_email": email,
                "role": "admin",
                "exp": datetime.utcnow() + timedelta(days=1)
            },
            SECRET_KEY,
            algorithm="HS256"
        )
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        return jsonify({"token": token})

    return jsonify({"error": "Invalid admin credentials"}), 401

@app.route("/admin/users", methods=["GET"])
@admin_token_required
@cross_origin(origins="http://localhost:5174", supports_credentials=True)
def admin_fetch_users():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()

        c.execute("SELECT id, email, plan, role, created_at, suspend FROM users")
        rows = c.fetchall()

        users = []
        for row in rows:
            user_id = row[0]
            c.execute("SELECT COUNT(*) FROM user_videos WHERE user_id=?", (user_id,))
            total_videos = c.fetchone()[0]

            users.append({
                "id": user_id,
                "email": row[1],
                "plan": row[2],
                "role": row[3],
                "created_at": row[4],
                "suspend": bool(row[5]),
                "total_videos": total_videos
            })

        return jsonify(users)
    except Exception as e:
        print(f"❌ Admin fetch users error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route("/admin/users/<user_id>", methods=["PATCH"])
@admin_token_required
@cross_origin(origins="http://localhost:5174", supports_credentials=True)
def admin_update_user(user_id):
    try:
        data = request.get_json() or {}
        fields, values = [], []

        if "plan" in data:
            fields.append("plan=?")
            values.append(data["plan"])
        if "suspend" in data:
            fields.append("suspend=?")
            values.append(int(bool(data["suspend"])))

        if not fields:
            return jsonify({"error": "No fields to update"}), 400

        values.append(user_id)
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", values)
        conn.commit()

        return jsonify({"status": "success"})
    except Exception as e:
        print(f"❌ Admin update user error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route("/admin/plans", methods=["GET"])
@admin_token_required
@cross_origin(origins="http://localhost:5174", supports_credentials=True)
def admin_fetch_plans():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""
            SELECT id, name, tool1_videos, tool2_videos, tool3_videos, price
            FROM plans
        """)
        plans = []
        for r in c.fetchall():
            plans.append({
                "id": r[0],
                "name": r[1],
                "tool1_videos": r[2],
                "tool2_videos": r[3],
                "tool3_videos": r[4],
                "price": r[5]
            })
        return jsonify(plans)
    except Exception as e:
        print(f"❌ Admin fetch plans error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route("/admin/plans", methods=["POST"])
@admin_token_required
def admin_create_plan():
    data = request.get_json() or {}
    name = data.get("name")
    tool1_videos = data.get("tool1_videos", 0)
    tool2_videos = data.get("tool2_videos", 0)
    tool3_videos = data.get("tool3_videos", 0)
    price = data.get("price", 0.0)

    if not name:
        return jsonify({"error": "Plan name required"}), 400

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO plans (name, tool1_videos, tool2_videos, tool3_videos, price)
            VALUES (?, ?, ?, ?, ?)
        """, (name, tool1_videos, tool2_videos, tool3_videos, price))
        conn.commit()
        return jsonify({"status": "success"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Plan already exists"}), 400
    finally:
        conn.close()

@app.route("/admin/plans/<int:plan_id>", methods=["PATCH"])
@admin_token_required
def admin_update_plan(plan_id):
    data = request.get_json() or {}
    fields, values = [], []

    for key in ["name", "tool1_videos", "tool2_videos", "tool3_videos", "price"]:
        if key in data:
            fields.append(f"{key}=?")
            values.append(data[key])

    if not fields:
        return jsonify({"error": "No fields to update"}), 400

    values.append(plan_id)
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(f"UPDATE plans SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route("/admin/plans/<int:plan_id>", methods=["DELETE"])
@admin_token_required
@cross_origin(origins="http://localhost:5174", supports_credentials=True)
def admin_delete_plan(plan_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("UPDATE users SET plan='free' WHERE plan=(SELECT name FROM plans WHERE id=?)", (plan_id,))
        c.execute("DELETE FROM plans WHERE id=?", (plan_id,))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"❌ Admin delete plan error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route("/admin/usage", methods=["GET"])
@admin_token_required
def admin_usage():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()

        c.execute("""
            SELECT 
                u.id,
                u.email,
                COUNT(uv.id) AS total_videos,
                SUM(CASE WHEN uv.tool = 'tool1' THEN 1 ELSE 0 END) AS tool1,
                SUM(CASE WHEN uv.tool = 'tool2' THEN 1 ELSE 0 END) AS tool2,
                SUM(CASE WHEN uv.tool = 'tool3' THEN 1 ELSE 0 END) AS tool3
            FROM users u
            LEFT JOIN user_videos uv ON u.id = uv.user_id
            GROUP BY u.id, u.email
        """)

        rows = c.fetchall()
        conn.close()

        return jsonify([
            {
                "id": r[0],
                "email": r[1],
                "total_videos": r[2],
                "tool1": r[3],
                "tool2": r[4],
                "tool3": r[5]
            }
            for r in rows
        ])
    except Exception as e:
        print(f"❌ Admin usage error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/admin/users/<user_id>/reset_password", methods=["POST"])
@admin_token_required
def admin_reset_password(user_id):
    try:
        new_password = str(uuid.uuid4())[:8]
        hashed = generate_password_hash(new_password)
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("UPDATE users SET password=? WHERE id=?", (hashed, user_id))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "temp_password": new_password})
    except Exception as e:
        print(f"❌ Reset password error: {e}")
        return jsonify({"error": "Failed to reset password"}), 500

@app.route("/admin/users/bulk_update_plan", methods=["POST"])
@admin_token_required
def admin_bulk_update_plan():
    try:
        data = request.get_json() or {}
        user_ids = data.get("user_ids", [])
        new_plan = data.get("plan")
        if not user_ids or not new_plan:
            return jsonify({"error": "User IDs and plan required"}), 400

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(f"UPDATE users SET plan=? WHERE id IN ({','.join(['?']*len(user_ids))})",
                  [new_plan] + user_ids)
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "updated_users": len(user_ids)})
    except Exception as e:
        print(f"❌ Bulk update plan error: {e}")
        return jsonify({"error": "Failed to update plan"}), 500

@app.route("/admin/videos", methods=["GET"])
@admin_token_required
def admin_fetch_videos():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""SELECT id, user_id, tool, video_id, file_path, created_at FROM user_videos""")
        videos = [{"id": r[0], "user_id": r[1], "tool": r[2], "video_id": r[3],
                   "file_path": r[4], "created_at": r[5]} for r in c.fetchall()]
        conn.close()
        return jsonify(videos)
    except Exception as e:
        print(f"❌ Fetch videos error: {e}")
        return jsonify({"error": "Failed to fetch videos"}), 500

@app.route("/admin/videos/<int:video_id>", methods=["DELETE"])
@admin_token_required
def admin_delete_video(video_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT file_path FROM user_videos WHERE id=?", (video_id,))
        row = c.fetchone()
        if row and os.path.exists(row[0]):
            os.remove(row[0])
        c.execute("DELETE FROM user_videos WHERE id=?", (video_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"❌ Delete video error: {e}")
        return jsonify({"error": "Failed to delete video"}), 500

@app.route("/admin/logs", methods=["GET"])
@admin_token_required
def admin_fetch_logs():
    try:
        logs_file = "admin_audit.log"
        if not os.path.exists(logs_file):
            return jsonify([])
        with open(logs_file, "r") as f:
            logs = [line.strip() for line in f.readlines()]
        return jsonify(logs)
    except Exception as e:
        print(f"❌ Fetch logs error: {e}")
        return jsonify({"error": "Failed to fetch logs"}), 500

@app.route("/admin/system_health", methods=["GET"])
@admin_token_required
def admin_system_health():
    try:
        import shutil, psutil
        total, used, free = shutil.disk_usage("/")
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent()
        return jsonify({
            "disk_total_gb": total // (1024**3),
            "disk_used_gb": used // (1024**3),
            "disk_free_gb": free // (1024**3),
            "memory_total_mb": memory.total // (1024**2),
            "memory_used_mb": memory.used // (1024**2),
            "memory_free_mb": memory.available // (1024**2),
            "cpu_percent": cpu_percent,
            "queue_size": get_queue_size()
        })
    except Exception as e:
        print(f"❌ System health error: {e}")
        return jsonify({"error": "Failed to fetch system health"}), 500

@app.route("/admin/users/export_csv", methods=["GET"])
@admin_token_required
def admin_export_users_csv():
    try:
        import csv
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT id, email, plan, role, created_at, suspend FROM users")
        rows = c.fetchall()
        conn.close()
        csv_file = "users_export.csv"
        with open(csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["id","email","plan","role","created_at","suspend"])
            writer.writerows(rows)
        return send_file(csv_file, as_attachment=True)
    except Exception as e:
        print(f"❌ Export CSV error: {e}")
        return jsonify({"error": "Failed to export users"}), 500

# =================== VOICEOVER ROUTES ===================

@app.route("/voices", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def get_voices():
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        voices = list_edge_voices()
        return jsonify([{
            "name": v["Name"],
            "shortName": v.get("ShortName"),
            "gender": v.get("Gender"),
            "locale": v.get("Locale")
        } for v in voices])
    except Exception as e:
        print(f"❌ Error fetching voices: {e}")
        return jsonify({"error": "Failed to fetch voices"}), 500

@app.route("/generate/voiceover", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def generate_voiceover_sync():
    """Synchronous voiceover - returns audio directly without queuing"""
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        text = data.get("text")
        language = data.get("language", "en")
        voice = data.get("voice", "male")
        rate = int(data.get("rate", 118))
        speed = float(data.get("speed", 1.0))
        volume = float(data.get("volume", 1.0))
        pitch = float(data.get("pitch", 0))
        user_id = data.get("user_id")

        if not text or not text.strip():
            return jsonify({"error": "Text is required"}), 400

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

    except Exception as e:
        print(f"❌ Sync voiceover generation error: {e}")
        return jsonify({"error": "Audio generation failed"}), 500

@app.route("/internal/voiceover", methods=["POST", "OPTIONS"])
@token_required
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def generate_voiceover_async(user_id):
    """Async voiceover - queues task and returns immediately"""
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        text = data.get("text")
        
        if not text or not text.strip():
            return jsonify({"error": "Text is required"}), 400

        can_generate, max_allowed = check_plan_limit(user_id, "tool1")
        if not can_generate:
            return jsonify({
                "error": f"Plan limit reached. Maximum {max_allowed} voiceovers allowed."
            }), 403

        audio_id = str(uuid.uuid4())
        tool1_progress[audio_id] = 0

        # ✅ QUEUE THE TASK
        print(f"📥 Queuing voiceover task: {audio_id}")
        task_queue.put((
            tool1_generate,
            (
                user_id,
                audio_id,
                text,
                data.get("language", "en"),
                data.get("voice", "male"),
                int(data.get("rate", 118)),
                float(data.get("speed", 1.0)),
                float(data.get("volume", 1.0)),
                float(data.get("pitch", 0)),
            )
        ))
        print(f"✅ Voiceover task queued: {audio_id} (Queue size: {get_queue_size()})")

        return jsonify({"status": "started", "audio_id": audio_id})

    except Exception as e:
        print(f"❌ Async voiceover generation error: {e}")
        return jsonify({"error": "Audio generation failed"}), 500

@app.route("/progress/<audio_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def get_voiceover_progress(audio_id):
    if request.method == "OPTIONS":
        return "", 200
    
    progress = tool1_progress.get(audio_id, 0)
    return jsonify({"progress": progress})

@app.route("/public/voiceover/<user_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def list_user_voiceovers(user_id):
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        files = get_user_videos(user_id)
        voiceover_files = [f for f in files if f.get("tool") == "tool1"]
        return jsonify(voiceover_files)
    except Exception as e:
        print(f"❌ Error listing voiceovers: {e}")
        return jsonify({"error": "Failed to fetch voiceovers"}), 500

@app.route("/public/voiceover/<user_id>/<audio_id>.mp3", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def serve_voiceover_audio(user_id, audio_id):
    """Serve voiceover audio files for playback in browser"""
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        audio_path = os.path.join(VIDEO_DIRS["tool1"], user_id, f"{audio_id}.mp3")
        
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype="audio/mpeg")
        elif audio_id in tool1_progress:
            return jsonify({"error": "Audio generation in progress"}), 404
        else:
            return jsonify({"error": "File not found"}), 404
            
    except Exception as e:
        print(f"❌ Error serving audio: {e}")
        return jsonify({"error": "Failed to serve audio"}), 500

@app.route("/progress/audio/<audio_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def voiceover_progress(user_id, audio_id):
    if request.method == "OPTIONS":
        return "", 200
    prog = tool1_progress.get(audio_id, 0)
    return jsonify({"progress": prog})

@app.route("/download/voiceover/<audio_id>/<user_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def download_voiceover(user_id, audio_id):
    if request.method == "OPTIONS":
        return "", 200
    path = os.path.join("voiceover/audio", user_id, f"{audio_id}.mp3")
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

# ================= STATIC VIDEO ROUTES =================

@app.route("/api/voices", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def get_cinematic_voices():
    if request.method == "OPTIONS":
        return "", 200
    from videos_static.app import CINEMATIC_VOICES
    return jsonify(CINEMATIC_VOICES)

@app.route("/api/preview_voice", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def preview_voice():
    if request.method == "OPTIONS":
        return "", 200
    from videos_static.app import _generate_preview_only, PREVIEW_DIR
    
    data = request.get_json()
    voice = data.get('voice', 'en-US-DavisNeural')
    
    preview_id = str(uuid.uuid4())[:12]
    preview_path = os.path.join(PREVIEW_DIR, f"{preview_id}.mp3")
    
    success = _generate_preview_only(voice, preview_path, "-5%")
    
    if success and os.path.exists(preview_path):
        return jsonify({"success": True, "preview_url": f"/static/previews/{preview_id}.mp3"})
    
    return jsonify({"error": "Failed to generate preview"}), 500

@app.route("/upload_images", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def upload_scene_images():
    if request.method == "OPTIONS":
        return "", 200
    from videos_static.app import UPLOADS_DIR
    
    try:
        # Clear old uploads
        for f in os.listdir(UPLOADS_DIR):
            fp = os.path.join(UPLOADS_DIR, f)
            if os.path.isfile(fp):
                os.remove(fp)

        files = request.files.getlist("images")
        saved = []
        for idx, file in enumerate(files, 1):
            if file and file.filename:
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
                name = f"{idx}.{ext}"
                file.save(os.path.join(UPLOADS_DIR, name))
                saved.append(name)
        
        return jsonify({"success": True, "files": saved})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/upload_music", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def upload_background_music():
    if request.method == "OPTIONS":
        return "", 200
    from videos_static.app import MUSIC_DIR
    
    try:
        file = request.files.get('music')
        if file and file.filename:
            path = os.path.join(MUSIC_DIR, "background_music.mp3")
            file.save(path)
            return jsonify({"success": True, "file": "background_music.mp3"})
        return jsonify({"error": "No file provided"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate/static", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def generate_static_video(user_id):
    if request.method == "OPTIONS":
        return "", 200
        
    from videos_static.app import VIDEOS_DIR, parse_script_text, generate_video_async, progress_status

    video_id = str(uuid.uuid4())
    user_video_dir = os.path.join(VIDEOS_DIR, user_id)
    os.makedirs(user_video_dir, exist_ok=True)
    progress_status[video_id] = 0

    # Get request data
    data = request.get_json()
    script_text = data.get("script_text", "")
    
    if not script_text.strip():
        return jsonify({"error": "Script text is required"}), 400

    # Parse scenes from script
    scenes = parse_script_text(script_text)
    if not scenes:
        return jsonify({"error": "No scenes found in script"}), 400

    # Settings
    settings = {
        'voice': data.get('voice', 'en-US-DavisNeural'),
        'rate': data.get('rate', '-5%'),
        'add_music': data.get('add_music', False),
        'music_file': data.get('music_file'),
        'music_volume': data.get('music_volume', 0.15)
    }

    # Check plan limit
    allowed, max_allowed = check_plan_limit(user_id, "tool2")
    if not allowed:
        return jsonify({"error": f"Plan limit exceeded ({max_allowed} videos allowed)"}), 403

    # Queue the task
    print(f"📥 Queuing static video task: {video_id}")
    task_queue.put((
        generate_video_async,
        (video_id, scenes, settings)
    ))
    print(f"✅ Static video task queued: {video_id} (Queue size: {get_queue_size()})")

    # Save to database
    add_video_for_user(user_id, "tool2", video_id, f"{video_id}.mp4")

    return jsonify({"video_id": video_id, "scenes_count": len(scenes)})

@app.route("/public/static/<user_id>/<video_id>.mp4", methods=["GET"])
def serve_static_video(user_id, video_id):
    from videos_static.app import VIDEOS_DIR
    video_path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")

    if not os.path.exists(video_path):
        return jsonify({"error": "Video not found"}), 404

    def generate():
        with open(video_path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    response = Response(generate(), mimetype="video/mp4")
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Content-Disposition"] = "inline"
    return response

@app.route("/download/static/<video_id>/<user_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def download_static_video(video_id, user_id):
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        from videos_static.app import VIDEOS_DIR
        path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")
        
        if os.path.exists(path):
            return send_file(path, 
                           mimetype="video/mp4",
                           as_attachment=True, 
                           download_name=f"static_{video_id}.mp4")
        else:
            return jsonify({"error": "Video not ready"}), 404
            
    except Exception as e:
        print(f"❌ Error downloading static video: {e}")
        return jsonify({"error": "Download failed"}), 500

@app.route("/progress/static/<video_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def static_video_progress(user_id, video_id):
    if request.method == "OPTIONS":
        return "", 200
    from videos_static.app import progress_status
    return jsonify({
        "progress": progress_status.get(video_id, 0)
    })

# Serve preview audio files
@app.route("/static/previews/<filename>", methods=["GET"])
def serve_preview(filename):
    from videos_static.app import PREVIEW_DIR
    return send_from_directory(PREVIEW_DIR, filename)
# ================= ANIMATED VIDEO ROUTES =================

@app.route("/public/animated/<user_id>/<video_id>.mp4", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def serve_animated_video(user_id, video_id):
    """✅ NEW: Serve animated video files for playback in browser"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        video_path = os.path.join(VIDEO_DIRS["tool3"], user_id, f"{video_id}.mp4")
        
        print(f"🔍 Looking for animated video at: {video_path}")
        print(f"📁 File exists: {os.path.exists(video_path)}")
        
        if os.path.exists(video_path):
            return send_file(video_path, mimetype="video/mp4")
        elif video_id in tool3_progress:
            return jsonify({"error": "Video generation in progress"}), 404
        else:
            return jsonify({"error": "Video not found"}), 404
            
    except Exception as e:
        print(f"❌ Error serving animated video: {e}")
        return jsonify({"error": "Failed to serve video"}), 500

@app.route("/download/animated/<video_id>/<user_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
def download_animated_video(video_id, user_id):
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        # Accept token from either header or query parameter
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            token = request.args.get("token", "")
        
        # Verify token
        if token:
            try:
                jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            except:
                return jsonify({"error": "Invalid token"}), 401
        
        from videos_animated.app import VIDEOS_DIR
        path = os.path.join(VIDEOS_DIR, user_id, f"{video_id}.mp4")
        
        print(f"🔍 Looking for animated video download at: {path}")
        print(f"📁 File exists: {os.path.exists(path)}")
        
        if os.path.exists(path):
            return send_file(path, 
                           mimetype="video/mp4",
                           as_attachment=True,
                           download_name=f"animated_{video_id}.mp4")
        else:
            return jsonify({"error": "Video not ready"}), 404
            
    except Exception as e:
        print(f"❌ Error downloading animated video: {e}")
        return jsonify({"error": "Download failed"}), 500

@app.route("/generate/animated", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def generate_animated_video(user_id):
    if request.method == "OPTIONS":
        return "", 200
        
    video_id = str(uuid.uuid4())

    allowed, max_allowed = check_plan_limit(user_id, "tool3")
    if not allowed:
        return jsonify({"error": f"Plan limit exceeded ({max_allowed} videos allowed)"}), 403

    story_json = request.form.get("story")
    if not story_json:
        return jsonify({"error": "Story data missing"}), 400

    try:
        story = json.loads(story_json)
    except:
        return jsonify({"error": "Invalid story JSON"}), 400

    from videos_animated.app import BG_DIR, VIDEOS_DIR

    user_bg_dir = os.path.join(BG_DIR, user_id)
    user_video_dir = os.path.join(VIDEOS_DIR, user_id)
    os.makedirs(user_bg_dir, exist_ok=True)
    os.makedirs(user_video_dir, exist_ok=True)

    # Save uploaded files
    scenes = story.get("scenes", [])
    for idx, scene in enumerate(scenes):
        bg_file = request.files.get(f"scenes[{idx}][background]")
        if bg_file:
            bg_path = os.path.join(user_bg_dir, f"{uuid.uuid4()}_{bg_file.filename}")
            bg_file.save(bg_path)
            scene["background"] = bg_path

        char_files = request.files.getlist(f"scenes[{idx}][characters][]")
        char_paths = []
        for cf in char_files:
            path = os.path.join(user_bg_dir, f"{uuid.uuid4()}_{cf.filename}")
            cf.save(path)
            char_paths.append(path)
        scene["characters"] = char_paths

    tool3_progress[video_id] = 0

    # ✅ QUEUE THE TASK
    print(f"📥 Queuing animated video task: {video_id}")
    task_queue.put((
        tool3_generate,
        (story, video_id, os.path.join(user_video_dir, f"{video_id}.mp4"))
    ))
    print(f"✅ Animated video task queued: {video_id} (Queue size: {get_queue_size()})")

    add_video_for_user(
        user_id,
        "tool3",
        video_id,
        f"{video_id}.mp4"
    )

    return jsonify({"video_id": video_id})

@app.route("/progress/animated/<video_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173", supports_credentials=True)
@token_required
def animated_progress(user_id, video_id):
    if request.method == "OPTIONS":
        return "", 200
    return jsonify({"progress": tool3_progress.get(video_id, 0)})

# ================= QUEUE STATUS ENDPOINT =================
@app.route("/queue/status", methods=["GET"])
@token_required
def queue_status(user_id):
    """Get current queue status"""
    return jsonify({
        "queue_size": get_queue_size(),
        "workers_active": len([w for w in threading.enumerate() if w.name.startswith("Worker-")])
    })

# ================= SQLITE → MYSQL AUTO MIGRATION =================
import mysql.connector

def migrate_sqlite_to_mysql():
    try:
        sqlite_conn = sqlite3.connect(DB_FILE)
        sqlite_cur = sqlite_conn.cursor()

        mysql_conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        mysql_cur = mysql_conn.cursor()

        mysql_cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) PRIMARY KEY,
            email TEXT,
            password TEXT,
            plan TEXT,
            role TEXT,
            suspend INT DEFAULT 0,
            created_at TEXT
        )
        """)

        mysql_cur.execute("""
        CREATE TABLE IF NOT EXISTS plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name TEXT,
            tool1_videos INT,
            tool2_videos INT,
            tool3_videos INT,
            price FLOAT
        )
        """)

        mysql_cur.execute("""
        CREATE TABLE IF NOT EXISTS user_videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100),
            tool TEXT,
            video_id TEXT,
            file_path TEXT,
            created_at TEXT
        )
        """)

        sqlite_cur.execute("""
            SELECT id, email, password, plan, role, suspend, created_at
            FROM users
        """)
        for row in sqlite_cur.fetchall():
            mysql_cur.execute("""
                INSERT IGNORE INTO users
                (id, email, password, plan, role, suspend, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, row)

        sqlite_cur.execute("""
            SELECT name, tool1_videos, tool2_videos, tool3_videos, price
            FROM plans
        """)
        for row in sqlite_cur.fetchall():
            mysql_cur.execute("""
                INSERT IGNORE INTO plans
                (name, tool1_videos, tool2_videos, tool3_videos, price)
                VALUES (%s,%s,%s,%s,%s)
            """, row)

        sqlite_cur.execute("""
            SELECT user_id, tool, video_id, file_path, created_at
            FROM user_videos
        """)
        for row in sqlite_cur.fetchall():
            mysql_cur.execute("""
                INSERT IGNORE INTO user_videos
                (user_id, tool, video_id, file_path, created_at)
                VALUES (%s,%s,%s,%s,%s)
            """, row)

        mysql_conn.commit()
        sqlite_conn.close()
        mysql_conn.close()

        print("✅ SQLite → MySQL migration completed successfully")

    except Exception as e:
        print("❌ MySQL Migration Error:", e)

# Run migration on app start
migrate_sqlite_to_mysql()

# ================= MAIN =================
if __name__=="__main__":
    print("=" * 60)
    print("🚀 ANIMVOX API SERVER READY")
    print("=" * 60)
    print(f"📊 Workers Active: 3")
    print(f"🔗 Port: 9001")
    print(f"📦 Queue System: Enabled")
    print("=" * 60)
    app.run(host="0.0.0.0", port=9001, debug=True)
    #app.run(host="0.0.0.0", port=9001, debug=False)
