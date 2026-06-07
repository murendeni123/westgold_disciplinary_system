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
SLIDE_DUR_MIN   = 6.0    # minimum slide hold (seconds)
SLIDE_DUR_DEF   = 8.0    # default if no narration found
SLIDE_CONT_DUR  = 5.0    # "continuation" scrolled shots — shorter hold
SECTION_DUR     = 2.2
TITLE_DUR       = 5.0
FADE            = 0.6
PRE_SILENCE_MS  = 900    # voice starts this many ms after slide appears
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
# Each narration is ~20–25 words so Kokoro produces ~6–7 seconds of speech,
# which fits comfortably within the SLIDE_DUR_MIN of 6 seconds + buffer.
NARRATIONS = {

    # ── Login ──
    "login":
        "Welcome to Classly, the school disciplinary management platform. "
        "Sign in with your email, password, and school code to access your portal.",

    "login-filled":
        "Enter your registered email address and password, then click Sign In. "
        "Each portal — admin, teacher, grade head, and parent — has its own tailored experience.",

    # ── Dashboard ──
    "dashboard":
        "The admin dashboard gives you a real-time overview of your school's discipline activity. "
        "You can see today's incident count, merit totals, active detentions, and pending reviews at a glance.",

    "dashboard-charts":
        "Scrolling down reveals detailed behaviour trend charts and a visual breakdown of incidents by category. "
        "These charts help you identify patterns and spot students who may need early intervention.",

    "dashboard-bottom":
        "At the bottom of the dashboard you can see recent activity summaries and quick-access statistics "
        "for attendance, merits, and consequence assignments across the school.",

    # ── Students ──
    "students-list":
        "The Students module lists every enrolled student, showing their class, grade level, demerit points, "
        "and merit points. You can sort, filter by grade or class, and export the list.",

    "students-search":
        "Use the search bar to instantly locate any student by name or student number. "
        "Results update in real time as you type, making it fast to find a specific learner.",

    "add-student-modal":
        "To add a new student, click the Add Student button. "
        "A form appears where you can enter the student's first name, last name, grade, class, and date of birth.",

    "add-student-form-filled":
        "Fill in all required details such as the student's name, class assignment, and date of birth, "
        "then click Save to create the student record and link them to the school.",

    "student-profile":
        "Each student has a dedicated profile page showing their personal details, current class, "
        "cumulative demerit and merit point totals, and a complete activity timeline.",

    "student-profile-detail":
        "Scrolling down the profile reveals the student's incident and merit history, "
        "any active interventions, consequence assignments, and parent contact information.",

    "student-incidents-tab":
        "The Incidents tab on a student profile shows every behaviour event logged against that student, "
        "including the date, type, severity, point deduction, and current approval status.",

    "student-merits-tab":
        "The Merits tab displays all recognition awards the student has received, "
        "showing the merit type, points awarded, reason, and the teacher who submitted the award.",

    # ── Classes ──
    "classes-list":
        "The Classes module shows every active class in the school with its name, grade level, "
        "assigned class teacher, student count, and a link to the full class detail view.",

    "class-detail":
        "Clicking a class opens its detail page, showing all enrolled students and their individual "
        "demerit and merit summaries, so you can see which learners need attention within that group.",

    "class-detail-scroll":
        "Scrolling down the class detail reveals additional statistics and quick links "
        "to log an incident or award a merit for students in this class.",

    # ── Teachers ──
    "teachers-list":
        "The Teachers module lists all teaching staff with their department, subjects, and class assignments. "
        "You can view individual profiles, assign grade head roles, and invite new staff members.",

    "add-teacher-modal":
        "To add a new teacher, click the Add Teacher button and fill in their name, email, "
        "department, and subject areas. An invitation is sent for them to set up their account.",

    # ── Parents ──
    "parents-list":
        "The Parents module shows all registered parents and guardians, "
        "the children linked to their accounts, and their contact details for communication.",

    # ── Behaviour ──
    "behaviour-all-incidents":
        "The Behaviour module displays all behaviour incidents logged across the school. "
        "Each row shows the student name, class, incident type, severity, point deduction, date, and current status.",

    "behaviour-pending-filter":
        "Click the Pending filter to focus only on incidents that still require your review and approval. "
        "Pending incidents are highlighted so you can quickly work through your review queue.",

    "incident-detail-modal":
        "Clicking an incident opens the full detail view, showing the complete description, "
        "the reporting teacher, location, date, and any supporting notes. You can approve or reject from here.",

    "incident-approved":
        "Once you approve an incident, demerit points are automatically deducted from the student's total, "
        "and a notification is sent to the relevant teacher and the student's parent if enabled.",

    "log-incident-blank":
        "To log a new behaviour incident, navigate to Log Incident. "
        "Select the class, then the specific student, the rule that was broken, and the severity level.",

    "log-incident-filled":
        "After selecting the class, student, incident type, and severity, "
        "add a detailed description of what happened, then click Submit to send the incident for admin review.",

    # ── Merits ──
    "merits-list":
        "The Merits module shows all recognition awards given across the school, "
        "with the student name, merit category, points awarded, reason, and the date of the award.",

    "merits-list-scroll":
        "Scrolling through the merits list reveals the full history of awards, "
        "helping you track which students and classes are being recognised for positive behaviour and achievement.",

    "award-merit-blank":
        "To award a merit, click Award Merit. "
        "Select the student from the dropdown, then choose the merit category that best describes the achievement.",

    "award-merit-filled":
        "Add a meaningful reason for the award, describing exactly what the student did to deserve recognition. "
        "This reason is visible on the student's profile and shared with parents.",

    "award-merit-confirm":
        "A confirmation dialog appears so you can review all the details before the merit is saved. "
        "Check the student name, category, points, and reason are all correct.",

    "award-merit-success":
        "The merit has been successfully awarded. Merit points are added to the student's total, "
        "their profile is updated, and a notification is sent to the student and their parent.",

    # ── Detentions ──
    "detention-sessions":
        "The Detention Sessions module shows all scheduled, active, and completed detention sessions. "
        "Each card shows the date, time, location, capacity, and the number of students currently assigned.",

    "detention-qualifying-students":
        "The Qualifying Students panel shows every student who has accumulated enough demerit points "
        "to be eligible for a detention session, based on the thresholds set in your school rules.",

    "detention-queue":
        "The detention queue shows students who have been formally placed in the next available session. "
        "You can manage this list, remove students, or move them to a different scheduled session.",

    "detention-create-modal":
        "To schedule a new detention session, click Create Session. "
        "Enter the date, start time, location, and the maximum number of students the venue can accommodate.",

    "detention-create-filled":
        "Fill in all session details — date, time, venue, and capacity — then click Save. "
        "The session is immediately available for assigning qualifying students.",

    "detention-session-detail":
        "Open a session to see the full detail: the list of assigned students, attendance status, "
        "teacher on duty, and a button to add more qualifying students to this session.",

    # ── Consequences ──
    "consequences-list":
        "The Consequences module tracks all formal sanctions assigned to students, "
        "including verbal warnings, detentions, suspensions, community service, and parent meetings.",

    "consequences-list-scroll":
        "Each consequence shows the student name, type of sanction, the reason it was issued, "
        "start and end dates, current status, and the administrator who assigned it.",

    "consequence-detail-modal":
        "Click a consequence to view its full details, update its status, add progress notes, "
        "or mark it as completed once the student has fulfilled the requirement.",

    "consequence-management":
        "The Consequence Management page lets you configure the types of consequences available in your school, "
        "set their descriptions, and manage which consequence categories are active.",

    # ── Interventions ──
    "interventions-list":
        "The Interventions module logs all supportive actions put in place for students "
        "who need additional help, including counselling, academic support, and behavioural monitoring plans.",

    "interventions-list-scroll":
        "Each intervention record shows the student name, type of intervention, assigned facilitator, "
        "start and end dates, progress goals, and current status — active, completed, or on hold.",

    "intervention-detail-modal":
        "Open an intervention to view its full plan, stated goals, progress notes, "
        "and update the outcome once the intervention period is complete.",

    # ── Discipline Centre ──
    "discipline-centre":
        "The Discipline Centre is the analytics hub of the admin portal. "
        "It provides a school-wide view of behaviour data, trends, and comparative class performance.",

    "discipline-centre-charts":
        "The charts section breaks down incidents by category, class, grade level, and time period. "
        "Use these visualisations to present behaviour data to school leadership and governing bodies.",

    "discipline-centre-leaderboard":
        "The leaderboard ranks classes and individual students by behaviour and merit performance, "
        "helping you celebrate positive improvement and identify groups that need targeted support.",

    "discipline-rules":
        "The Discipline Rules page lets you define the school's full code of conduct, "
        "listing each rule, its category, the default demerit points, and the severity classification.",

    "discipline-rules-scroll":
        "Scroll through the rules to review all active codes of conduct. "
        "You can edit existing rules, adjust point values, or add entirely new rule categories.",

    # ── Reports ──
    "reports-overview":
        "The Reports module generates detailed analytics on behaviour trends, merit distribution, "
        "detention frequency, and intervention outcomes across any selected date range.",

    "reports-charts":
        "Visual charts make it easy to present insights to parents, school leadership, and governing boards. "
        "You can export reports as PDF or share them directly from the portal.",

    "reports-bottom":
        "The lower section of reports provides detailed data tables with filterable columns, "
        "allowing you to drill down by class, grade, date range, or incident type.",

    "reports-tab2":
        "Additional report tabs offer more specialised views, including term-over-term comparisons "
        "and individual student progress reports that can be shared with parents.",

    # ── Notifications ──
    "notifications":
        "The Notifications centre shows all system alerts, including new incident submissions, "
        "merit awards, detention updates, and messages from teachers and parents.",

    "notifications-scroll":
        "Older notifications are kept in your history so you can always review past alerts. "
        "You can mark individual notifications as read or dismiss them in bulk.",

    # ── Bulk Import ──
    "bulk-import":
        "The Bulk Import tool lets you upload large numbers of student or staff records at once "
        "using a spreadsheet template, saving significant time at the start of each academic year.",

    "bulk-import-scroll":
        "Download the provided template, fill in the required columns for each student or staff member, "
        "then upload the completed file to import all records in a single step.",

    "smart-import":
        "The Smart Import feature uses intelligent data mapping to handle variations in your spreadsheet format, "
        "automatically matching columns and flagging any rows that need manual correction before importing.",

    # ── Settings — all 5 tabs ──
    "settings-profile-tab":
        "The Settings page opens on the Profile tab, where you can update your display name "
        "and email address. Changes are saved immediately and reflected across the platform.",

    "settings-password-tab":
        "The Password tab lets you change your account password. "
        "Enter your current password for verification, then set and confirm your new password.",

    "settings-school-info-tab":
        "The School Info tab displays your school's name and unique school code. "
        "Share this code with parents so they can link their accounts to your school when registering.",

    "settings-school-info-scroll":
        "Scrolling the School Info tab shows additional school details such as the subscription tier "
        "and maximum student and teacher capacity configured for your school.",

    "settings-preferences-tab":
        "The Preferences tab lets you configure your notification settings, "
        "choosing which system events trigger alerts and how you receive them.",

    "settings-preferences-scroll":
        "Scroll through the preferences to review all available notification options, "
        "including incident approvals, merit awards, detention reminders, and parent messages.",

    "settings-language-tab":
        "The Language tab gives admins two important controls: the Global Language setting "
        "changes the platform language for all users at your school, while My Language sets only your own preference.",

    "settings-language-scroll":
        "Classly supports English, Afrikaans, Zulu, and Xhosa. "
        "Select the appropriate language for your school community and click Save to apply the change.",

    # ── User Management ──
    "user-management":
        "The User Management page shows all registered users at your school, "
        "including their email, role, and account status. You can deactivate accounts or reset passwords here.",

    # ── Teacher portal ──
    "my-classes":
        "The My Classes page shows all the classes you are currently assigned to teach. "
        "Click any class card to view its students and manage their behaviour records.",

    "class-detail":
        "The class detail page shows a full roster of enrolled students with their current "
        "demerit and merit point totals, giving you an at-a-glance view of class behaviour.",

    "class-detail-scroll":
        "Scroll down to see class statistics and quick action buttons "
        "that let you log an incident or award a merit for any student in this class.",

    "log-incident-blank":
        "To log a behaviour incident, select the class, then choose the specific student involved. "
        "Next, select the rule that was broken from the discipline code list.",

    "log-incident-filled":
        "After filling in the class, student, incident type, and severity level, "
        "add a detailed written description of what occurred before submitting for admin review.",

    "log-incident-submitted":
        "The incident has been submitted successfully. "
        "It now sits in the admin review queue and you will be notified once it has been approved or rejected.",

    "behaviour-list":
        "The Behaviour page shows all incidents you have logged across your classes. "
        "You can see the status of each report — pending, approved, or rejected.",

    "award-merit-blank":
        "To award a merit, select a student from your classes and choose the appropriate merit category. "
        "Merit categories are configured by your school admin.",

    "award-merit-filled":
        "Add a clear reason for the award that describes what the student did to deserve recognition. "
        "This message is visible to the student and their parents.",

    "award-merit-confirm":
        "Review the merit details on the confirmation screen before finalising. "
        "Check the student, category, points, and reason are all correct.",

    "award-merit-success":
        "The merit has been successfully awarded. The student's merit total is updated immediately "
        "and a notification is sent to both the student and their parent.",

    "merits-list":
        "The Merits list shows all awards you have given across your classes, "
        "with dates, point values, and the reasons recorded for each award.",

    "detentions":
        "The Detentions page shows all upcoming and past detention sessions relevant to your classes. "
        "You can see which of your students have been assigned to attend.",

    "detentions-scroll":
        "Scroll down to see a full list of your students' detention history, "
        "including whether they attended, arrived late, or were absent from a scheduled session.",

    "interventions":
        "The Interventions page shows all active support plans in place for students in your classes. "
        "Each plan shows the goals, timeline, facilitator, and current progress status.",

    "interventions-scroll":
        "Scroll to review the details of each intervention, including the specific goals set for the student "
        "and any notes recorded by the facilitator during the intervention period.",

    "consequences":
        "The Consequences page shows all formal sanctions assigned to students in your classes, "
        "helping you stay informed of the outcomes following incident approvals.",

    "reports":
        "The Reports page gives you a breakdown of behaviour and merit data "
        "specifically for your classes over the current term.",

    "reports-scroll":
        "Scroll to access detailed charts showing incident frequency, merit distribution, "
        "and trend data for each of your classes.",

    "settings-profile":
        "The Settings page lets you update your personal profile information, "
        "including your display name and contact email address.",

    "settings-password":
        "Use the Password tab to update your account password. "
        "Always use a strong, unique password to keep your account secure.",

    "settings-preferences":
        "The Preferences tab lets you control which types of notifications you receive "
        "and how they are delivered — either in-app, by email, or both.",

    "settings-language":
        "The Language tab lets you set your preferred language for the portal interface. "
        "Classly supports English, Afrikaans, Zulu, and Xhosa.",

    # ── Grade Head portal ──
    "dashboard":
        "The grade head dashboard shows behaviour and merit data for your entire grade. "
        "Summary cards display the total incidents, merit awards, and active interventions for all grade classes.",

    "dashboard-charts":
        "Scroll down to see charts comparing behaviour trends across all classes in your grade, "
        "helping you identify which classes need the most attention.",

    "students-list":
        "The Students page lists all learners across your entire grade, "
        "with their class, demerit points, merit points, and a link to their individual profile.",

    "students-search":
        "Search for any student within your grade by name or student number. "
        "The list filters instantly to show matching results.",

    "student-profile":
        "The student profile shows personal details, current class, point totals, "
        "and the complete incident and merit history for this learner.",

    "student-incidents-tab":
        "The Incidents tab shows every behaviour event logged against this student, "
        "with the full details of each incident including the reporting teacher and outcome.",

    "classes":
        "The Classes page shows all classes within your grade, "
        "their class teacher, enrolment numbers, and a direct link to each class detail page.",

    "behaviour-all":
        "The Behaviour page shows all incidents logged across your grade, "
        "giving you a complete view of discipline activity for the classes you are responsible for.",

    "behaviour-pending":
        "The Pending view shows only incidents awaiting review within your grade. "
        "As grade head, you can review and approve these incidents directly.",

    "log-incident-blank":
        "Log a behaviour incident for any student in your grade by selecting their class "
        "and choosing the relevant rule from the discipline code.",

    "log-incident-filled":
        "After selecting the class, student, and incident type, add a description "
        "of the behaviour observed before submitting the incident for review.",

    "merits-list":
        "The Merits list shows all recognition awards given to students across your grade, "
        "allowing you to monitor positive reinforcement at the grade level.",

    "award-merit-blank":
        "Award a merit to any student in your grade by selecting them from the dropdown "
        "and choosing the appropriate merit category.",

    "award-merit-filled":
        "Add a reason for the award before confirming. "
        "This description appears on the student's profile and is shared with their parents.",

    "detention-sessions":
        "The Detention Sessions page shows scheduled sessions relevant to your grade. "
        "You can view which of your students have been assigned to each session.",

    "detention-sessions-scroll":
        "Scroll to see older or completed sessions and review past attendance records "
        "for students in your grade.",

    "my-teachings":
        "My Teachings shows the subjects and classes you personally teach, "
        "separate from your grade head responsibilities. Manage your own class behaviour here.",

    "discipline-centre":
        "The Discipline Centre shows analytics specific to your grade, "
        "breaking down incidents, trends, and class comparisons within your area of responsibility.",

    "discipline-charts":
        "Charts show incident frequency, severity distribution, and month-on-month trends "
        "for all classes in your grade.",

    "consequence-management":
        "The Consequence Management page lets you review and update formal sanctions "
        "assigned to students within your grade.",

    # ── Parent portal ──
    "my-children":
        "My Children shows a summary card for each child linked to your parent account. "
        "Each card displays the child's current class, merit points, and any recent activity.",

    "child-profile":
        "Click a child's card to open their full school profile, showing their class, "
        "current demerit and merit totals, and a summary of recent incidents and awards.",

    "child-profile-scroll":
        "Scrolling the child profile reveals their complete incident history, merit awards, "
        "upcoming detentions, and any active intervention plans.",

    "behaviour":
        "The Behaviour page shows all incidents recorded for your children at school. "
        "Each entry shows the date, what happened, the severity, and the current status.",

    "behaviour-detail":
        "Click an incident to read the full details, including the teacher's description, "
        "the rule that was broken, and any outcome or consequence that followed.",

    "merits":
        "The Merits page shows all positive recognition awards your children have received. "
        "Celebrate their achievements and track their progress throughout the term.",

    "attendance":
        "The Attendance page shows your child's daily attendance record for the current term, "
        "including present, absent, and late entries with dates and any notes from the school.",

    "attendance-scroll":
        "Scroll to see a full term view of attendance data, "
        "helping you identify any patterns of absence or lateness that may need to be addressed.",

    "detentions":
        "The Detentions page shows whether your child has been assigned to any scheduled detention sessions. "
        "Details include the date, time, venue, and the reason for the assignment.",

    "interventions":
        "The Interventions page shows any support plans currently in place for your child. "
        "These are set up by the school to help students who need additional academic or behavioural assistance.",

    "consequences":
        "The Consequences page shows any formal sanctions your child has received, "
        "such as verbal warnings, community service, or suspension notifications.",

    "consequence-detail":
        "Open a consequence to read the full details, including the reason it was issued, "
        "the timeline, and any actions required from you as a parent.",

    "messages-inbox":
        "The Messages inbox shows all communications sent to you by the school. "
        "These may include incident notifications, progress updates, and meeting requests.",

    "messages-sent":
        "The Sent tab shows a history of all messages you have sent to the school, "
        "so you can keep track of your communications and follow up if needed.",

    "compose-blank":
        "To send a message to the school, click Compose. "
        "Enter a subject and your message, then select the appropriate recipient.",

    "compose-filled":
        "Review your message carefully before sending. "
        "Once sent, a copy is saved in your Sent folder and the school will be notified.",

    "profile":
        "Your profile page shows your personal contact details and the children linked to your account. "
        "Keep your information up to date so the school can always reach you.",

    "profile-scroll":
        "Scroll down to manage emergency contacts and update your contact preferences. "
        "Accurate emergency contact information is important for the school's records.",

    "settings":
        "The Settings page lets you update your account details, change your password, "
        "and configure your notification preferences.",

    "settings-scroll":
        "Scroll through the settings to find options for managing linked children, "
        "language preferences, and communication preferences for your parent account.",
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
    """Return all PNGs in folder, sorted by name, excluding the video file."""
    files = sorted(folder.glob("*.png"))
    return [f for f in files if not f.name.startswith("._")]


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
