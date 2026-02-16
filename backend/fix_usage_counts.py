import sqlite3

DB_PATH = "main.db"  # adjust ONLY if your DB is elsewhere

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute("""
UPDATE users
SET
  tool1 = COALESCE(tool1, 0),
  tool2 = COALESCE(tool2, 0),
  tool3 = COALESCE(tool3, 0),
  total_videos = COALESCE(total_videos, 0)
""")

conn.commit()
conn.close()

print("✅ User usage counters normalized successfully")
