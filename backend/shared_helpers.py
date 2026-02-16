import os
import sqlite3
from datetime import datetime

# ---------------- CONFIG ----------------
DB_FILE = "main.db"

VIDEO_DIRS = {
    "tool1": "voiceover/audio",        # ✅ FIXED: voiceover -> voiceover/audio/<user_id>/<id>.mp3
    "tool2": "videos_static/temp",     # static videos
    "tool3": "videos_animated/temp"    # animated videos
}

# NOTE: Plan limits are now managed in the database via the 'plans' table
# This is kept as a fallback only
PLAN_LIMITS = {
    "free": {"tool1": 5, "tool2": 2, "tool3": 2},
    "pro": {"tool1": 100, "tool2": 50, "tool3": 50}
}

# ---------------- DB HELPERS ----------------
def get_conn():
    """Get database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initialize database tables.
    NOTE: This schema should match main.py's schema exactly.
    If main.py runs first, these CREATE TABLE IF NOT EXISTS will be skipped.
    """
    conn = get_conn()
    c = conn.cursor()

    # Users table - aligned with main.py schema
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        plan TEXT DEFAULT 'free',
        role TEXT DEFAULT 'user',
        suspend INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)

    # Plans table - per-tool limits (managed by admin)
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

    # User videos table - tracks all generated content
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

    conn.commit()
    conn.close()


def add_video_for_user(user_id, tool, video_id, filename):
    """
    Adds a new video/audio for a user.
    
    Args:
        user_id: User's unique ID
        tool: Tool identifier ("tool1", "tool2", "tool3")
        video_id: Unique identifier for this content
        filename: Filename to save (e.g., "{video_id}.mp3")
    
    Returns:
        Full filepath where the content was saved
    
    Raises:
        ValueError: If user_id is missing
    """
    if not user_id:
        raise ValueError("user_id is required")

    # Ensure user directory exists
    user_dir = os.path.join(VIDEO_DIRS[tool], user_id)
    os.makedirs(user_dir, exist_ok=True)
    filepath = os.path.join(user_dir, filename)

    now = datetime.utcnow().isoformat()

    conn = get_conn()
    c = conn.cursor()

    # Ensure user exists in DB (create placeholder if needed)
    c.execute("SELECT id FROM users WHERE id=?", (user_id,))
    if not c.fetchone():
        c.execute("""
            INSERT INTO users (id, plan, role, created_at)
            VALUES (?, 'free', 'user', ?)
        """, (user_id, now))
        conn.commit()

    # Insert video/audio record
    try:
        c.execute("""
            INSERT INTO user_videos (user_id, video_id, file_path, tool, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, video_id, filename, tool, now))
        conn.commit()
    except sqlite3.IntegrityError:
        # Video ID already exists, update instead
        c.execute("""
            UPDATE user_videos
            SET file_path = ?, created_at = ?
            WHERE video_id = ?
        """, (filename, now, video_id))
        conn.commit()

    conn.close()
    return filepath


def get_user_videos(user_id):
    """
    Get all videos/audio files for a user.
    
    Args:
        user_id: User's unique ID
    
    Returns:
        List of dicts with video metadata
        Each dict contains: video_id, audio_id, filename, tool, created_at
    """
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT video_id, file_path, tool, created_at
        FROM user_videos
        WHERE user_id=?
        ORDER BY created_at DESC
    """, (user_id,))
    rows = c.fetchall()
    conn.close()

    return [
        {
            "video_id": r["video_id"],
            "audio_id": r["video_id"],        # For voiceover compatibility
            "filename": r["file_path"],
            "tool": r["tool"],
            "created_at": r["created_at"]
        }
        for r in rows
    ]


def delete_video(user_id, video_id):
    """
    Delete a specific video/audio file and its database record.
    
    Args:
        user_id: User's unique ID
        video_id: Video/audio ID to delete
    
    Returns:
        True if deleted, False if not found
    """
    conn = get_conn()
    c = conn.cursor()
    
    # Get video info
    c.execute("""
        SELECT tool, file_path
        FROM user_videos
        WHERE user_id=? AND video_id=?
    """, (user_id, video_id))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return False
    
    tool = row["tool"]
    filename = row["file_path"]
    
    # Delete from database
    c.execute("""
        DELETE FROM user_videos
        WHERE user_id=? AND video_id=?
    """, (user_id, video_id))
    conn.commit()
    conn.close()
    
    # Delete physical file
    file_path = os.path.join(VIDEO_DIRS[tool], user_id, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"❌ Error deleting file {file_path}: {e}")
            return False
    
    return True


def delete_old_videos(user_id, tool, max_allowed=None):
    """
    Deletes old videos exceeding plan limits. Keeps most recent videos.
    
    Args:
        user_id: User's unique ID
        tool: Tool identifier
        max_allowed: Maximum allowed videos (fetched from DB if None)
    
    Returns:
        List of deleted file paths
    """
    videos = [v for v in get_user_videos(user_id) if v["tool"] == tool]

    if max_allowed is None:
        # Fetch from database plan
        conn = get_conn()
        c = conn.cursor()
        c.execute("SELECT plan FROM users WHERE id=?", (user_id,))
        row = c.fetchone()
        conn.close()
        
        plan = row["plan"] if row else "free"
        
        # Try to get from plans table first
        conn = get_conn()
        c = conn.cursor()
        c.execute(f"""
            SELECT tool1_videos, tool2_videos, tool3_videos
            FROM plans
            WHERE name=?
        """, (plan,))
        plan_row = c.fetchone()
        conn.close()
        
        if plan_row:
            tool_index = int(tool.replace("tool", "")) - 1
            max_allowed = [plan_row["tool1_videos"], plan_row["tool2_videos"], plan_row["tool3_videos"]][tool_index]
        else:
            # Fallback to hardcoded limits
            max_allowed = PLAN_LIMITS.get(plan, {}).get(tool, 1)

    deleted = []

    if len(videos) > max_allowed:
        for v in videos[max_allowed:]:
            file_path = os.path.join(VIDEO_DIRS[tool], user_id, v["filename"])
            
            # Delete physical file
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted.append(file_path)
                except Exception as e:
                    print(f"❌ Error deleting {file_path}: {e}")

            # Delete from database
            conn = get_conn()
            c = conn.cursor()
            c.execute("DELETE FROM user_videos WHERE video_id=?", (v["video_id"],))
            conn.commit()
            conn.close()

    return deleted


# NOTE: check_plan_limit() is defined in main.py and should be used from there
# This version is kept for reference only
def check_plan_limit_legacy(user_id, tool):
    """
    DEPRECATED: Use check_plan_limit() from main.py instead.
    This version uses hardcoded PLAN_LIMITS and is kept for backward compatibility only.
    """
    conn = get_conn()
    c = conn.cursor()
    
    c.execute("SELECT plan FROM users WHERE id=?", (user_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return True, PLAN_LIMITS["free"].get(tool, 1)

    plan = row["plan"]
    
    # Count current usage
    videos = get_user_videos(user_id)
    used = len([v for v in videos if v["tool"] == tool])
    
    max_allowed = PLAN_LIMITS.get(plan, {}).get(tool, 1)
    return used < max_allowed, max_allowed


# ---------------- FILE HELPERS ----------------
def ensure_dirs():
    """Create all required directories if they don't exist"""
    for path in VIDEO_DIRS.values():
        os.makedirs(path, exist_ok=True)


def clear_temp_files(tool):
    """
    Clear all temporary files for a specific tool.
    WARNING: This deletes ALL files in the tool's directory!
    """
    folder = VIDEO_DIRS.get(tool)
    if folder and os.path.exists(folder):
        for f in os.listdir(folder):
            file_path = os.path.join(folder, f)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"❌ Error deleting {file_path}: {e}")


# ---------------- INIT ----------------
ensure_dirs()
init_db()