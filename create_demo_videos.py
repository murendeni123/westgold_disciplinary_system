"""
Classly Portal Demo Video Generator  (v3 — full narration, no voice cutoff)
Creates high-quality MP4 walkthrough videos for each portal from screenshots.

Video specs:
  Resolution  : 1440 × 900 (native screenshot size)
  Frame rate  : 30 fps
  Codec       : H.264 CRF 18 (visually lossless), AAC 128 k audio
  Audio       : Kokoro neural TTS (af_heart) + ambient chord music
  Transitions : 0.6 s smooth crossfade
  Slide hold  : dynamic — each slide stays for the full narration + 2 s buffer
"""

import os
import re
import subprocess
import tempfile
import textwrap
from pathlib import Path

import numpy as np
from math import gcd
from PIL import Image, ImageDraw, ImageFont
from pydub import AudioSegment
from scipy.io import wavfile
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro as KokoroTTS

_kokoro = None
def get_kokoro():
    global _kokoro
    if _kokoro is None:
        _kokoro = KokoroTTS('/tmp/kokoro/kokoro-v1.0.onnx', '/tmp/kokoro/voices-v1.0.bin')
    return _kokoro

from moviepy import ImageClip, concatenate_videoclips
from moviepy.video.fx import CrossFadeIn

# ── Constants ──────────────────────────────────────────────────────────────────
W, H            = 1440, 900
FPS             = 30
CRF             = 18
SLIDE_DUR_MIN   = 7.5    # minimum slide hold (seconds)
SLIDE_DUR_DEF   = 8.5    # default if no narration found
SLIDE_CONT_DUR  = 4.0    # "continuation" scrolled shots — shorter hold
SECTION_DUR     = 1.5
TITLE_DUR       = 3.5
FADE            = 0.5
PRE_SILENCE_MS  = 700    # voice starts this many ms after slide appears

# Slide names ending with these are skipped — they're scroll continuations
SKIP_STEMS = {
    # True scroll-only duplicates — remove to cut runtime
    "dashboard-bottom",
    "add-student-form-filled",
    "class-detail-scroll",
    "merits-list-scroll",
    "consequences-list-scroll",
    "interventions-list-scroll",
    "reports-bottom",
    "reports-tab2",
    "notifications-scroll",
    "bulk-import-scroll",
    "settings-school-info-scroll",
    "settings-preferences-scroll",
    "settings-language-scroll",
    "detentions-scroll",
    "detention-sessions-scroll",
    "student-merits-tab",
}
SAMPLE_RATE     = 44100

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

SCREENSHOTS = Path("/home/user/westgold_disciplinary_system/screenshots")

# Suffixes that indicate a "continuation" slide (scrolled further down the same page)
CONTINUATION_SUFFIXES = ("-scroll", "-bottom", "-detail", "-charts", "-scroll",
                          "-filled", "-leaderboard")

# ── Brand colours ──────────────────────────────────────────────────────────────
BRAND = {
    "admin":      {"primary": (37,  99, 235), "accent": (219, 234, 254), "label": "Admin Portal"},
    "teacher":    {"primary": (5,  150, 105), "accent": (209, 250, 229), "label": "Teacher Portal"},
    "grade-head": {"primary": (124, 58, 237), "accent": (237, 233, 254), "label": "Grade Head Portal"},
    "parent":     {"primary": (220, 38,  38), "accent": (254, 226, 226), "label": "Parent Portal"},
}

# ── Narrations ────────────────────────────────────────────────────────────────
# Each narration is ~12–14 words → ~4–5 s of speech → slide holds ~6–7 s total.
NARRATIONS = {
    "login":                       "Welcome to Classly. Sign in with your email and school code.",
    "login-filled":                "Enter your credentials and click Sign In to access your portal.",
    "dashboard":                   "The dashboard shows live totals for incidents, merits, detentions, and pending reviews.",
    "dashboard-charts":            "Scroll down to see behaviour trend charts and performance summaries.",
    "dashboard-bottom":            "Recent activity cards keep you updated on the latest school events.",
    "students-list":               "Students lists every learner with class, grade, and point totals.",
    "students-search":             "Search by name to instantly locate any student in the school.",
    "add-student-modal":           "Click Add Student to enrol a new learner and enter their details.",
    "add-student-form-filled":     "Fill in the student's name, class, and date of birth, then save.",
    "student-profile":             "Each profile shows personal details, class, and cumulative point history.",
    "student-profile-detail":      "Scroll to see the student's full incident and merit history.",
    "student-incidents-tab":       "The Incidents tab shows every behaviour event logged for this student.",
    "student-merits-tab":          "The Merits tab shows all recognition awards the student has received.",
    "classes-list":                "Classes shows every active group with teacher and enrolment details.",
    "class-detail":                "Drill into a class to view all students and their behaviour summaries.",
    "class-detail-scroll":         "Scroll for class statistics and quick links to log incidents or merits.",
    "teachers-list":               "Teachers lists all staff with their departments and class assignments.",
    "add-teacher-modal":           "Click Add Teacher to invite a new staff member to the portal.",
    "parents-list":                "Parents shows all registered guardians and their linked children.",
    "behaviour-all-incidents":     "Behaviour lists every incident logged across the school with status.",
    "behaviour-pending-filter":    "Filter to Pending to focus on incidents awaiting your approval.",
    "incident-detail-modal":       "Click an incident to view full details and approve or reject it.",
    "incident-approved":           "On approval, demerit points are applied and parents notified automatically.",
    "log-incident-blank":          "Log an incident by selecting the student, rule broken, and severity.",
    "log-incident-filled":         "Add a description, then click Submit to send for admin review.",
    "merits-list":                 "Merits shows all recognition awards given across the school.",
    "merits-list-scroll":          "Browse the full awards history with dates, categories, and point values.",
    "award-merit-blank":           "Award a merit by selecting the student and the merit category.",
    "award-merit-filled":          "Add a reason for the award before confirming — it appears on the profile.",
    "award-merit-confirm":         "Confirm all details are correct before saving the merit award.",
    "award-merit-success":         "The merit is saved, points are added, and the parent is notified.",
    "detention-sessions":          "Detention Sessions shows all scheduled and completed sessions.",
    "detention-qualifying-students": "Qualifying Students lists learners who have reached the demerit threshold.",
    "detention-queue":             "The queue shows students formally placed in the next available session.",
    "detention-create-modal":      "Create a session by entering the date, time, venue, and capacity.",
    "detention-create-filled":     "Review session details, then save to make it available for assignments.",
    "detention-session-detail":    "Open a session to manage attendance and add qualifying students.",
    "consequences-list":           "Consequences tracks all formal sanctions assigned to students.",
    "consequences-list-scroll":    "Each record shows the type, reason, dates, status, and assigning admin.",
    "consequence-detail-modal":    "Open a consequence to update its status or add progress notes.",
    "consequence-management":      "Configure the consequence types available at your school here.",
    "interventions-list":          "Interventions logs all support plans put in place for at-risk students.",
    "interventions-list-scroll":   "Each record shows the type, goals, facilitator, dates, and status.",
    "intervention-detail-modal":   "Open an intervention to review its plan, goals, and outcome notes.",
    "discipline-centre":           "The Discipline Centre is your analytics hub for school-wide behaviour data.",
    "discipline-centre-charts":    "Charts break down incidents by category, class, and time period.",
    "discipline-centre-leaderboard": "Leaderboards rank classes and students by behaviour and merit performance.",
    "discipline-rules":            "Manage your school's discipline code, point values, and rule categories.",
    "discipline-rules-scroll":     "Edit existing rules or add new categories to the code of conduct.",
    "reports-overview":            "Reports generates analytics on behaviour trends and student progress.",
    "reports-charts":              "Visual charts let you present insights to leadership and parents.",
    "reports-bottom":              "Data tables allow you to filter and drill down by class or date.",
    "notifications":               "Notifications shows all system alerts for incidents, merits, and messages.",
    "notifications-scroll":        "Older notifications are archived here for your reference.",
    "bulk-import":                 "Bulk Import lets you upload student or staff records from a spreadsheet.",
    "bulk-import-scroll":          "Download the template, fill it in, and upload to import all records.",
    "smart-import":                "Smart Import maps your spreadsheet columns automatically and flags errors.",
    "settings-profile-tab":        "Update your display name and email address on the Profile tab.",
    "settings-password-tab":       "Change your account password here to keep your account secure.",
    "settings-school-info-tab":    "School Info shows your school name and the unique school code to share.",
    "settings-school-info-scroll": "Scroll to see subscription tier and maximum capacity details.",
    "settings-preferences-tab":    "Preferences lets you choose which system events trigger notifications.",
    "settings-preferences-scroll": "Review all notification options including incidents, merits, and messages.",
    "settings-language-tab":       "Set the Global Language for all users, or your own personal preference.",
    "settings-language-scroll":    "Classly supports English, Afrikaans, Zulu, and Xhosa.",
    "user-management":             "User Management shows all registered accounts with roles and status.",
    # teacher
    "my-classes":                  "My Classes shows all classes you currently teach.",
    "behaviour-list":              "Browse all incidents you have logged with their approval status.",
    "detentions":                  "Detentions shows upcoming sessions and which of your students are assigned.",
    "detentions-scroll":           "Scroll to review your students' full detention history.",
    "interventions":               "Interventions shows all active support plans for students in your classes.",
    "consequences":                "Consequences shows formal sanctions for students in your classes.",
    "reports":                     "Reports provides behaviour and merit analytics for your classes.",
    "reports-scroll":              "Scroll for detailed charts on incident frequency and merit distribution.",
    "settings-profile":            "Update your display name and email on the Profile settings tab.",
    "settings-password":           "Use the Password tab to update your account password.",
    "settings-preferences":        "Configure which notification types you receive in Preferences.",
    "settings-language":           "Set your preferred portal language in the Language tab.",
    # grade head
    "students-list":               "Students lists every learner in your grade with class and point totals.",
    "students-search":             "Search by name to find any student within your grade.",
    "classes":                     "Classes shows all groups in your grade with teachers and enrolment.",
    "behaviour-all":               "Behaviour shows all incidents logged across your entire grade.",
    "behaviour-pending":           "Pending shows only incidents in your grade awaiting review.",
    "detention-sessions":          "Detention Sessions shows scheduled sessions relevant to your grade.",
    "detention-sessions-scroll":   "Scroll to see older sessions and past attendance records.",
    "my-teachings":                "My Teachings shows all subjects and classes you personally teach.",
    "discipline-centre":           "Discipline Centre shows analytics specific to your grade.",
    "discipline-charts":           "Charts show incident frequency and trends across your grade's classes.",
    "consequence-management":      "Review and update formal sanctions for students in your grade here.",
    # parent
    "my-children":                 "My Children shows a summary card for each child in your account.",
    "child-profile":               "Click a child to view their class, points, and full activity history.",
    "child-profile-scroll":        "Scroll for incidents, merits, detentions, and active interventions.",
    "behaviour":                   "Behaviour shows all incidents recorded for your children at school.",
    "behaviour-detail":            "Open an incident to read the full description and outcome.",
    "merits":                      "Merits shows all positive recognition awards your children have received.",
    "attendance":                  "Attendance shows your child's daily present, absent, and late records.",
    "attendance-scroll":           "Scroll for a full term view to spot patterns in attendance.",
    "detentions":                  "Detentions shows whether your child has been assigned to a session.",
    "interventions":               "Interventions shows any active support plans set up for your child.",
    "consequences":                "Consequences shows any formal sanctions your child has received.",
    "consequence-detail":          "Open a consequence to read the full details and required actions.",
    "messages-inbox":              "Messages shows all communications received from the school.",
    "messages-sent":               "Sent keeps a record of all messages you have sent to the school.",
    "compose-blank":               "Compose a message by choosing a recipient and entering your subject.",
    "compose-filled":              "Review your message before sending it to the school.",
    "profile":                     "Your profile shows your contact details and linked children.",
    "profile-scroll":              "Scroll to manage emergency contacts and communication preferences.",
    "settings":                    "Settings lets you update account details and notification preferences.",
    "settings-scroll":             "Scroll to manage linked children and language preferences.",
}



# ── TTS helpers ────────────────────────────────────────────────────────────────

def synthesize_narration(text: str, output_wav: Path):
    """Synthesise narration with Kokoro neural TTS (af_heart voice)."""
    k = get_kokoro()
    samples, sr = k.create(text, voice='af_heart', speed=1.0, lang='en-us')
    g = gcd(sr, SAMPLE_RATE)
    samples_44k = resample_poly(samples, SAMPLE_RATE // g, sr // g).astype(np.float32)
    i16 = (np.clip(samples_44k, -1.0, 1.0) * 32767).astype(np.int16)
    wavfile.write(str(output_wav), SAMPLE_RATE, i16)


def estimate_speech_seconds(text: str) -> float:
    """Estimate speech duration from word count at ~2.8 words per second."""
    return max(2.0, len(text.split()) / 2.8)


def slide_duration_for(stem: str, narration: str | None) -> float:
    """Return the appropriate slide duration based on narration length."""
    base = re.sub(r"^\d+-", "", stem).lower()
    # Continuation shots are shorter
    if any(base.endswith(s) for s in ("-scroll", "-bottom")):
        return SLIDE_CONT_DUR if not narration else max(SLIDE_CONT_DUR, estimate_speech_seconds(narration) + 2.0)
    if not narration:
        return SLIDE_DUR_DEF
    return max(SLIDE_DUR_MIN, estimate_speech_seconds(narration) + 2.0)


# ── Screenshot selection ───────────────────────────────────────────────────────

def walkthrough_screenshots(folder: Path):
    """Return PNGs sorted by name, skipping continuation/scroll slides."""
    result = []
    for f in sorted(folder.glob("*.png")):
        if f.name.startswith("._"):
            continue
        base = re.sub(r"^\d+-", "", f.stem)
        if base in SKIP_STEMS:
            continue
        result.append(f)
    return result


# ── Visual helpers ─────────────────────────────────────────────────────────────

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def gradient_bg(color1, color2, w=W, h=H):
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        t = y / (h - 1)
        arr[y, :] = [int(color1[i] * (1 - t) + color2[i] * t) for i in range(3)]
    return Image.fromarray(arr)


def darken(color, factor=0.6):
    return tuple(int(c * factor) for c in color)


def lighten(color, factor=1.4):
    return tuple(min(255, int(c * factor)) for c in color)


def make_title_card(portal_key, subtitle=""):
    cfg   = BRAND[portal_key]
    pri   = cfg["primary"]
    label = cfg["label"]
    img   = gradient_bg(darken(pri, 0.45), darken(pri, 0.75))

    from PIL import Image as PILImage
    overlay = PILImage.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.polygon([(0, H//2), (W, H//4), (W, H//2+80), (0, H//2+220)],
               fill=(*lighten(pri, 1.3), 22))
    img  = PILImage.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    draw.text((60, 52),  "Classly",                                 font=load_font(FONT_BOLD, 34), fill=(255, 255, 255))
    draw.text((60, 92),  "School Disciplinary Management Platform",  font=load_font(FONT_REG,  20), fill=(200, 220, 255))
    draw.text((80, H // 2 - 80), label, font=load_font(FONT_BOLD, 78), fill=(255, 255, 255))
    if subtitle:
        draw.text((82, H // 2 + 22), subtitle, font=load_font(FONT_REG, 28), fill=(210, 230, 255))
    draw.rectangle([(0, H - 8), (W, H)], fill=lighten(pri, 1.5))
    return np.array(img)


def make_closing_card():
    img  = gradient_bg((15, 23, 42), (30, 41, 59))
    draw = ImageDraw.Draw(img)
    title_font = load_font(FONT_BOLD, 56)
    body_font  = load_font(FONT_REG,  28)
    small_font = load_font(FONT_REG,  22)

    tw = draw.textlength("Classly", font=title_font)
    draw.text(((W - tw) // 2, H // 2 - 100), "Classly", font=title_font, fill=(255, 255, 255))
    sub = "School Disciplinary Management Platform"
    sw  = draw.textlength(sub, font=body_font)
    draw.text(((W - sw) // 2, H // 2 - 28), sub, font=body_font, fill=(148, 163, 184))
    tg  = "Empowering schools with transparent, consistent discipline"
    tgw = draw.textlength(tg, font=small_font)
    draw.text(((W - tgw) // 2, H // 2 + 50), tg, font=small_font, fill=(100, 116, 139))
    return np.array(img)


def make_section_card(section_title, portal_key):
    cfg  = BRAND[portal_key]
    pri  = cfg["primary"]
    img  = gradient_bg(darken(pri, 0.35), darken(pri, 0.60))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(60, H // 2 - 55), (W - 60, H // 2 - 50)], fill=(*lighten(pri, 1.6), 255))
    font = load_font(FONT_BOLD, 56)
    tw   = draw.textlength(section_title, font=font)
    draw.text(((W - tw) // 2, H // 2 - 40), section_title, font=font, fill=(255, 255, 255))
    draw.rectangle([(0, H - 6), (W, H)], fill=lighten(pri, 1.5))
    return np.array(img)


def add_caption(screenshot_path, caption_text, portal_key):
    cfg = BRAND[portal_key]
    pri = cfg["primary"]
    img = Image.open(screenshot_path).convert("RGB")
    if img.size != (W, H):
        img = img.resize((W, H), Image.LANCZOS)

    bar_h   = 90
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od      = ImageDraw.Draw(overlay)
    od.rectangle([(0, H - bar_h), (W, H)],  fill=(10, 15, 30, 215))
    od.rectangle([(0, H - bar_h), (6, H)],  fill=(*pri, 255))

    cap_font = load_font(FONT_REG, 21)
    lines    = textwrap.wrap(caption_text, width=115)
    y_start  = H - bar_h + 14
    for i, line in enumerate(lines[:3]):
        od.text((24, y_start + i * 26), line, font=cap_font, fill=(230, 240, 255, 245))

    step_font = load_font(FONT_BOLD, 16)
    od.text((W - 200, H - bar_h + 18), cfg["label"], font=step_font, fill=(*lighten(pri, 1.6), 200))

    return np.array(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))


def stem_to_caption(stem):
    name = re.sub(r"^\d+-", "", stem)
    return name.replace("-", " ").title()


def infer_section(stem):
    name = re.sub(r"^\d+-", "", stem).lower()
    if "login" in name:                                    return "Getting Started"
    if "dashboard" in name:                                return "Dashboard Overview"
    if "my-teach" in name:                                 return "My Teachings"
    if "student" in name:                                  return "Student Management"
    if "add-student" in name:                              return "Student Management"
    if "class" in name:                                    return "Class Management"
    if "teacher" in name or "add-teacher" in name:         return "Teacher Management"
    if "parent" in name:                                   return "Parent Management"
    if "log-incident" in name:                             return "Logging Incidents"
    if "behaviour" in name or "incident" in name:          return "Behaviour Management"
    if "merit" in name or "award" in name:                 return "Merits & Awards"
    if "detention" in name:                                return "Detention Management"
    if "consequence" in name:                              return "Consequence Management"
    if "intervention" in name:                             return "Interventions & Support"
    if "discipline" in name:                               return "Discipline Centre"
    if "report" in name or "analytic" in name:             return "Reports & Analytics"
    if "notif" in name:                                    return "Notifications"
    if "bulk" in name or "import" in name:                 return "Bulk Operations"
    if "setting" in name:                                  return "Settings"
    if "user-manage" in name:                              return "User Management"
    if "message" in name or "compose" in name:             return "Messaging"
    if "child" in name or "children" in name:              return "My Children"
    if "attend" in name:                                   return "Attendance"
    if "profile" in name:                                  return "Profile"
    return "Features Overview"


# ── Ambient music ──────────────────────────────────────────────────────────────

def generate_ambient_track(duration_sec: float) -> np.ndarray:
    n   = int(SAMPLE_RATE * duration_sec)
    t   = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    out = np.zeros(n, dtype=np.float64)

    chords = [
        [174.61, 220.00, 261.63, 329.63, 392.00],  # Fmaj9
        [130.81, 164.81, 196.00, 246.94, 293.66],  # Cmaj9
        [196.00, 246.94, 293.66, 369.99, 440.00],  # Gmaj9
        [146.83, 184.99, 220.00, 277.18, 329.63],  # Dmaj9
    ]
    chord_sec = 12.0
    repeats   = int(np.ceil(duration_sec / (len(chords) * chord_sec))) + 2

    for rep in range(repeats):
        for ci, freqs in enumerate(chords):
            s0 = int((rep * len(chords) + ci) * chord_sec * SAMPLE_RATE)
            s1 = min(int(s0 + chord_sec * SAMPLE_RATE), n)
            if s0 >= n:
                break
            seg_t = np.arange(s1 - s0, dtype=np.float64) / SAMPLE_RATE
            seg   = np.zeros(s1 - s0)
            for f in freqs:
                seg += np.sin(2 * np.pi * f         * seg_t) * 0.040
                seg += np.sin(2 * np.pi * f * 2     * seg_t) * 0.010
                seg += np.sin(2 * np.pi * f * 1.001 * seg_t) * 0.008
            xf = min(int(1.5 * SAMPLE_RATE), len(seg) // 3)
            seg[:xf]  *= np.linspace(0, 1, xf)
            seg[-xf:] *= np.linspace(1, 0, xf)
            out[s0:s1] += seg

    out *= 0.88 + 0.12 * np.sin(2 * np.pi * 0.07 * t)
    peak = np.max(np.abs(out)) + 1e-9
    out  = out / peak * 0.13
    fn = min(int(3 * SAMPLE_RATE), n // 4)
    out[:fn]  *= np.linspace(0, 1, fn)
    out[-fn:] *= np.linspace(1, 0, fn)
    return out


# ── Audio track builder ────────────────────────────────────────────────────────

def build_audio_track(slide_timings: list, total_sec: float) -> AudioSegment:
    """
    Compose the full stereo audio track:
      - Ambient background music for the entire duration
      - Kokoro af_heart voiceover for each slide, starting PRE_SILENCE_MS after the slide appears
      - Voice is NOT clipped — the slide duration is already set to accommodate the full narration
    """
    bg_arr = generate_ambient_track(total_sec + 4)
    bg_i16 = (bg_arr * 32767).astype(np.int16)
    bg_seg = AudioSegment(
        bg_i16.tobytes(), frame_rate=SAMPLE_RATE, sample_width=2, channels=1
    ).set_channels(2)
    master = bg_seg[:int(total_sec * 1000)]

    with tempfile.TemporaryDirectory() as tmpdir:
        for start_sec, stem, slide_dur in slide_timings:
            base      = re.sub(r"^\d+-", "", stem)
            narration = NARRATIONS.get(base)
            if not narration:
                continue

            wav_path = Path(tmpdir) / f"{stem}.wav"
            try:
                synthesize_narration(narration, wav_path)
            except Exception as e:
                print(f"  ⚠  TTS skip {stem}: {e}")
                continue

            voice = AudioSegment.from_wav(str(wav_path))
            if voice.max_dBFS < -60:
                continue
            # Normalise voice to -8 dBFS (comfortable foreground level)
            voice = voice.apply_gain(-voice.max_dBFS - 8).set_channels(2)

            # Ensure voice does not overflow past the end of its slide
            max_voice_ms = int((slide_dur - 0.8) * 1000)
            if len(voice) > max_voice_ms:
                voice = voice[:max_voice_ms].fade_out(200)

            pre   = AudioSegment.silent(PRE_SILENCE_MS, frame_rate=SAMPLE_RATE).set_channels(2)
            voice = pre + voice

            pos_ms = int(start_sec * 1000)
            if pos_ms < len(master):
                master = master.overlay(voice, position=pos_ms)

    return master


# ── Core video builder ─────────────────────────────────────────────────────────

def build_video(portal_key: str, screenshots: list, output_path: Path):
    cfg   = BRAND[portal_key]
    label = cfg["label"]
    print(f"\n🎬  Building {label} video ({len(screenshots)} screenshots)...")

    clips         = []
    current_sec   = None
    slide_timings = []   # (start_time_sec, stem, slide_dur)
    t             = 0.0

    def add_clip(arr, duration):
        nonlocal t
        clips.append(ImageClip(arr, duration=duration).with_effects([CrossFadeIn(FADE)]))
        t += duration - FADE

    # Opening title card
    add_clip(make_title_card(portal_key,
             f"Complete feature walkthrough  •  {len(screenshots)} screens"), TITLE_DUR)

    for img_path in screenshots:
        stem      = img_path.stem
        section   = infer_section(stem)
        caption   = stem_to_caption(stem)
        base      = re.sub(r"^\d+-", "", stem)
        narration = NARRATIONS.get(base)
        dur       = slide_duration_for(stem, narration)

        if section != current_sec:
            add_clip(make_section_card(section, portal_key), SECTION_DUR)
            current_sec = section
            print(f"  ── {section}")

        slide_timings.append((t, stem, dur))

        try:
            frame = add_caption(img_path, caption, portal_key)
        except Exception as e:
            print(f"  ⚠  Skipping {img_path.name}: {e}")
            slide_timings.pop()
            continue

        add_clip(frame, dur)
        nar_status = f"({len(narration.split())}w)" if narration else "(no narration)"
        print(f"    ✓ {img_path.name}  {dur:.1f}s  {nar_status}")

    add_clip(make_closing_card(), TITLE_DUR)
    total_duration = t + FADE

    # ── Audio ──────────────────────────────────────────────────────────────────
    print(f"  🎵  Generating audio ({len(slide_timings)} narrations + ambient)...")
    audio_track = build_audio_track(slide_timings, total_duration)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_wav = tmp.name
    audio_track.export(audio_wav, format="wav")

    # ── Silent video ───────────────────────────────────────────────────────────
    silent_mp4 = output_path.with_suffix(".silent.mp4")
    print(f"  Encoding {len(clips)} clips → {silent_mp4.name} ...")
    video = concatenate_videoclips(clips, method="compose", padding=-FADE)
    video.write_videofile(
        str(silent_mp4), fps=FPS, codec="libx264",
        ffmpeg_params=["-crf", str(CRF), "-preset", "slow",
                       "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        logger=None, audio=False,
    )
    video.close()

    # ── Merge ──────────────────────────────────────────────────────────────────
    print(f"  Mixing audio + video → {output_path.name} ...")
    subprocess.run(
        ["ffmpeg", "-y",
         "-i", str(silent_mp4), "-i", audio_wav,
         "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest",
         str(output_path)],
        check=True, capture_output=True
    )

    silent_mp4.unlink(missing_ok=True)
    Path(audio_wav).unlink(missing_ok=True)

    size_mb = output_path.stat().st_size / 1_048_576
    total_s = int(total_duration)
    print(f"  ✅  {output_path.name}  {total_s//60}:{total_s%60:02d} min  {size_mb:.1f} MB")


# ── Portal definitions ────────────────────────────────────────────────────────

PORTALS = [
    {
        "key":    "admin",
        "folder": SCREENSHOTS / "admin",
        "output": SCREENSHOTS / "admin" / "admin_portal_demo.mp4",
    },
    {
        "key":    "teacher",
        "folder": SCREENSHOTS / "teacher-walkthrough",
        "output": SCREENSHOTS / "teacher-walkthrough" / "teacher_portal_demo.mp4",
    },
    {
        "key":    "grade-head",
        "folder": SCREENSHOTS / "grade-head",
        "output": SCREENSHOTS / "grade-head" / "grade_head_portal_demo.mp4",
    },
    {
        "key":    "parent",
        "folder": SCREENSHOTS / "parent",
        "output": SCREENSHOTS / "parent" / "parent_portal_demo.mp4",
    },
]


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    portal_filter = sys.argv[1] if len(sys.argv) > 1 else None

    print("=" * 60)
    print("  Classly Portal Demo Video Generator  v3")
    print("=" * 60)

    for portal in PORTALS:
        key    = portal["key"]
        if portal_filter and key != portal_filter:
            continue
        folder = portal["folder"]
        out    = portal["output"]

        screenshots = walkthrough_screenshots(folder)
        if not screenshots:
            print(f"\n⚠  No screenshots found in {folder}")
            continue

        build_video(key, screenshots, out)

    print("\n" + "=" * 60)
    print("  Done!")
    print("=" * 60)
    for portal in PORTALS:
        if portal_filter and portal["key"] != portal_filter:
            continue
        out = portal["output"]
        if out.exists():
            mb  = out.stat().st_size / 1_048_576
            dur = int(subprocess.run(
                ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(out)],
                capture_output=True, text=True).stdout.strip().split(".")[0])
            print(f"  {out.name}  {dur//60}:{dur%60:02d} min  {mb:.1f} MB")
