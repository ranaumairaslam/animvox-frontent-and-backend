import os
import json
import math
import random
import shutil
import tempfile
import time
import uuid
import arabic_reshaper
import numpy as np
from bidi.algorithm import get_display
from flask import Flask, request, jsonify
from flask_cors import CORS
from gtts import gTTS
from moviepy.editor import (
    AudioFileClip,
    ColorClip,
    CompositeVideoClip,
    ImageClip,
    concatenate_videoclips,
)
from moviepy.video.fx.all import fadein, fadeout, resize
from moviepy.audio.fx.audio_normalize import audio_normalize
from PIL import Image, ImageDraw, ImageFont
import pyttsx3

# ---------------- CONFIG ----------------
STORY_FILE = "story.json"
OUTPUT_DIR = "animated_videos"
AUDIO_DIR = "audio"
TEMP_DIR = "temp"
BG_DIR = "backgrounds"
VIDEOS_DIR = OUTPUT_DIR
EN_FONT_PATH = "fonts/DejaVuSans-Bold.ttf"
UR_FONT_PATH = "fonts/NotoNaskhArabic-Regular.ttf"
W, H = 1280, 720
DEFAULT_CHAR_SCALE = 1.6
DEFAULT_CHAR_X = 300
DEFAULT_CHAR_Y = 200
SUBTITLE_HEIGHT = 140
SUBTITLE_SPACING = 40

for folder in [AUDIO_DIR, TEMP_DIR, BG_DIR, "characters", OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

progress_status = {}
app = Flask(__name__)
CORS(app)


# ------------------ Motion / Effects ------------------
def camera_2p5d_motion(clip, zoom=1.04, move=20):
    return (
        clip
        .fl(lambda gf, t: gf(t), apply_to=["mask"])
        .set_position(lambda t: (move * math.sin(t * 0.2), move * math.cos(t * 0.15)))
        .fx(resize, lambda t: 1 + (zoom - 1) * (t / clip.duration))
    )


def float_motion(clip, amplitude=8, speed=1, base_pos=(0, 0)):
    bx, by = base_pos
    return clip.set_position(lambda t: (bx, by + amplitude * math.sin(t * speed)))


def side_parallax(clip, shift=10, base_pos=(0, 0)):
    bx, by = base_pos
    return clip.set_position(lambda t: (bx + shift * math.sin(t * 0.3), by))


def dust_particles(duration, count=25):
    particles = []
    for _ in range(count):
        size = random.randint(3, 8)
        x, y = random.randint(0, W), random.randint(0, H)
        img = Image.new("RGBA", (size, size), (255, 255, 255, 25))
        clip = (
            ImageClip(np.array(img))
            .set_duration(duration)
            .set_position(lambda t, x=x, y=y: (x + math.sin(t * 0.5) * 50, y + math.cos(t * 0.3) * 30))
            .set_opacity(0.4)
        )
        particles.append(clip)
    return particles


def vignette_mask(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i in range(w):
        for j in range(h):
            dx = abs(i - w / 2) / (w / 2)
            dy = abs(j - h / 2) / (h / 2)
            shade = int(min(255, (dx * dx + dy * dy) ** 0.6 * 180))
            draw.point((i, j), fill=(0, 0, 0, shade))
    return ImageClip(np.array(img))


def lighting_overlay():
    return ImageClip(np.array(Image.new("RGBA", (W, H), (255, 255, 255, 20)))).set_opacity(0.15)


# ------------------ Subtitles ------------------
def create_line_by_line_karaoke(dialogue, duration, lang="en"):
    clips = []
    words = dialogue.split()
    n_words = len(words)
    if not dialogue.strip() or n_words == 0:
        return clips

    word_duration = duration / n_words
    is_rtl = lang.lower() == "ur"
    font_path = UR_FONT_PATH if is_rtl else "arialbd.ttf"

    try:
        font = ImageFont.truetype(font_path, 50)
    except Exception:
        font = ImageFont.load_default()

    display_words = (
        [get_display(arabic_reshaper.reshape(w)) for w in words][::-1]
        if is_rtl
        else words
    )

    for idx in range(n_words):
        img = Image.new("RGBA", (W, SUBTITLE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        start = max(0, idx - 1)
        end = min(n_words, idx + 2)
        chunk = display_words[start:end]
        widths = [draw.textbbox((0, 0), w, font=font)[2] for w in chunk]
        total_w = sum(widths) + SUBTITLE_SPACING * max(0, len(chunk) - 1)
        x = (W - total_w) // 2
        y = (SUBTITLE_HEIGHT - font.size) // 2

        for i, w in enumerate(chunk[::-1] if is_rtl else chunk):
            real_idx = start + (len(chunk) - 1 - i if is_rtl else i)
            color = "yellow" if real_idx == idx else ("white" if real_idx < idx else "gray")
            draw.text((x, y), w, font=font, fill=color)
            x += widths[i] + SUBTITLE_SPACING

        clip = (
            ImageClip(np.array(img))
            .set_duration(word_duration)
            .set_start(idx * word_duration)
            .set_position(("center", H - SUBTITLE_HEIGHT))
            .set_fps(24)
        )
        clips.append(clip)

    return clips


# ------------------ Background Remover ------------------
def remove_background(img: Image.Image, tolerance=50) -> Image.Image:
    """
    Remove background using flood-fill from corners.
    Only removes pixels connected to the image border — character colors stay intact.
    """
    img = img.convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    # Sample background color from corners
    corners = [arr[0, 0, :3], arr[0, w-1, :3], arr[h-1, 0, :3], arr[h-1, w-1, :3]]
    bg_color = np.mean(corners, axis=0)

    # Create mask: True = background pixel (similar to bg_color)
    rgb = arr[:, :, :3].astype(float)
    diff = np.sqrt(np.sum((rgb - bg_color) ** 2, axis=2))
    similar_to_bg = diff < tolerance

    # Flood fill from all 4 edges to find connected background
    from collections import deque
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Seed from border pixels that are similar to background
    for x in range(w):
        if similar_to_bg[0, x] and not visited[0, x]:
            queue.append((0, x))
            visited[0, x] = True
        if similar_to_bg[h-1, x] and not visited[h-1, x]:
            queue.append((h-1, x))
            visited[h-1, x] = True
    for y in range(h):
        if similar_to_bg[y, 0] and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if similar_to_bg[y, w-1] and not visited[y, w-1]:
            queue.append((y, w-1))
            visited[y, w-1] = True

    # BFS flood fill
    while queue:
        y, x = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and similar_to_bg[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    # Smooth edges: pixels near background get partial transparency
    result = arr.copy()
    result[visited, 3] = 0  # fully transparent background

    # Soften edges — neighbors of background get semi-transparent
    from scipy.ndimage import binary_dilation
    edge_mask = binary_dilation(visited, iterations=2) & ~visited
    result[edge_mask, 3] = (result[edge_mask, 3] * 0.3).astype(np.uint8)

    return Image.fromarray(result, "RGBA")


# ------------------ Character Animation ------------------
def get_character_frames(ch, duration, base_pos, fps=24):
    """
    Returns list of (pos, rgb_frame, alpha_array) tuples — one per video frame.
    Character is NOT added as a MoviePy clip. Instead, caller composites it directly.
    """
    try:
        if isinstance(ch, str):
            ch = {"file": ch}

        char_file = ch.get("file")
        if not char_file:
            return None

        char_path = (
            char_file
            if os.path.exists(char_file)
            else os.path.join("characters", os.path.basename(char_file))
        )
        if not os.path.exists(char_path):
            print(f"Character file not found: {char_path}")
            return None

        raw = Image.open(char_path).convert("RGBA")

        # Always remove near-white background (handles both transparent and non-transparent PNGs)
        raw = remove_background(raw)

        scale = float(ch.get("scale", DEFAULT_CHAR_SCALE))
        w2, h2 = int(raw.width * scale), int(raw.height * scale)
        base_img = raw.resize((w2, h2), Image.LANCZOS)

        total_frames = max(1, int(duration * fps))
        frames = []
        for i in range(total_frames):
            t = i / fps
            angle = 3 * math.sin(t * 0.8)
            rotated = base_img.rotate(angle, resample=Image.BICUBIC, expand=False)
            frames.append(rotated)  # RGBA PIL images

        return {"frames": frames, "pos": base_pos, "size": (w2, h2)}

    except Exception as e:
        print(f"Character frame error: {e}")
        return None


def composite_characters_on_bg(bg_pil_rgb, char_data_list, frame_idx):
    """
    Paste all characters onto a background RGB PIL image using proper alpha compositing.
    Returns final RGB PIL image.
    """
    result = bg_pil_rgb.copy().convert("RGBA")
    for cd in char_data_list:
        frames = cd["frames"]
        idx = min(frame_idx, len(frames) - 1)
        char_frame = frames[idx]  # RGBA PIL image
        px, py = int(cd["pos"][0]), int(cd["pos"][1])
        result.paste(char_frame, (px, py), char_frame)
    return result.convert("RGB")


# ------------------ TTS ------------------
def _generate_tts_audio(scene, audio_path):
    """Generate TTS audio for a scene. Returns AudioFileClip or None."""
    dialogue = scene.get("dialogue", "").strip()
    if not dialogue:
        return None, 3

    try:
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        voice = scene.get("voice", "female")
        tts_lang = scene.get("tts_lang", "ur")

        if voice == "female":
            gTTS(dialogue, lang=tts_lang).save(audio_path)
        else:
            engine = pyttsx3.init()
            engine.setProperty("rate", 150)
            male_voice = next(
                (
                    v.id
                    for v in engine.getProperty("voices")
                    if "male" in v.name.lower() or "english" in v.name.lower()
                ),
                None,
            )
            if male_voice:
                engine.setProperty("voice", male_voice)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tf:
                temp_path = tf.name
            engine.save_to_file(dialogue, temp_path)
            engine.runAndWait()
            time.sleep(0.5)
            shutil.move(temp_path, audio_path)

        audio_clip = AudioFileClip(audio_path).fx(audio_normalize)
        return audio_clip, audio_clip.duration

    except Exception as e:
        print(f"TTS error: {e}")
        return None, 3


# ------------------ Generate Story Video ------------------
def generate_story_video(story_data, video_id=None, output_path=None):
    progress_status[video_id] = 0
    time.sleep(0.3)

    scenes = story_data.get("scenes", [])
    total_scenes = len(scenes)
    if total_scenes == 0:
        progress_status[video_id] = -1
        return None, None

    progress_status[video_id] = 5
    SCENE_START, SCENE_END = 5, 70
    scene_range = SCENE_END - SCENE_START
    final_clips = []

    for i, scene in enumerate(scenes):
        prog_base = SCENE_START + int((i / total_scenes) * scene_range)
        prog_next = SCENE_START + int(((i + 1) / total_scenes) * scene_range)
        progress_status[video_id] = prog_base
        time.sleep(0.1)

        audio_path = os.path.join(
            AUDIO_DIR,
            f"{video_id}_scene_{i}.mp3" if video_id else f"scene_{i}.mp3"
        )
        audio_clip, duration = _generate_tts_audio(scene, audio_path)

        progress_status[video_id] = prog_base + (prog_next - prog_base) // 2
        time.sleep(0.1)

        scene_elements = []

        # Load background as PIL image
        try:
            bg_path = scene.get("background")
            if bg_path and os.path.exists(bg_path):
                bg_pil = Image.open(bg_path).convert("RGB").resize((W, H))
            else:
                bg_pil = Image.new("RGB", (W, H), (0, 0, 0))
        except Exception as e:
            print(f"Background error for scene {i}: {e}")
            continue

        # Load all character data
        characters = scene.get("characters", [])
        num_chars = len(characters)
        char_spacing = W // (num_chars + 1) if num_chars > 0 else W // 2
        char_data_list = []

        for idx, ch in enumerate(characters):
            try:
                ch_obj = {"file": ch} if isinstance(ch, str) else dict(ch)
                ch_obj["scale"] = float(ch_obj.get("scale", DEFAULT_CHAR_SCALE))
                ch_x = float(ch_obj.get("x", char_spacing * (idx + 1)))
                ch_y = float(ch_obj.get("y", DEFAULT_CHAR_Y))
                cd = get_character_frames(ch_obj, duration, base_pos=(ch_x, ch_y))
                if cd:
                    char_data_list.append(cd)
            except Exception as e:
                print(f"Character error: {e}")

        # Build per-frame composited video using VideoClip
        fps = 24
        total_frames = max(1, int(duration * fps))

        # Pre-bake subtitle clips separately (still MoviePy)
        subtitle_clips = []
        dialogue = scene.get("dialogue", "")
        if dialogue.strip():
            try:
                lang = "ur" if any("\u0600" <= c <= "\u06FF" for c in dialogue) else "en"
                subtitle_clips = create_line_by_line_karaoke(dialogue, duration, lang=lang)
            except Exception as e:
                print(f"Subtitle error: {e}")

        # Pre-bake all composited frames (bg + characters) as numpy RGB arrays
        composited_frames = []
        for fi in range(total_frames):
            frame_img = composite_characters_on_bg(bg_pil, char_data_list, fi)
            composited_frames.append(np.array(frame_img))

        from moviepy.editor import VideoClip

        def make_scene_frame(t):
            idx = min(int(t * fps), total_frames - 1)
            return composited_frames[idx]

        bg_char_clip = VideoClip(make_scene_frame, duration=duration)

        # Combine with subtitle clips on top
        if subtitle_clips:
            clip = CompositeVideoClip([bg_char_clip] + subtitle_clips, size=(W, H))
        else:
            clip = bg_char_clip

        if audio_clip:
            clip = clip.set_audio(audio_clip)

        final_clips.append(clip)
        progress_status[video_id] = prog_next
        time.sleep(0.1)

    if not final_clips:
        progress_status[video_id] = -1
        return None, None

    progress_status[video_id] = 70
    time.sleep(0.2)

    video = concatenate_videoclips(final_clips, method="compose")
    progress_status[video_id] = 80
    time.sleep(0.2)

    if not output_path:
        output_path = os.path.join(
            OUTPUT_DIR,
            f"{video_id}.mp4" if video_id else "output.mp4"
        )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    progress_status[video_id] = 90
    time.sleep(0.2)

    video.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")
    progress_status[video_id] = 100
    return video_id, output_path


# ------------------ Flask Endpoints ------------------
@app.route("/generate/animated", methods=["POST"])
def generate_animated_endpoint():
    try:
        story_data = json.loads(request.form.get("story", "{}"))
        video_id = str(uuid.uuid4())
        video_id, _ = generate_story_video(story_data, video_id=video_id)
        progress_status[video_id] = 100
        return jsonify({"video_id": video_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/progress/animated/<video_id>")
def animated_progress(video_id):
    return jsonify({"progress": progress_status.get(video_id, 0)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8500, debug=True)