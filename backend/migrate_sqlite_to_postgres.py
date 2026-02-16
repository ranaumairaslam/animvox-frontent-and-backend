import sqlite3
import psycopg2

# 1️⃣ SQLite connection
sqlite_conn = sqlite3.connect("main.db")
sqlite_cursor = sqlite_conn.cursor()

# 2️⃣ PostgreSQL connection
pg_conn = psycopg2.connect(
    dbname="animvox_db",
    user="postgres",
    password="Myhoney_123",
    host="localhost",
    port="5432"
)
pg_cursor = pg_conn.cursor()

# ---------- USERS ----------
sqlite_cursor.execute("SELECT * FROM users")
users = sqlite_cursor.fetchall()

for u in users:
    pg_cursor.execute("""
        INSERT INTO users VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, u)

# ---------- PLANS ----------
sqlite_cursor.execute("""
    SELECT name, videos, price, tool1_videos, tool2_videos, tool3_videos
    FROM plans
""")
plans = sqlite_cursor.fetchall()

for p in plans:
    pg_cursor.execute("""
        INSERT INTO plans
        (name, videos, price, tool1_videos, tool2_videos, tool3_videos)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, p)

# ---------- USER VIDEOS ----------
sqlite_cursor.execute("""
    SELECT user_id, video_id, filename, tool, created_at, file_path, tool_name, suspend
    FROM user_videos
""")
videos = sqlite_cursor.fetchall()

for v in videos:
    pg_cursor.execute("""
        INSERT INTO user_videos
        (user_id, video_id, filename, tool, created_at, file_path, tool_name, suspend)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, v)

pg_conn.commit()

print("✅ Data successfully moved from SQLite to PostgreSQL ")

sqlite_conn.close()
pg_conn.close()
