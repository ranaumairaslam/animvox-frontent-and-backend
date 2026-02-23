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
    AudioFileClip, ColorClip, CompositeVideoClip, ImageClip,
    concatenate_videoclips,
)
from moviepy.video.fx.all import fadein, fadeout, resize
from moviepy.audio.fx.audio_normalize import audio_normalize
from PIL import Image, ImageDraw, ImageFont
import pyttsx3

# ---------------- CONFIG ----------------
STORY_FILE  = "story.json"
OUTPUT_DIR  = "animated_videos"
AUDIO_DIR   = "audio"
TEMP_DIR    = "temp"
BG_DIR      = "backgrounds"
VIDEOS_DIR  = OUTPUT_DIR

EN_FONT_PATH = "fonts/DejaVuSans-Bold.ttf"
UR_FONT_PATH = "fonts/NotoNaskhArabic-Regular.ttf"

W, H = 1280, 720

DEFAULT_CHAR_SCALE = 1.6
DEFAULT_CHAR_X     = 300
DEFAULT_CHAR_Y     = 200

SUBTITLE_HEIGHT  = 140
SUBTITLE_SPACING = 40

for folder in [AUDIO_DIR, TEMP_DIR, BG_DIR, "characters", OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

progress_status = {}

app = Flask(__name__)
CORS(app)

# ------------------ Motion / Effects ------------------

def camera_2p5d_motion(clip, zoom=1.04, move=20):
    return (clip
            .fl(lambda gf, t: gf(t), apply_to=["mask"])
            .set_position(lambda t: (move * math.sin(t * 0.2), move * math.cos(t * 0.15)))
            .fx(resize, lambda t: 1 + (zoom - 1) * (t / clip.duration)))

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
        img  = Image.new("RGBA", (size, size), (255, 255, 255, 25))
        clip = (ImageClip(np.array(img))
                .set_duration(duration)
                .set_position(lambda t, x=x, y=y: (x + math.sin(t * 0.5) * 50, y + math.cos(t * 0.3) * 30))
                .set_opacity(0.4))
        particles.append(clip)
    return particles

def vignette_mask(w, h):
    img  = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i in range(w):
        for j in range(h):
            dx    = abs(i - w / 2) / (w / 2)
            dy    = abs(j - h / 2) / (h / 2)
            shade = int(min(255, (dx * dx + dy * dy) ** 0.6 * 180))
            draw.point((i, j), fill=(0, 0, 0, shade))
    return ImageClip(np.array(img))

def lighting_overlay():
    return ImageClip(np.array(Image.new("RGBA", (W, H), (255, 255, 255, 20)))).set_opacity(0.15)

# ------------------ Subtitles ------------------

def create_line_by_line_karaoke(dialogue, duration, lang="en"):
    clips   = []
    words   = dialogue.split()
    n_words = len(words)
    if not dialogue.strip() or n_words == 0:
        return clips

    word_duration = duration / n_words
    is_rtl        = lang.lower() == "ur"
    font_path     = UR_FONT_PATH if is_rtl else "arialbd.ttf"

    try:
        font = ImageFont.truetype(font_path, 50)
    except Exception:
        font = ImageFont.load_default()

    display_words = (
        [get_display(arabic_reshaper.reshape(w)) for w in words][::-1]
        if is_rtl else words
    )

    for idx in range(n_words):
        img  = Image.new("RGBA", (W, SUBTITLE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        start = max(0, idx - 1)
        end   = min(n_words, idx + 2)
        chunk = display_words[start:end]

        widths  = [draw.textbbox((0, 0), w, font=font)[2] for w in chunk]
        total_w = sum(widths) + SUBTITLE_SPACING * max(0, len(chunk) - 1)
        x = (W - total_w) // 2
        y = (SUBTITLE_HEIGHT - font.size) // 2

        for i, w in enumerate(chunk[::-1] if is_rtl else chunk):
            real_idx = start + (len(chunk) - 1 - i if is_rtl else i)
            color    = "yellow" if real_idx == idx else ("white" if real_idx < idx else "gray")
            draw.text((x, y), w, font=font, fill=color)
            x += widths[i] + SUBTITLE_SPACING

        clip = (ImageClip(np.array(img))
                .set_duration(word_duration)
                .set_start(idx * word_duration)
                .set_position(("center", H - SUBTITLE_HEIGHT))
                .set_fps(24))
        clips.append(clip)

    return clips

# ------------------ Character Animation ------------------

def create_animated_character(ch, duration, base_pos=(DEFAULT_CHAR_X, DEFAULT_CHAR_Y), dialogue=""):
    try:
        if isinstance(ch, str):
            ch = {"file": ch}

        char_file = ch.get("file")
        if not char_file:
            print("Character missing 'file' key.")
            return None

        char_path = char_file if os.path.exists(char_file) else os.path.join("characters", os.path.basename(char_file))
        if not os.path.exists(char_path):
            print(f"Character file not found: {char_path}")
            return None

        base_img = Image.open(char_path).convert("RGBA")
        scale    = float(ch.get("scale", DEFAULT_CHAR_SCALE))
        w2, h2   = int(base_img.width * scale), int(base_img.height * scale)
        base_img = base_img.resize((w2, h2))

        print(f"Creating character: {char_path} at {base_pos} with scale {scale}")

        def floating_sway_rotate(get_frame, t):
            frame = get_frame(t)
            angle = 3 * math.sin(t * 0.8)
            return np.array(Image.fromarray(frame).rotate(angle, resample=Image.BICUBIC, expand=False))

        base_clip = ImageClip(np.array(base_img)).set_duration(duration).fl(floating_sway_rotate, apply_to=["mask"])
        overlays  = [base_clip]
        pos_lambda = lambda t: base_pos

        def _load_overlay_frames(file_list, frame_duration):
            clips = []
            for f in file_list:
                path = f if os.path.exists(f) else os.path.join("characters", f)
                if not os.path.exists(path):
                    print(f"File not found: {path}")
                    continue
                img = Image.open(path).convert("RGBA").resize((w2, h2))
                clips.append(ImageClip(np.array(img)).set_duration(frame_duration))
            return clips

        eye_clips = _load_overlay_frames(ch.get("eyes", []), 0.2)
        if eye_clips:
            overlays.append(
                concatenate_videoclips(eye_clips, method="compose")
                .loop(duration=duration)
                .set_position(pos_lambda)
            )

        if dialogue:
            mouth_clips = _load_overlay_frames(ch.get("mouth", []), 0.15)
            if mouth_clips:
                overlays.append(
                    concatenate_videoclips(mouth_clips, method="compose")
                    .loop(duration=duration)
                    .set_position(pos_lambda)
                )

        return (CompositeVideoClip(overlays)
                .set_position(base_pos)
                .fx(fadein, 0.5)
                .fx(fadeout, 0.5))

    except Exception as e:
        print("Animated character error:", e)
        return None

# ------------------ TTS ------------------

def _generate_tts_audio(scene, audio_path):
    """Generate TTS audio for a scene. Returns AudioFileClip or None."""
    dialogue = scene.get("dialogue", "").strip()
    if not dialogue:
        return None, 3

    try:
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        voice    = scene.get("voice", "female")
        tts_lang = scene.get("tts_lang", "ur")

        if voice == "female":
            gTTS(dialogue, lang=tts_lang).save(audio_path)
        else:
            engine = pyttsx3.init()
            engine.setProperty("rate", 150)
            male_voice = next(
                (v.id for v in engine.getProperty("voices")
                 if "male" in v.name.lower() or "english" in v.name.lower()),
                None
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

    scenes       = story_data.get("scenes", [])
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

        audio_path = os.path.join(AUDIO_DIR, f"{video_id}_scene_{i}.mp3" if video_id else f"scene_{i}.mp3")
        audio_clip, duration = _generate_tts_audio(scene, audio_path)

        progress_status[video_id] = prog_base + (prog_next - prog_base) // 2
        time.sleep(0.1)

        # Background
        try:
            bg_path = scene.get("background")
            if bg_path and os.path.exists(bg_path):
                bg_clip = ImageClip(np.array(Image.open(bg_path).convert("RGB").resize((W, H)))).set_duration(duration)
            else:
                bg_clip = ColorClip(size=(W, H), color=(0, 0, 0), duration=duration)
        except Exception as e:
            print(f"Background error for scene {i}: {e}")
            continue

        scene_elements = [bg_clip]

        # Characters
        characters  = scene.get("characters", [])
        num_chars   = len(characters)
        char_spacing = W // (num_chars + 1) if num_chars > 0 else W // 2

        for idx, ch in enumerate(characters):
            try:
                ch_obj        = {"file": ch} if isinstance(ch, str) else dict(ch)
                ch_obj["scale"] = float(ch_obj.get("scale", DEFAULT_CHAR_SCALE))
                ch_x = float(ch_obj.get("x", char_spacing * (idx + 1)))
                ch_y = float(ch_obj.get("y", DEFAULT_CHAR_Y))

                char_clip = create_animated_character(
                    ch_obj, duration, base_pos=(ch_x, ch_y), dialogue=scene.get("dialogue", "")
                )
                if char_clip:
                    scene_elements.append(char_clip)
            except Exception as e:
                print(f"Character error: {e}")

        # Subtitles
        dialogue = scene.get("dialogue", "")
        if dialogue.strip():
            try:
                lang = "ur" if any("\u0600" <= c <= "\u06FF" for c in dialogue) else "en"
                scene_elements.extend(create_line_by_line_karaoke(dialogue, duration, lang=lang))
            except Exception as e:
                print(f"Subtitle error: {e}")

        # Combine scene
        clip = CompositeVideoClip(scene_elements, size=(W, H))
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
        output_path = os.path.join(OUTPUT_DIR, f"{video_id}.mp4" if video_id else "output.mp4")
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
        video_id   = str(uuid.uuid4())
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