"""
Classly Portal Demo Video Generator  (v2 — voiceover + ambient music)
Creates high-quality MP4 walkthrough videos for each portal from screenshots.

Video specs:
  Resolution  : 1440 × 900 (native screenshot size)
  Frame rate  : 30 fps
  Codec       : H.264 CRF 18 (visually lossless), AAC 128 k audio
  Audio       : Kokoro neural TTS (af_heart) + scipy-generated ambient chords
  Transitions : 0.6 s smooth crossfade between slides
  Slide hold  : 4 s per screenshot, 2.2 s per section header, 4.5 s title cards
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
W, H        = 1440, 900
FPS         = 30
CRF         = 18
SLIDE_DUR   = 5.0   # 5 s gives narration (≤3.8 s) + 0.75 s lead-in + buffer
SECTION_DUR = 2.2
TITLE_DUR   = 4.5
FADE        = 0.6
SAMPLE_RATE = 44100

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

SCREENSHOTS = Path("/home/user/westgold_disciplinary_system/screenshots")

# ── Brand colours ──────────────────────────────────────────────────────────────
BRAND = {
    "admin":      {"primary": (37,  99, 235), "accent": (219, 234, 254), "label": "Admin Portal"},
    "teacher":    {"primary": (5,  150, 105), "accent": (209, 250, 229), "label": "Teacher Portal"},
    "grade-head": {"primary": (124, 58, 237), "accent": (237, 233, 254), "label": "Grade Head Portal"},
    "parent":     {"primary": (220, 38,  38), "accent": (254, 226, 226), "label": "Parent Portal"},
}

# ── Narration scripts ──────────────────────────────────────────────────────────
# ~8-12 words each so they fit comfortably within the 4-second slide window.
NARRATIONS = {
    # Login
    "login-page":                    "Welcome to Classly. Sign in with your school credentials to begin.",
    "login-credentials-filled":      "Enter your email and password, then click Sign In.",
    "login-credentials-entered":     "Enter your email and password, then click Sign In.",
    # Dashboard
    "dashboard-overview":            "The dashboard shows a complete overview of school discipline activity.",
    "dashboard-quick-actions":       "Use quick actions to jump straight to common tasks.",
    "dashboard-behaviour-trends":    "Behaviour trend charts help you spot patterns and at-risk students early.",
    "dashboard-pending-incidents":   "Pending incidents awaiting your review are highlighted here.",
    "dashboard-charts":              "Charts give a visual summary of recent behaviour and merit data.",
    "dashboard-recent-activity":     "Recent activity keeps you up to date with the latest events.",
    "dashboard-class-activity":      "Class activity highlights which groups need the most attention.",
    # Students
    "students-list":                 "The Students module lists every enrolled student with class and behaviour summary.",
    "students-search":               "Use the search bar to quickly find any student by name or number.",
    "students-add-modal":            "Add a new student by entering their name, grade, and parent details.",
    "student-profile-overview":      "Each student profile shows contact details, class, and point totals.",
    "student-profile-history":       "The history tab shows every incident and merit logged for this student.",
    "student-profile-incidents":     "Review all logged incidents for this student in one place.",
    # Classes
    "classes-list":                  "Classes shows all active groups, assigned teachers, and enrolment counts.",
    "classes-overview":              "An overview of all classes in the school with their current status.",
    "class-detail-students":         "Drill into a class to view its students and behaviour summaries.",
    "class-detail-actions":          "Class actions let you log incidents or award merits to the whole group.",
    # Teachers
    "teachers-list":                 "Manage teaching staff, view class assignments, and set grade head roles.",
    # Behaviour
    "behaviour-all-incidents":       "All Incidents shows every behaviour report logged across the school.",
    "behaviour-incidents":           "Browse all logged incidents with status and severity indicators.",
    "behaviour-incidents-list":      "Filter and review incidents logged by your classes.",
    "behaviour-pending-filter":      "Filter to Pending to focus on incidents that still need your approval.",
    "behaviour-pending-only":        "The Pending view focuses only on incidents awaiting review.",
    "behaviour-incident-detail-modal": "Click an incident to view full details and choose an outcome.",
    "behaviour-incident-detail":     "The detail view shows the full incident record and supporting information.",
    "behaviour-before-approve":      "Review the incident carefully before approving or rejecting.",
    "behaviour-incident-approved":   "Once approved, demerit points are applied to the student automatically.",
    # Logging incidents
    "log-incident-blank-form":       "Log a new behaviour incident by selecting the student and rule broken.",
    "log-incident-form":             "Select the student, rule, and severity to start logging an incident.",
    "log-incident-class-selected":   "Choose the class first to filter the student list.",
    "log-incident-dropdowns-filled": "Select the incident type, rule broken, and severity level.",
    "log-incident-form-complete":    "Add a description and any additional notes before submitting.",
    "log-incident-filled":           "Review all details are correct before submitting the incident.",
    "log-incident-submit-area":      "Click Submit to send the incident for review.",
    "log-incident-submitted":        "The incident is submitted and now pending admin approval.",
    # Merits
    "merits-list":                   "The Merits module shows all recognition awards given to students.",
    "merit-award-form":              "Award a merit by selecting the student and achievement being recognised.",
    "award-merit-blank-form":        "Select a student and merit type to start awarding recognition.",
    "award-merit-dropdowns-filled":  "Choose the merit category and point value for this award.",
    "award-merit-form-complete":     "Add a reason for the award before confirming.",
    "award-merit-form":              "Fill in the student, category, and reason for this merit award.",
    "award-merit-filled":            "Review the merit details, then click Confirm to proceed.",
    "award-merit-confirmation-modal": "Confirm the award details before finalising.",
    "award-merit-confirmation":      "Confirm the details before saving this merit award.",
    "award-merit-success":           "The merit award has been recorded and the student notified.",
    # Detentions
    "detention-sessions-list":       "The Detentions module shows all scheduled sessions and their status.",
    "detentions-overview":           "Overview of upcoming and past detention sessions across the school.",
    "detention-qualifying-students": "Students who have accumulated enough demerit points appear here.",
    "detentions-student-list":       "Students eligible for detention based on their demerit totals.",
    "detention-create-modal-empty":  "Create a new detention session by setting the date, time, and venue.",
    "detention-create-modal-filled": "Review the session details before saving.",
    "detention-session-created":     "The new session is created and ready for student assignments.",
    "detention-session-details-modal": "Click a session to manage attendance and add students.",
    "detention-session-details":     "View session details and manage the list of attending students.",
    "detention-add-students-modal":  "Add qualifying students to this session with one click.",
    "detentions-detail":             "Detailed view of a specific detention session and its participants.",
    # Discipline centre
    "discipline-center":             "The Discipline Centre is your analytics hub for school-wide behaviour data.",
    "discipline-center-charts":      "Charts break down incidents by category, class, and time period.",
    "discipline-center-leaderboards": "Leaderboards highlight classes and students with the most recorded activity.",
    "discipline-rules":              "Manage the school's discipline rules, point values, and categories.",
    # Consequences
    "consequences-list":             "Consequences tracks all formal sanctions assigned to students.",
    "consequence-management":        "Update consequence statuses, add notes, and track resolution progress.",
    "consequences-overview":         "An overview of all active and resolved consequences across the school.",
    "consequence-details-modal":     "View the full details of a specific consequence assignment.",
    # Interventions
    "interventions-list":            "Interventions logs supportive actions for students who need additional help.",
    "interventions-filters":         "Filter interventions by type, status, or student.",
    "interventions-guided-start":    "The guided workflow walks you through setting up a new intervention plan.",
    "interventions-overview":        "Overview of all active support interventions currently in place.",
    # Reports
    "reports-analytics":             "Reports generates detailed analytics on behaviour trends and student progress.",
    "reports-charts":                "Visual charts make it easy to present data to parents and leadership.",
    "reports-overview":              "The Reports overview summarises key metrics for the current academic period.",
    # Settings
    "settings-overview":             "Settings lets you configure school-wide preferences and system behaviour.",
    "settings-thresholds":           "Set demerit thresholds that trigger automatic detention referrals.",
    "settings-profile":              "Update your profile details and account preferences here.",
    "settings-profile-tab":          "The Profile tab lets you update your personal and contact information.",
    "settings-password-tab":         "Change your password here to keep your account secure.",
    "settings-school-children-tab":  "Manage which children are linked to your parent account.",
    "settings-preferences-tab":      "Set your notification preferences and language settings.",
    "settings-password":             "Update your password from the Security settings tab.",
    "settings-preferences":          "Configure notification and display preferences.",
    # Notifications
    "notifications-page":            "The Notifications centre shows all system alerts and messages.",
    "notifications-list":            "View all recent notifications including incident updates and merit awards.",
    "notifications-older":           "Older notifications are archived here for your reference.",
    "notifications":                 "Notifications keep you informed of important events in real time.",
    # Bulk operations
    "bulk-import":                   "Bulk import lets you upload student or teacher records from a spreadsheet.",
    # Messaging
    "messages-inbox":                "The Messages inbox shows all received communications from school staff.",
    "messages-sent":                 "Sent messages keeps a record of all communications you have sent.",
    "messages-compose-modal":        "Compose a message by selecting a recipient and entering your text.",
    "messages-compose-filled":       "Review your message before sending it to the school.",
    "messages-sent-confirmation":    "Your message has been sent and the recipient will be notified.",
    # Parent-specific
    "children-overview":             "My Children shows a summary card for each of your children.",
    "child-profile-liam":            "Click a child's card to view their full profile and activity history.",
    "child-profile-liam-detail":     "The detailed profile shows behaviour, merits, and attendance at a glance.",
    "child-profile-aisha":           "Each child has their own profile with a complete activity history.",
    "attendance-overview":           "Attendance shows your child's record for the current term.",
    "attendance-records":            "Detailed records show every present, absent, and late entry.",
    "profile-overview":              "Your profile shows your personal details and linked children.",
    "profile-editing":               "Edit your contact details and emergency contact information here.",
    "profile-emergency-contacts":    "Keep emergency contacts up to date for school records.",
    "profile-saved":                 "Your profile changes have been saved successfully.",
    "sidebar-navigation":            "The sidebar gives you quick access to every section of the portal.",
    # Grade-head specific
    "grade-dashboard-overview":      "The Grade dashboard shows behaviour data for your entire grade.",
    "grade-dashboard-quick-actions": "Quick actions let you manage grade-level discipline at a glance.",
    "grade-dashboard-charts":        "Charts visualise trends across all classes within your grade.",
    "my-dashboard-overview":         "Your personal dashboard shows activity for your own classes.",
    "my-dashboard-activity-feed":    "The activity feed shows recent incidents and merits from your classes.",
    "my-teachings":                  "My Teachings lists all classes you currently teach.",
    "my-teachings-class-detail":     "Select a class to view its students and manage their behaviour.",
    "my-class":                      "My Class shows the class you are responsible for as grade head.",
    # Short-stem names used by the new capture script
    "login":                         "Welcome to Classly. Sign in with your school credentials to begin.",
    "login-filled":                  "Enter your email and password, then click Sign In to access the portal.",
    "dashboard":                     "The dashboard gives you a live overview of school discipline activity.",
    "dashboard-charts":              "Scroll down to see behaviour trend charts and performance summaries.",
    "dashboard-activity":            "Recent activity shows the latest incidents, merits, and alerts.",
    "students":                      "The Students module lists every enrolled student with their class and point totals.",
    "students-search":               "Use the search bar to instantly locate any student by name.",
    "add-student-modal":             "Add a new student by entering their details and linking a parent account.",
    "student-profile":               "Each student profile shows their personal details, class, and point history.",
    "student-incidents":             "The incidents tab shows every behaviour event logged for this student.",
    "student-history":               "The history tab shows every incident and merit recorded for this student.",
    "classes":                       "Classes shows all active groups, their teachers, and enrolment counts.",
    "teachers":                      "Manage teaching staff, view assignments, and assign grade head roles.",
    "behaviour-all":                 "All Incidents displays every behaviour report logged across the school.",
    "behaviour-pending":             "Filter to Pending to focus only on incidents that still need approval.",
    "incident-detail":               "Click any incident to review the full details and select an outcome.",
    "incident-approved":             "Once approved, demerit points are automatically applied to the student.",
    "merits":                        "The Merits module tracks all recognition awards given across the school.",
    "merit-award-form":              "Award a merit by selecting the student and the achievement being recognised.",
    "merit-form-filled":             "Review the details before confirming the merit award.",
    "detentions":                    "The Detentions module shows all scheduled sessions and their current status.",
    "qualifying-students":           "Students who have reached the demerit threshold are listed here for detention.",
    "create-detention-modal":        "Schedule a new detention session by setting the date, time, and venue.",
    "create-detention-filled":       "Review the session details carefully before saving.",
    "detention-detail":              "Open a session to manage attendance and add qualifying students.",
    "discipline-centre":             "The Discipline Centre is your analytics hub for school-wide behaviour data.",
    "discipline-leaderboard":        "Leaderboards rank classes and students by behaviour and merit performance.",
    "discipline-charts":             "Charts break down incidents and trends by category, class, and time period.",
    "discipline-rules":              "Manage the school's discipline rules, point values, and categories.",
    "consequences":                  "The Consequences module tracks all formal sanctions assigned to students.",
    "interventions":                 "Interventions logs supportive actions for students who need extra help.",
    "reports":                       "Reports generates detailed analytics on behaviour trends and student progress.",
    "reports-charts":                "Visual charts make it easy to present insights to parents and leadership.",
    "settings":                      "Settings lets you configure school-wide preferences and system behaviour.",
    "settings-thresholds":           "Set demerit thresholds that automatically trigger detention referrals.",
    "notifications":                 "The Notifications centre shows all system alerts and important messages.",
    "bulk-import":                   "Bulk import lets you upload student or teacher records from a spreadsheet.",
    "my-classes":                    "My Classes shows all the classes you are currently responsible for.",
    "class-detail":                  "Drill into a class to view enrolled students and their behaviour summaries.",
    "log-incident-blank":            "Log a new behaviour incident by selecting the student and rule broken.",
    "log-incident-class":            "Choose the class first to narrow down the student list.",
    "log-incident-class-selected":   "With the class selected, choose the student involved in the incident.",
    "log-incident-dropdowns":        "Select the incident type, rule broken, and severity level.",
    "log-incident-filled":           "Add a description of the incident before clicking Submit.",
    "log-incident-submitted":        "The incident has been submitted and is now pending admin approval.",
    "award-merit-blank":             "Select a student and merit type to start recognising positive behaviour.",
    "award-merit-filled":            "Review the award details and add a reason before confirming.",
    "award-merit-confirm":           "Confirm the merit award details before they are saved.",
    "award-merit-success":           "The merit has been awarded and the student will be notified.",
    "merits-list":                   "The merits list shows all recognition awards given by your classes.",
    "behaviour-list":                "Browse all incidents logged by your classes with status indicators.",
    "grade-dashboard":               "The Grade dashboard shows discipline and merit data for your entire grade.",
    "grade-dashboard-charts":        "Charts visualise behaviour trends across all classes in your grade.",
    "my-teachings":                  "My Teachings lists all subjects and classes you currently teach.",
    "my-children":                   "My Children shows a summary card for each child linked to your account.",
    "child-profile":                 "Click a child to view their full school behaviour and merit profile.",
    "child-profile-scroll":          "Scroll to see detailed incident history and merit awards for this child.",
    "behaviour":                     "View all behaviour incidents recorded for your children this term.",
    "behaviour-detail":              "The detail view shows the full record of a specific behaviour incident.",
    "attendance":                    "Attendance shows your child's daily attendance record for the current term.",
    "profile":                       "Your profile shows your personal details and linked children.",
    "profile-detail":                "Scroll to manage emergency contacts and update your contact preferences.",
    "messages-inbox":                "The inbox shows all messages received from the school.",
    "messages-sent":                 "Sent messages keeps a record of all communications you have sent.",
    "compose-blank":                 "Compose a new message by selecting a recipient and entering your subject.",
    "compose-filled":                "Review your message before sending it to the school.",
}

# ── Screenshot selection ───────────────────────────────────────────────────────
BASIC_NAMES = {
    "01-dashboard", "02-discipline-center", "03-students",
    "04-detention-sessions", "05-behaviour", "06-merits",
    "07-attendance", "08-interventions", "09-reports",
    "10-teachers", "11-classes", "12-settings", "00-login",
    "02-behaviour", "04-detentions", "05-merits",
    "02-incidents", "03-merits", "04-attendance", "05-detentions",
    "06-notifications", "07-messages", "08-profile",
}

def walkthrough_screenshots(folder: Path):
    """Return sorted walkthrough PNGs, excluding the basic set and base-name duplicates."""
    files  = sorted(folder.glob("*.png"))
    result = []
    seen_bases: set = set()
    for f in files:
        stem = f.stem
        if stem in BASIC_NAMES:
            continue
        base = re.sub(r"^\d+-", "", stem)   # strip leading "NN-"
        if base in seen_bases:              # skip duplicate base names
            continue
        seen_bases.add(base)
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
    if "login" in name:                           return "Getting Started"
    if "my-dashboard" in name:                    return "My Teaching Dashboard"
    if "grade-dashboard" in name:                 return "Grade Dashboard"
    if "dashboard" in name:                       return "Dashboard Overview"
    if "my-teach" in name:                        return "My Teachings"
    if "my-class" in name:                        return "My Class"
    if "student" in name:                         return "Student Management"
    if "class" in name:                           return "Class Management"
    if "teacher" in name:                         return "Teacher Management"
    if "log-incident" in name:                    return "Logging Incidents"
    if "behaviour" in name or "incident" in name: return "Behaviour Management"
    if "merit" in name or "award" in name:        return "Merits & Awards"
    if "detention" in name:                       return "Detention Management"
    if "discipline" in name:                      return "Discipline Centre"
    if "consequence" in name:                     return "Consequence Management"
    if "intervention" in name:                    return "Interventions & Support"
    if "report" in name or "analytic" in name:    return "Reports & Analytics"
    if "setting" in name:                         return "Settings"
    if "notif" in name:                           return "Notifications"
    if "message" in name:                         return "Messaging"
    if "profile" in name:                         return "Parent Profile"
    if "children" in name or "child" in name:     return "My Children"
    if "attendance" in name:                      return "Attendance"
    if "sidebar" in name:                         return "Portal Navigation"
    if "bulk" in name:                            return "Bulk Operations"
    return "Features Overview"


# ── Audio helpers ─────────────────────────────────────────────────────────────

def synthesize_narration(text: str, output_wav: Path):
    """Synthesise narration with Kokoro neural TTS (af_heart female voice)."""
    k = get_kokoro()
    samples, sr = k.create(text, voice='af_heart', speed=1.0, lang='en-us')
    # Resample from Kokoro native rate to 44100
    g = gcd(sr, SAMPLE_RATE)
    samples_44k = resample_poly(samples, SAMPLE_RATE // g, sr // g).astype(np.float32)
    i16 = (np.clip(samples_44k, -1.0, 1.0) * 32767).astype(np.int16)
    wavfile.write(str(output_wav), SAMPLE_RATE, i16)


def generate_ambient_track(duration_sec: float) -> np.ndarray:
    """
    Synthesise a soft ambient pad track via sine-wave chord stacking.
    Returns float64 array normalised to approx -18 dBFS (background level).
    Four-chord loop: Fmaj9 → Cmaj9 → Gmaj9 → Dmaj9, 12 s per chord.
    """
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
                seg += np.sin(2 * np.pi * f * 1.001 * seg_t) * 0.008  # warmth detune
            xf = min(int(1.5 * SAMPLE_RATE), len(seg) // 3)
            seg[:xf]  *= np.linspace(0, 1, xf)
            seg[-xf:] *= np.linspace(1, 0, xf)
            out[s0:s1] += seg

    # Subtle tremolo for movement
    out *= 0.88 + 0.12 * np.sin(2 * np.pi * 0.07 * t)

    # Normalise to -18 dBFS background level
    peak = np.max(np.abs(out)) + 1e-9
    out  = out / peak * 0.13

    # Fade in / out
    fn = min(int(3 * SAMPLE_RATE), n // 4)
    out[:fn]  *= np.linspace(0, 1, fn)
    out[-fn:] *= np.linspace(1, 0, fn)
    return out


def build_audio_track(slide_timings: list, total_sec: float) -> AudioSegment:
    """
    Compose the full stereo audio track:
      - Ambient background music for the entire video duration
      - espeak-ng voiceover placed 0.75 s after each slide starts
        (giving the 0.6 s crossfade time to settle)
    """
    # Background music
    bg_arr  = generate_ambient_track(total_sec + 4)
    bg_i16  = (bg_arr * 32767).astype(np.int16)
    bg_seg  = AudioSegment(
        bg_i16.tobytes(), frame_rate=SAMPLE_RATE, sample_width=2, channels=1
    ).set_channels(2)
    master = bg_seg[:int(total_sec * 1000)]

    # Voiceover clips
    with tempfile.TemporaryDirectory() as tmpdir:
        for start_sec, stem in slide_timings:
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
            voice = voice.apply_gain(-voice.max_dBFS - 3).set_channels(2)

            # Safety clip: never let narration overflow into the next slide
            max_voice_ms = int((SLIDE_DUR - 1.0) * 1000)
            if len(voice) > max_voice_ms:
                voice = voice[:max_voice_ms].fade_out(150)

            # 750 ms silence prefix so voice starts after crossfade completes
            pre   = AudioSegment.silent(750, frame_rate=SAMPLE_RATE).set_channels(2)
            voice = pre + voice

            pos_ms = int(start_sec * 1000)
            if pos_ms < len(master):
                master = master.overlay(voice, position=pos_ms)

    return master


# ── Core video builder ────────────────────────────────────────────────────────

def build_video(portal_key: str, screenshots: list, output_path: Path):
    cfg   = BRAND[portal_key]
    label = cfg["label"]
    print(f"\n🎬  Building {label} video ({len(screenshots)} slides)...")

    clips         = []
    current_sec   = None
    slide_timings = []  # (start_time_in_video_sec, stem)
    t             = 0.0

    def add_clip(arr, duration):
        nonlocal t
        clips.append(ImageClip(arr, duration=duration).with_effects([CrossFadeIn(FADE)]))
        t += duration - FADE

    # Opening title card
    add_clip(make_title_card(portal_key,
             f"Step-by-step feature walkthrough  •  {len(screenshots)} sections"), TITLE_DUR)

    for img_path in screenshots:
        stem    = img_path.stem
        section = infer_section(stem)
        caption = stem_to_caption(stem)

        if section != current_sec:
            add_clip(make_section_card(section, portal_key), SECTION_DUR)
            current_sec = section
            print(f"  ── {section}")

        slide_timings.append((t, stem))  # record BEFORE advancing t

        try:
            frame = add_caption(img_path, caption, portal_key)
        except Exception as e:
            print(f"  ⚠  Skipping {img_path.name}: {e}")
            slide_timings.pop()
            continue

        add_clip(frame, SLIDE_DUR)
        print(f"    ✓ {img_path.name}")

    add_clip(make_closing_card(), TITLE_DUR)
    total_duration = t + FADE  # last clip's FADE wasn't consumed by a successor

    # ── Audio track ────────────────────────────────────────────────────────────
    print(f"  🎵  Generating audio ({len(slide_timings)} narrations + ambient music)...")
    audio_track = build_audio_track(slide_timings, total_duration)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_wav = tmp.name
    audio_track.export(audio_wav, format="wav")

    # ── Silent video ──────────────────────────────────────────────────────────
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

    # ── Merge audio + video ────────────────────────────────────────────────────
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
    print("=" * 60)
    print("  Classly Portal Demo Video Generator  v2")
    print("=" * 60)

    for portal in PORTALS:
        key    = portal["key"]
        folder = portal["folder"]
        out    = portal["output"]

        screenshots = walkthrough_screenshots(folder)
        if not screenshots:
            print(f"\n⚠  No walkthrough screenshots found in {folder}")
            continue

        build_video(key, screenshots, out)

    print("\n" + "=" * 60)
    print("  All videos generated successfully!")
    print("=" * 60)
    for portal in PORTALS:
        out = portal["output"]
        if out.exists():
            mb = out.stat().st_size / 1_048_576
            print(f"  {out.relative_to(SCREENSHOTS.parent)}  ({mb:.1f} MB)")
