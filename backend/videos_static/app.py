# ========================================
# CINEMATIC VIDEO GENERATOR - YouTube Style
# OPTIMIZED: Fast Ken Burns | Cached Subtitles | Single-pass Audio & Video Write
# FIXED: Memory optimization for subtitle blitting
# ========================================

import os
import json
import uuid
import traceback
import time
import asyncio
import subprocess
import hashlib
import random
import re
import wave as wave_mod
from threading import Thread
from difflib import SequenceMatcher

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from moviepy.editor import (
    VideoClip, ImageClip, AudioFileClip, CompositeVideoClip,
    CompositeAudioClip, concatenate_videoclips, concatenate_audioclips
)

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
    print("✅ Edge TTS available")
except ImportError:
    EDGE_TTS_AVAILABLE = False
    print("❌ Edge TTS not available - Install: pip install edge-tts")

try:
    from vosk import Model, KaldiRecognizer
    VOSK_AVAILABLE = True
    print("✅ Vosk available")
except ImportError:
    VOSK_AVAILABLE = False
    print("⚠️  Vosk not available - Install: pip install vosk")

# ---------------- CONFIG ----------------
W, H = 1920, 1080
SUBTITLE_FONT_SIZE = 80
SUBTITLE_HEIGHT = 250
SUBTITLE_Y_POSITION = H - 300
AUDIO_DIR = "audio"
TEMP_DIR = "temp"
MUSIC_DIR = "music"
VIDEOS_DIR = "videos"
UPLOADS_DIR = "static/uploads"
VOSK_MODEL_PATH = "vosk-model"
PREVIEW_DIR = "static/previews"

PREVIEW_VOICE_TEXT = "This is a preview of the selected voice. It sounds cinematic and natural, perfect for your video projects."

CINEMATIC_VOICES = {
    "Male Cinematic": {
        "US - Davis (Deep Narrator)": "en-US-DavisNeural",
        "US - Guy (Storyteller)": "en-US-GuyNeural",
        "US - Tony (Documentary)": "en-US-TonyNeural",
        "UK - Ryan (British Narrator)": "en-GB-RyanNeural",
        "US - Christopher (Calm)": "en-US-ChristopherNeural",
    },
    "Female Cinematic": {
        "US - Jenny (Warm Narrator)": "en-US-JennyNeural",
        "US - Aria (Clear & Smooth)": "en-US-AriaNeural",
        "US - Sara (Professional)": "en-US-SaraNeural",
        "UK - Sonia (British Narrator)": "en-GB-SoniaNeural",
    }
}

FALLBACK_VOICES = [
    "en-US-GuyNeural", "en-US-DavisNeural", "en-US-TonyNeural",
    "en-US-ChristopherNeural", "en-GB-RyanNeural", "en-GB-SoniaNeural",
]

for folder in [AUDIO_DIR, TEMP_DIR, "images", UPLOADS_DIR, VIDEOS_DIR, MUSIC_DIR, PREVIEW_DIR]:
    os.makedirs(folder, exist_ok=True)

app = Flask(__name__, template_folder='.')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
progress_status = {}

# ================== VOSK SETUP ==================

def download_vosk_model():
    if not VOSK_AVAILABLE or os.path.exists(VOSK_MODEL_PATH):
        return os.path.exists(VOSK_MODEL_PATH)
    print("📥 Downloading Vosk model...")
    try:
        import urllib.request, zipfile
        zip_path = "vosk-model.zip"
        urllib.request.urlretrieve("https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip", zip_path)
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall('.')
        extracted = "vosk-model-small-en-us-0.15"
        if os.path.exists(extracted):
            os.rename(extracted, VOSK_MODEL_PATH)
        os.remove(zip_path)
        print("✅ Vosk model downloaded")
        return True
    except Exception as e:
        print(f"❌ Vosk download failed: {e}")
        return False

VOSK_MODEL = None
if VOSK_AVAILABLE and download_vosk_model():
    try:
        VOSK_MODEL = Model(VOSK_MODEL_PATH)
        print("✅ Vosk model loaded")
    except Exception as e:
        print(f"⚠️  Vosk load failed: {e}")

# ================== HELPERS ==================

def _is_valid_audio_file(path, min_bytes=1000):
    return bool(path and os.path.exists(path) and os.path.getsize(path) >= min_bytes)

def _ffprobe_duration(path):
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, check=True
        )
        return float(r.stdout.strip())
    except Exception:
        return 0.0

def scene_audio_key(dialogue, voice, rate):
    raw = f"{voice}|{rate}|{dialogue}".encode("utf-8")
    return hashlib.md5(raw).hexdigest()[:16]

def _run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()

# ================== TEXT PROCESSING ==================

def add_natural_pauses(text):
    text = re.sub(r'([.!?;:])(\s+)', r'\1 ... ', text)
    text = re.sub(r',(\s+)', r', ', text)
    text = re.sub(r'\n\n+', '\n\n', text)
    text = re.sub(r'\[breath\]',      ' ... ',       text, flags=re.IGNORECASE)
    text = re.sub(r'\[pause\]',       ' ... ... ',   text, flags=re.IGNORECASE)
    text = re.sub(r'\[long_pause\]',  ' ... ... ... ', text, flags=re.IGNORECASE)
    text = re.sub(r'\[short_pause\]', ' ... ',       text, flags=re.IGNORECASE)
    text = re.sub(r'\[emphasize\](.*?)\[/emphasize\]', r'\1', text, flags=re.IGNORECASE)
    text = re.sub(r'\[(slow|fast)\](.*?)\[/\1\]', r'\2', text, flags=re.IGNORECASE)
    return text

def parse_script_text(script_text):
    scenes = []
    for part in re.split(r'(?:^|\n)\s*Scene\s+\d+\s*\n', script_text, flags=re.IGNORECASE):
        part = part.strip()
        if not part:
            continue
        lines = [l for l in part.splitlines()
                 if not l.strip().upper().startswith(("VEO:", "VISUAL:"))]
        dialogue = "\n".join(lines).strip()
        if dialogue:
            scenes.append({"dialogue": dialogue})
    return scenes

# ================== AUDIO GENERATION ==================

async def _generate_speech_async(text, mp3_path, voice, rate, is_preview=False):
    processed = text.strip() if is_preview else add_natural_pauses(text.strip())
    if not processed:
        raise ValueError("Empty text for TTS")
    if not rate or rate in ("+0%", "0%"):
        rate = "-5%"
    await edge_tts.Communicate(text=processed, voice=voice, rate=rate).save(mp3_path)


def _generate_preview_only(voice, mp3_path, rate="-5%"):
    preview_text = PREVIEW_VOICE_TEXT.strip()
    if not preview_text:
        print("❌ Preview text is empty")
        return False
    print(f"\n🎧 Preview Text: '{preview_text}'")
    try:
        _run_async(_generate_speech_async(preview_text, mp3_path, voice, rate, is_preview=True))
    except Exception as e:
        print(f"❌ Preview TTS failed: {e}")
        return False

    if not _is_valid_audio_file(mp3_path, min_bytes=500):
        print("❌ Preview audio missing or empty")
        return False

    base, ext = os.path.splitext(mp3_path)
    trimmed_path = base + "_trimmed" + ext
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-t", "5", "-c", "copy", trimmed_path],
            check=True, capture_output=True
        )
        os.replace(trimmed_path, mp3_path)
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Trim failed, serving full audio: {e.stderr.decode()}")

    print(f"✅ Preview generated: {mp3_path}")
    return True


def generate_cinematic_audio(text, mp3_path, voice="en-US-DavisNeural", rate="-5%",
                              max_retries=6, backoff_base=1.2, allow_voice_fallback=True):
    text = ''.join(c for c in (text or "").strip() if ord(c) >= 32 or c in '\n\t').replace('\r', '')
    if not text:
        return False, None

    print(f"   📝 Script Text (first 80 chars): {text[:80]}...")

    base = os.path.splitext(mp3_path)[0]
    tmp_mp3  = base + "_tmp.mp3"
    wav_path = base + ".wav"

    # Cache hit
    if _is_valid_audio_file(mp3_path) and _is_valid_audio_file(wav_path, min_bytes=5000):
        dur = _ffprobe_duration(mp3_path)
        if dur > 0.2:
            print(f"♻️  Using cached audio: {mp3_path} ({dur:.2f}s)")
            return True, wav_path

    # MP3 exists but WAV missing
    if _is_valid_audio_file(mp3_path) and not _is_valid_audio_file(wav_path, min_bytes=5000):
        print("♻️  MP3 exists, regenerating WAV only...")
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", mp3_path, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav_path],
                check=True, capture_output=True
            )
            return True, wav_path
        except subprocess.CalledProcessError as e:
            print(f"❌ WAV regen failed: {e.stderr.decode()}")

    # Build deduplicated voice list
    seen, voice_list = set(), []
    for v in ([voice] + FALLBACK_VOICES if allow_voice_fallback else [voice]):
        if v not in seen:
            seen.add(v)
            voice_list.append(v)

    last_error = None
    for v in voice_list:
        print(f"🎙️  TTS voice attempt: {v}")
        for attempt in range(1, max_retries + 1):
            if os.path.exists(mp3_path) and os.path.getsize(mp3_path) < 1000:
                try:
                    os.remove(mp3_path)
                except Exception:
                    pass
            try:
                _run_async(_generate_speech_async(text, mp3_path, v, rate, is_preview=False))
                if not _is_valid_audio_file(mp3_path):
                    raise RuntimeError("MP3 missing or too small after TTS")
                dur = _ffprobe_duration(mp3_path)
                if dur < 0.2:
                    raise RuntimeError("MP3 duration invalid (too short)")
                print(f"✅ Edge TTS OK: {mp3_path} ({dur:.2f}s)")
                break
            except Exception as e:
                last_error = e
                wait = (backoff_base ** attempt) + random.uniform(0.0, 0.35)
                print(f"⚠️  Edge TTS failed (voice={v}, attempt={attempt}/{max_retries}): {e}")
                print(f"⏳ Retrying in {wait:.2f}s...")
                time.sleep(wait)
        if _is_valid_audio_file(mp3_path):
            break

    if not _is_valid_audio_file(mp3_path):
        print(f"❌ TTS FAILED completely. Last error: {last_error}")
        return False, None

    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", mp3_path,
            "-af", "loudnorm=I=-16:LRA=11:TP=-1.5",
            "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100",
            tmp_mp3
        ], check=True, capture_output=True)
        os.replace(tmp_mp3, mp3_path)

        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav_path],
            check=True, capture_output=True
        )
    except subprocess.CalledProcessError as e:
        print(f"❌ ffmpeg post-process failed: {e.stderr.decode()}")
        if os.path.exists(tmp_mp3):
            try:
                os.remove(tmp_mp3)
            except Exception:
                pass
        return False, None

    print(f"✅ Audio generated + cached: {mp3_path}")
    return True, wav_path

# ================== WORD TIMING (VOSK) ==================

def get_word_timestamps_vosk(wav_path, expected_text=""):
    if not VOSK_AVAILABLE or VOSK_MODEL is None or not wav_path or not os.path.exists(wav_path):
        return get_word_timestamps_fallback(wav_path, expected_text)
    try:
        wf = wave_mod.open(wav_path, "rb")
        rec = KaldiRecognizer(VOSK_MODEL, wf.getframerate())
        rec.SetWords(True)
        results = []
        while True:
            data = wf.readframes(4000)
            if not data:
                break
            if rec.AcceptWaveform(data):
                r = json.loads(rec.Result())
                if 'result' in r:
                    results.extend(r['result'])
        final = json.loads(rec.FinalResult())
        if 'result' in final:
            results.extend(final['result'])
        wf.close()

        word_timings = [
            (item['word'].upper(), item.get('start', 0), item.get('end', 0))
            for item in results if item.get('word')
        ]
        print(f"✅ Extracted {len(word_timings)} word timestamps via Vosk")

        if expected_text and word_timings:
            word_timings = align_word_timings(word_timings, [w.upper() for w in expected_text.split()])

        return word_timings
    except Exception as e:
        print(f"❌ Vosk error: {e}")
        return get_word_timestamps_fallback(wav_path, expected_text)


def align_word_timings(recognized_timings, expected_words):
    if not recognized_timings or not expected_words:
        return recognized_timings
    try:
        recognized_words = [w[0] for w in recognized_timings]
        matcher = SequenceMatcher(None, recognized_words, expected_words)
        aligned = []
        rec_idx = 0
        for op, i1, i2, j1, j2 in matcher.get_opcodes():
            if op in ('equal', 'replace'):
                for k in range(j2 - j1):
                    if rec_idx < len(recognized_timings):
                        _, start, end = recognized_timings[rec_idx]
                        aligned.append((expected_words[j1 + k], start, end))
                        rec_idx += 1
            elif op == 'insert':
                last_end = aligned[-1][2] if aligned else 0.0
                for k in range(j2 - j1):
                    aligned.append((expected_words[j1 + k], last_end, last_end + 0.3))
                    last_end += 0.3
            elif op == 'delete':
                rec_idx += (i2 - i1)
        return aligned
    except Exception as e:
        print(f"⚠️  Alignment error: {e}")
        return recognized_timings


def get_word_timestamps_fallback(audio_path, expected_text=""):
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
            capture_output=True, text=True, check=True
        )
        total_duration = float(r.stdout.strip())
    except Exception:
        total_duration = 5.0

    words = expected_text.upper().split() if expected_text else []
    if not words:
        return []
    word_dur = total_duration / len(words)
    timings = [(w, i * word_dur, (i + 1) * word_dur) for i, w in enumerate(words)]
    print(f"⚠️  Using fallback timing ({len(timings)} words)")
    return timings

# ================== SUBTITLE RENDERING ==================

def _load_subtitle_font():
    for path in [
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "arialbd.ttf", "arial.ttf"
    ]:
        try:
            return ImageFont.truetype(path, SUBTITLE_FONT_SIZE)
        except OSError:
            continue
    return ImageFont.load_default()

_SUBTITLE_FONT = _load_subtitle_font()


def _render_subtitle_frame(words, current_index):
    font = _SUBTITLE_FONT
    start_idx = max(0, current_index - 1)
    end_idx = min(len(words), start_idx + 4)
    if end_idx - start_idx < 4 and start_idx > 0:
        start_idx = max(0, end_idx - 4)
    visible_words = words[start_idx:end_idx]

    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    spacing = 40
    word_widths = []
    for w in visible_words:
        try:
            bbox = dummy.textbbox((0, 0), w, font=font)
            word_widths.append(bbox[2] - bbox[0])
        except AttributeError:
            word_widths.append(int(len(w) * SUBTITLE_FONT_SIZE * 0.6))

    total_width = sum(word_widths) + spacing * max(0, len(visible_words) - 1)
    x_start = (W - total_width) // 2
    y = 80

    img_shadow = Image.new("RGBA", (W, SUBTITLE_HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(img_shadow)
    x = x_start
    for i, word in enumerate(visible_words):
        for ox in (-2, 0, 2):
            for oy in (-2, 0, 2):
                if ox == 0 and oy == 0:
                    continue
                shadow_draw.text((x + ox, y + oy), word, font=font, fill=(0, 0, 0, 150))
        x += word_widths[i] + spacing

    img_text = Image.new("RGBA", (W, SUBTITLE_HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img_text)
    x = x_start
    for i, word in enumerate(visible_words):
        global_idx = start_idx + i
        if global_idx == current_index:
            for offset in range(4, 0, -1):
                a = int(100 - offset * 20)
                for ox, oy in ((-offset, -offset), (offset, -offset), (-offset, offset), (offset, offset)):
                    draw.text((x + ox, y + oy), word, font=font, fill=(255, 215, 0, a))
            draw.text((x, y), word, font=font, fill=(255, 215, 0, 255))
        elif global_idx < current_index:
            draw.text((x, y), word, font=font, fill=(255, 255, 255, 255))
        else:
            draw.text((x, y), word, font=font, fill=(200, 200, 200, 190))
        x += word_widths[i] + spacing

    arr = np.array(Image.alpha_composite(img_shadow, img_text))
    rgb = arr[:, :, :3].astype(np.uint8)
    mask = arr[:, :, 3].astype(np.uint8) / 255.0
    return rgb, mask


def create_subtitle_clips_cached(words, wav_path, mp3_path):
    if not words:
        return []

    word_timings = get_word_timestamps_vosk(wav_path, " ".join(words))
    if not word_timings:
        return []

    words_upper = [w.upper() for w in words]

    timing_entries = []
    used_indices = set()
    for word, start, end in word_timings:
        idx = next((j for j, w in enumerate(words_upper) if w == word and j not in used_indices), -1)
        if idx < 0:
            idx = next((j for j, w in enumerate(words_upper) if w == word), -1)
        if idx >= 0:
            used_indices.add(idx)
            timing_entries.append((idx, start, end))

    frame_cache = {}
    unique_indices = {e[0] for e in timing_entries}
    print(f"📝 Pre-rendering {len(unique_indices)} unique subtitle frames...")
    for idx in unique_indices:
        frame_cache[idx] = _render_subtitle_frame(words_upper, idx)

    def _make_clip(rgb_arr, mask_arr, dur):
        pil_img = Image.fromarray(rgb_arr, mode='RGB')
        pil_img.putalpha(Image.fromarray((mask_arr * 255).astype(np.uint8), mode='L'))
        return (ImageClip(np.array(pil_img))
                .set_duration(dur)
                .set_fps(30)
                .set_position(("center", SUBTITLE_Y_POSITION)))

    clips = [
        _make_clip(frame_cache[idx][0], frame_cache[idx][1], max(0.05, end - start)).set_start(start)
        for idx, start, end in timing_entries
    ]
    print(f"✅ Created {len(clips)} subtitle clips (cached, memory-optimized)")
    return clips

# ================== CINEMATIC VISUALS ==================

def make_kenburns_clip(image_array, duration, direction="zoom_in", fps=30):
    h, w = image_array.shape[:2]
    start_scale = 1.0 if direction == "zoom_in" else 1.15
    end_scale   = 1.15 if direction == "zoom_in" else 1.0

    def _cubic_ease(t):
        if t < 0.5:
            return 4 * t * t * t
        p = 2 * t - 2
        return 0.5 * p * p * p + 1

    def make_frame(t):
        progress = _cubic_ease(min(max(t / duration, 0), 1))
        scale = start_scale + (end_scale - start_scale) * progress
        crop_h, crop_w = int(H / scale), int(W / scale)
        pan_x, pan_y = int(15 * progress), int(10 * progress)
        y_start = max(0, min((h - crop_h) // 2 + pan_y, h - crop_h))
        x_start = max(0, min((w - crop_w) // 2 + pan_x, w - crop_w))
        return cv2.resize(image_array[y_start:y_start + crop_h, x_start:x_start + crop_w],
                          (W, H), interpolation=cv2.INTER_LINEAR)

    return VideoClip(make_frame, duration=duration).set_fps(fps)


def enhance_image_cinematic(img_path):
    try:
        img = Image.open(img_path).convert('RGB')
    except Exception:
        img = Image.new('RGB', (W, H), (20, 20, 30))

    target_w, target_h = int(W * 1.2), int(H * 1.2)
    img_aspect    = img.width / img.height
    target_aspect = target_w / target_h

    if img_aspect > target_aspect:
        fit_w, fit_h = target_w, int(target_w / img_aspect)
    else:
        fit_w, fit_h = int(target_h * img_aspect), target_h

    img_resized = img.resize((fit_w, fit_h), Image.LANCZOS)
    bg = ImageEnhance.Brightness(
        img.resize((target_w, target_h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(radius=30))
    ).enhance(0.35)

    bg.paste(img_resized, ((target_w - fit_w) // 2, (target_h - fit_h) // 2))
    bg = ImageEnhance.Color(bg).enhance(0.95)
    bg = ImageEnhance.Contrast(bg).enhance(1.1)
    bg = ImageEnhance.Brightness(bg).enhance(0.98)
    bg = bg.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
    return np.array(bg)

# ================== VIDEO GENERATION ==================

def generate_video_async(video_id, scenes, settings):
    try:
        output_path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")
        voice       = settings.get('voice', 'en-US-DavisNeural')
        rate        = settings.get('rate', '-5%')
        add_music   = settings.get('add_music', False)
        music_file  = settings.get('music_file', None)
        music_volume = settings.get('music_volume', 0.15)

        # Locate scene images
        scene_images = []
        for i, scene in enumerate(scenes):
            found = scene.get('image_path') if isinstance(scene, dict) else None
            if found and os.path.exists(found):
                scene_images.append(found)
                continue
            fallback = next(
                (os.path.join(UPLOADS_DIR, f"{i+1}.{ext}")
                 for ext in ('jpg', 'jpeg', 'png', 'webp')
                 if os.path.exists(os.path.join(UPLOADS_DIR, f"{i+1}.{ext}"))),
                None
            )
            scene_images.append(fallback)

        final_clips = []
        for i, scene in enumerate(scenes):
            try:
                print(f"\n{'='*60}\n🎬 Scene {i+1}/{len(scenes)}\n{'='*60}")
                dialogue = (scene.get('dialogue') or '').strip()
                if not dialogue:
                    print("⚠️ Empty dialogue, skipping scene")
                    continue

                key = scene_audio_key(dialogue, voice, rate)
                mp3_path = os.path.join(AUDIO_DIR, f"{key}.mp3")

                success, wav_path = generate_cinematic_audio(dialogue, mp3_path, voice, rate)

                if success and os.path.exists(mp3_path):
                    scene_duration = _ffprobe_duration(mp3_path)
                    if scene_duration <= 0.2:
                        scene_duration = max(3.0, len(dialogue.split()) / 2.2)
                else:
                    print(f"❌ Audio totally failed for scene {i+1}. Using estimated duration.")
                    scene_duration = max(3.0, len(dialogue.split()) / 2.2)
                    wav_path = None

                print(f"⏱️  Duration: {scene_duration:.2f}s")

                img_array = enhance_image_cinematic(scene_images[i]) if scene_images[i] else \
                            np.zeros((int(H * 1.2), int(W * 1.2), 3), dtype=np.uint8)

                clip = make_kenburns_clip(
                    img_array, scene_duration,
                    direction="zoom_in" if i % 2 == 0 else "zoom_out", fps=30
                )

                if success and os.path.exists(mp3_path):
                    clip = clip.set_audio(AudioFileClip(mp3_path))

                if wav_path and os.path.exists(wav_path):
                    print("💬 Creating subtitles...")
                    subtitle_clips = create_subtitle_clips_cached(dialogue.split(), wav_path, mp3_path)
                    if subtitle_clips:
                        clip = CompositeVideoClip([clip] + subtitle_clips)
                        print(f"✅ {len(subtitle_clips)} subtitle clips added")

                final_clips.append(clip)
                progress_status[video_id] = int((i + 1) / len(scenes) * 85)

            except Exception as e:
                print(f"❌ Scene {i+1} error: {e}")
                traceback.print_exc()

        if not final_clips:
            print("❌ No clips generated")
            progress_status[video_id] = -1
            return

        print("\n" + "=" * 60 + "\n🎬 Finalizing video...")
        fade = 0.35
        final_video = concatenate_videoclips(final_clips, method="compose", padding=-fade)

        if add_music and music_file and os.path.exists(music_file):
            print("🎵 Compositing background music...")
            music = AudioFileClip(music_file)
            if music.duration < final_video.duration:
                repeats = int(final_video.duration / music.duration) + 1
                music = concatenate_audioclips([music] * repeats)
            music = music.subclip(0, final_video.duration).volumex(music_volume)
            base_audio = final_video.audio
            final_video = final_video.set_audio(
                music if base_audio is None else CompositeAudioClip([base_audio, music])
            )

        progress_status[video_id] = 90
        print("💾 Writing final video...")
        final_video.write_videofile(
            output_path, fps=30, codec='libx264', audio_codec='aac',
            bitrate="8000k", preset='medium', threads=4,
            ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"]
        )
        progress_status[video_id] = 100
        print(f"\n✅ Video complete: {output_path}")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        traceback.print_exc()
        progress_status[video_id] = -1

# ================== FLASK ROUTES ==================

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route("/api/voices")
def get_voices():
    return jsonify(CINEMATIC_VOICES)

@app.route("/api/status")
def get_status():
    return jsonify({
        "vosk_available": VOSK_AVAILABLE and VOSK_MODEL is not None,
        "edge_tts_available": EDGE_TTS_AVAILABLE,
        "subtitle_style": "Optimized Static Text (Memory-Safe)",
        "voice_style": "Cinematic with Natural Breathing Pauses"
    })

@app.route("/api/preview_voice", methods=["POST"])
def preview_voice():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        voice = data.get('voice', 'en-US-DavisNeural')
        if not EDGE_TTS_AVAILABLE:
            return jsonify({"error": "Edge TTS not available"}), 500

        preview_id   = str(uuid.uuid4())[:12]
        preview_path = os.path.join(PREVIEW_DIR, f"{preview_id}.mp3")
        print(f"\n🎧 Generating voice preview for: {voice}")

        if _generate_preview_only(voice, preview_path, "-5%") and os.path.exists(preview_path):
            return jsonify({"success": True, "preview_url": f"/static/previews/{preview_id}.mp3"})

        return jsonify({"error": "Failed to generate preview"}), 500
    except Exception as e:
        print(f"❌ Preview error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/upload_images", methods=["POST"])
def upload_images():
    try:
        for f in os.listdir(UPLOADS_DIR):
            fp = os.path.join(UPLOADS_DIR, f)
            if os.path.isfile(fp):
                os.remove(fp)
        saved = []
        for idx, file in enumerate(request.files.getlist("images"), 1):
            if file and file.filename:
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
                name = f"{idx}.{ext}"
                file.save(os.path.join(UPLOADS_DIR, name))
                saved.append(name)
                print(f"✅ Uploaded: {name}")
        return jsonify({"success": True, "files": saved})
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/upload_music", methods=["POST"])
def upload_music():
    try:
        file = request.files.get('music')
        if file and file.filename:
            file.save(os.path.join(MUSIC_DIR, "background_music.mp3"))
            print("✅ Music uploaded")
            return jsonify({"success": True, "file": "background_music.mp3"})
        return jsonify({"error": "No file provided"}), 400
    except Exception as e:
        print(f"❌ Music upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/generate", methods=["POST"])
def generate_video_route():
    try:
        data = request.get_json()
        script_text = data.get('script_text', '')
        if not script_text.strip():
            return jsonify({"error": "No script provided"}), 400
        scenes = parse_script_text(script_text)
        if not scenes:
            return jsonify({"error": "No scenes found in script"}), 400

        settings = {
            'voice': data.get('voice', 'en-US-DavisNeural'),
            'rate': data.get('rate', '-5%'),
            'add_music': data.get('add_music', False),
            'music_file': os.path.join(MUSIC_DIR, 'background_music.mp3') if data.get('add_music') else None,
            'music_volume': data.get('music_volume', 0.15)
        }
        video_id = str(uuid.uuid4())
        progress_status[video_id] = 0
        print(f"\n{'='*60}\n🎬 Starting video generation | Scenes: {len(scenes)}\n{'='*60}\n")
        Thread(target=generate_video_async, args=(video_id, scenes, settings), daemon=True).start()
        return jsonify({"video_id": video_id, "scenes_count": len(scenes)})
    except Exception as e:
        print(f"❌ Generation route error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/progress/<video_id>")
def get_progress(video_id):
    return jsonify({"progress": progress_status.get(video_id, 0)})

@app.route("/download/<video_id>")
def download_video(video_id):
    path = os.path.join(VIDEOS_DIR, f"{video_id}.mp4")
    if os.path.exists(path):
        return send_file(path, as_attachment=True, download_name="cinematic_video.mp4")
    return "Video not found", 404

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# ================== MAIN ==================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🎬 CINEMATIC VIDEO GENERATOR — MEMORY-OPTIMIZED Edition")
    print("=" * 60)
    print("✨ Features:")
    print("  • Preview: Clean text, no XML tags read aloud ✅")
    print("  • Videos: Your script with breathing pauses ✅")
    print("  • FIXED: Memory-optimized subtitle rendering ✅")
    print("  • Ken Burns via cv2 pre-rendered frames")
    print("  • Subtitle frames cached per word index")
    print("  • Perfect subtitle-audio sync with Vosk")
    print("=" * 60)
    print(f"  Edge TTS: {'✅' if EDGE_TTS_AVAILABLE else '❌ pip install edge-tts'}")
    print(f"  Vosk:     {'✅ Perfect sync' if (VOSK_AVAILABLE and VOSK_MODEL) else '⚠️  Fallback timing'}")
    print(f"  OpenCV:   ✅ (required: pip install opencv-python)")
    print("=" * 60)
    print("🚀 Server: http://localhost:4000")
    print("=" * 60 + "\n")
    app.run(host="0.0.0.0", port=4000, debug=True, threaded=True, use_reloader=False)