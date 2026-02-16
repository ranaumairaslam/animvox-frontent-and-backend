import os
import json
import numpy as np
from gtts import gTTS
import pyttsx3
from moviepy.editor import *
from moviepy.video.fx.all import fadein, fadeout, resize
from moviepy.audio.fx.audio_normalize import audio_normalize
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import math
import random
import textwrap
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import time
import tempfile
import shutil

STORY_FILE = "story.json"
OUTPUT_DIR = "animated_videos"
AUDIO_DIR = "audio"
TEMP_DIR = "temp"
BG_DIR = "backgrounds"
VIDEOS_DIR = OUTPUT_DIR
# ------------------ Font Paths ------------------
EN_FONT_PATH = "fonts/DejaVuSans-Bold.ttf"
UR_FONT_PATH = "fonts/NotoNaskhArabic-Regular.ttf"


os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(BG_DIR, exist_ok=True)
os.makedirs("characters", exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

W, H = 1280, 720
progress_status = {}

app = Flask(__name__)
CORS(app)

# ------------------ Motion/Effects (unchanged) ------------------

def camera_2p5d_motion(clip, zoom=1.04, move=20):
    return clip.fl(lambda gf, t: gf(t), apply_to=["mask"])\
               .set_position(lambda t: (move*math.sin(t*0.2), move*math.cos(t*0.15)))\
               .fx(resize, lambda t: 1 + (zoom-1)*(t/clip.duration))

def float_motion(clip, amplitude=8, speed=1, base_pos=(0,0)):
    bx, by = base_pos
    return clip.set_position(lambda t: (bx, by + amplitude*math.sin(t*speed)))

def side_parallax(clip, shift=10, base_pos=(0,0)):
    bx, by = base_pos
    return clip.set_position(lambda t: (bx + shift*math.sin(t*0.3), by))

def dust_particles(duration, count=25):
    particles = []
    for _ in range(count):
        size = random.randint(3, 8)
        x = random.randint(0, W)
        y = random.randint(0, H)
        img = Image.new("RGBA", (size, size), (255,255,255,25))
        clip = ImageClip(np.array(img)).set_duration(duration)
        clip = clip.set_position(lambda t, x=x, y=y: (x + math.sin(t*0.5)*50, y + math.cos(t*0.3)*30)).set_opacity(0.4)
        particles.append(clip)
    return particles

def vignette_mask(w,h):
    img = Image.new("RGBA", (w,h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    for i in range(w):
        for j in range(h):
            dx = abs(i-w/2)/(w/2)
            dy = abs(j-h/2)/(h/2)
            d = (dx*dx + dy*dy)**0.6
            shade = int(min(255, d*180))
            draw.point((i,j), fill=(0,0,0,shade))
    return ImageClip(np.array(img))

def lighting_overlay():
    light = Image.new("RGBA", (W,H), (255,255,255,20))
    return ImageClip(np.array(light)).set_opacity(0.15)


# ------------------ Subtitles ------------------
SUBTITLE_HEIGHT = 140  # fixed height like static videos
SUBTITLE_SPACING = 40  # horizontal spacing between words

def create_line_by_line_karaoke(dialogue, duration, lang="en"):
    """
    Returns list of ImageClips with karaoke-style subtitles.
    English: bold, fixed box, bottom-aligned, optionally synced to TTS audio.
    Urdu: RTL, fixed box, bottom-aligned, karaoke style.
    """
    clips = []

    if not dialogue.strip():
        return clips

    words = dialogue.split()
    n_words = len(words)
    if n_words == 0:
        return clips

    word_duration = duration / n_words  # simple uniform duration per word

    for idx, word in enumerate(words):
        # ----------------- FONT SETTINGS -----------------
        if lang.lower() == "ur":
            font_path = UR_FONT_PATH
            rtl = True
        else:
            font_path = "arialbd.ttf"
            rtl = False

        try:
            font = ImageFont.truetype(font_path, 50)  # fixed font size
        except:
            font = ImageFont.load_default()

        # ----------------- CREATE IMAGE -----------------
        img = Image.new("RGBA", (W, SUBTITLE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # For Urdu, shape text
        display_words = words
        if rtl:
            display_words = [get_display(arabic_reshaper.reshape(w)) for w in words][::-1]

        # Determine chunk to highlight (karaoke effect)
        start = max(0, idx-1)
        end = min(n_words, idx+2)
        chunk = display_words[start:end]

        # Compute widths
        widths = [draw.textbbox((0,0), w, font=font)[2] for w in chunk]
        total_w = sum(widths) + SUBTITLE_SPACING*(len(chunk)-1)
        x = (W - total_w)//2
        y = (SUBTITLE_HEIGHT - font.size)//2  # vertically centered

        # Draw words with colors
        for i, w in enumerate(chunk[::-1] if rtl else chunk):
            real_idx = start + (len(chunk)-1-i if rtl else i)
            if real_idx == idx:
                color = "yellow"
            elif real_idx < idx:
                color = "white"
            else:
                color = "gray"

            draw.text((x, y), w, font=font, fill=color)
            x += widths[i] + SUBTITLE_SPACING

        # ----------------- CREATE CLIP -----------------
        clip = ImageClip(np.array(img))\
            .set_duration(word_duration)\
            .set_start(idx * word_duration)\
            .set_position(("center", H - SUBTITLE_HEIGHT))\
            .set_fps(24)

        clips.append(clip)

    return clips



# ------------------ Character Animation ------------------

DEFAULT_CHAR_SCALE = 1.6
DEFAULT_CHAR_X = 300
DEFAULT_CHAR_Y = 200

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

        base_img = Image.open(char_path)
        if base_img.mode != "RGBA":
            base_img = base_img.convert("RGBA")

        scale = float(ch.get("scale", DEFAULT_CHAR_SCALE))
        w2, h2 = int(base_img.width * scale), int(base_img.height * scale)
        base_img = base_img.resize((w2, h2))

        print(f"Creating character: {char_path} at {base_pos} with scale {scale}")

        # Floating sway + rotate effect
        def floating_sway_rotate(get_frame, t):
            frame = get_frame(t)
            dx = 8*math.sin(t*0.5) + 5*math.sin(t*0.7)
            dy = 8*math.sin(t*1.2)
            angle = 3*math.sin(t*0.8)
            img = Image.fromarray(frame)
            img = img.rotate(angle, resample=Image.BICUBIC, expand=False)
            return np.array(img)

        base_clip = ImageClip(np.array(base_img)).set_duration(duration).fl(floating_sway_rotate, apply_to=["mask"])
        overlays = [base_clip]

        def pos_lambda(t):
            return base_pos

        # Eyes animation
        eyes_files = ch.get("eyes", [])
        if eyes_files:
            eye_clips = []
            for e in eyes_files:
                e_path = os.path.join("characters", e) if not os.path.exists(e) else e
                if not os.path.exists(e_path):
                    print(f"Eye image not found: {e_path}")
                    continue
                img = Image.open(e_path)
                if img.mode != "RGBA": img = img.convert("RGBA")
                img = img.resize((w2, h2))
                eye_clips.append(ImageClip(np.array(img)).set_duration(0.2))
            if eye_clips:
                eyes_animation = concatenate_videoclips(eye_clips, method="compose").loop(duration=duration)
                overlays.append(eyes_animation.set_position(pos_lambda))

        # Mouth animation
        mouth_files = ch.get("mouth", [])
        if mouth_files and dialogue:
            mouth_clips = []
            for m in mouth_files:
                m_path = os.path.join("characters", m) if not os.path.exists(m) else m
                if not os.path.exists(m_path):
                    print(f"Mouth image not found: {m_path}")
                    continue
                img = Image.open(m_path)
                if img.mode != "RGBA": img = img.convert("RGBA")
                img = img.resize((w2, h2))
                mouth_clips.append(ImageClip(np.array(img)).set_duration(0.15))
            if mouth_clips:
                mouth_animation = concatenate_videoclips(mouth_clips, method="compose").loop(duration=duration)
                overlays.append(mouth_animation.set_position(pos_lambda))

        final_clip = CompositeVideoClip(overlays).set_position(base_pos).fx(fadein,0.5).fx(fadeout,0.5)
        return final_clip

    except Exception as e:
        print("Animated character error:", e)
        return None

# ------------------ Generate Story Video ------------------

def generate_story_video(story_data, video_id=None, output_path=None):
    """
    Generate animated story video with smooth progress tracking
    Progress flow: 0% -> 5% (start) -> 10-70% (scenes) -> 70-90% (rendering) -> 100% (complete)
    """
    progress_status[video_id] = 0
    time.sleep(0.3)
    
    scenes = story_data.get("scenes", [])
    total_scenes = len(scenes)
    
    if total_scenes == 0:
        progress_status[video_id] = -1
        return None, None

    progress_status[video_id] = 5  # Initial start
    
    # Calculate progress allocation
    # 5-70%: Scene processing (65% total)
    # 70-90%: Video rendering (20% total)
    # 90-100%: Final encoding (10% total)
    
    scene_progress_start = 5
    scene_progress_end = 70
    scene_progress_range = scene_progress_end - scene_progress_start
    
    final_clips = []

    for i, scene in enumerate(scenes):
        # Calculate progress for this scene
        scene_base_progress = scene_progress_start + int((i / total_scenes) * scene_progress_range)
        scene_next_progress = scene_progress_start + int(((i + 1) / total_scenes) * scene_progress_range)
        
        # Update progress at scene start
        progress_status[video_id] = scene_base_progress
        time.sleep(0.1)
        
        audio_clip = None
        duration = 3

        # ---------- Generate TTS ----------
        if scene.get("dialogue", "").strip():
            try:
                audio_path = os.path.join(AUDIO_DIR, f"{video_id}_scene_{i}.mp3") if video_id else os.path.join(AUDIO_DIR, f"scene_{i}.mp3")
                os.makedirs(os.path.dirname(audio_path), exist_ok=True)

                voice = scene.get("voice","female")
                tts_lang = scene.get("tts_lang","ur")  # TTS language

                if voice=="female":
                    tts = gTTS(scene["dialogue"], lang=tts_lang)
                    tts.save(audio_path)
                else:  # Male voice using pyttsx3
                    engine = pyttsx3.init()
                    engine.setProperty('rate', 150)
                    voices = engine.getProperty('voices')
                    male_voice = None
                    for v in voices:
                        if "male" in v.name.lower() or "english" in v.name.lower():
                            male_voice = v.id
                            break
                    if male_voice:
                        engine.setProperty('voice', male_voice)
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tf:
                        temp_path = tf.name
                    engine.save_to_file(scene["dialogue"], temp_path)
                    engine.runAndWait()
                    time.sleep(0.5)
                    shutil.move(temp_path, audio_path)

                audio_clip = AudioFileClip(audio_path).fx(audio_normalize)
                duration = audio_clip.duration
                
                # Update progress after TTS generation (halfway through scene)
                progress_status[video_id] = scene_base_progress + int((scene_next_progress - scene_base_progress) * 0.5)
                time.sleep(0.1)
                
            except Exception as e:
                print(f"TTS error for scene {i}: {e}")
                duration = 3

        # ---------- Background ----------
        try:
            bg_path = scene.get("background")
            if bg_path and os.path.exists(bg_path):
                bg = Image.open(bg_path).convert("RGB").resize((1280, 720))
                bg_clip = ImageClip(np.array(bg)).set_duration(duration)
            else:
                bg_clip = ColorClip(size=(1280,720), color=(0,0,0), duration=duration)
        except Exception as e:
            print(f"Background error for scene {i}: {e}")
            continue

        # ---------- Characters ----------
        scene_elements = [bg_clip]
        characters = scene.get("characters", [])
        num_chars = len(characters)
        # Compute spacing between characters for even distribution
        char_spacing = W // (num_chars + 1) if num_chars > 0 else W // 2

        for idx, ch in enumerate(characters):
            try:
                if isinstance(ch, str):
                    ch_obj = {"file": ch}
                else:
                    ch_obj = ch
                ch_obj["scale"] = float(ch_obj.get("scale", DEFAULT_CHAR_SCALE))

                # Use user-provided x if exists; else compute auto spacing
                ch_x = float(ch_obj.get("x", char_spacing * (idx + 1)))
                ch_y = float(ch_obj.get("y", DEFAULT_CHAR_Y))

                char_clip = create_animated_character(
                    ch_obj, duration, base_pos=(ch_x, ch_y), dialogue=scene.get("dialogue","")
                )
                if char_clip:
                    scene_elements.append(char_clip)

            except Exception as e:
                print(f"Character error: {e}")
                continue

        # ---------- Subtitles ----------
        if scene.get("dialogue","").strip():
            try:
                dialogue_text = scene["dialogue"]
                subtitle_lang = "ur" if any("\u0600" <= c <= "\u06FF" for c in dialogue_text) else "en"
                subtitle_clips = create_line_by_line_karaoke(dialogue_text, duration, lang=subtitle_lang)
                scene_elements.extend(subtitle_clips)
            except Exception as e:
                print(f"Subtitle error: {e}")

        # ---------- Combine scene ----------
        clip = CompositeVideoClip(scene_elements, size=(1280,720))
        if audio_clip:
            clip = clip.set_audio(audio_clip)
        final_clips.append(clip)
        
        # Update progress at scene completion
        progress_status[video_id] = scene_next_progress
        time.sleep(0.1)

    # ---------- Concatenate all scenes ----------
    if final_clips:
        progress_status[video_id] = 70  # Start rendering phase
        time.sleep(0.2)
        
        video = concatenate_videoclips(final_clips, method="compose")
        
        progress_status[video_id] = 80  # Midway through rendering
        time.sleep(0.2)
        
        if not output_path:
            output_path = os.path.join(OUTPUT_DIR, f"{video_id}.mp4") if video_id else os.path.join(OUTPUT_DIR, "output.mp4")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        progress_status[video_id] = 90  # Final encoding stage
        time.sleep(0.2)
        
        video.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")
        
        progress_status[video_id] = 100  # Complete
        return video_id, output_path
    
    progress_status[video_id] = -1  # Error
    return None, None


# ------------------ Flask Endpoints ------------------

@app.route("/generate/animated", methods=["POST"])
def generate_animated_endpoint():
    try:
        story_data = json.loads(request.form.get("story","{}"))
        video_id = str(uuid.uuid4())
        video_id, _ = generate_story_video(story_data, video_id=video_id)
        progress_status[video_id] = 100
        return jsonify({"video_id": video_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/progress/animated/<video_id>")
def animated_progress(video_id):
    return jsonify({"progress": progress_status.get(video_id,0)})

if __name__=="__main__":
    app.run(host="0.0.0.0", port=8500, debug=True)