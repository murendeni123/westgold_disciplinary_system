"""
Classly Portal Demo Video Generator
Creates high-quality MP4 walkthrough videos for each portal from screenshots.

Video specs:
  Resolution : 1440 × 900 (native screenshot size)
  Frame rate : 30 fps
  Codec      : H.264, CRF 18 (visually lossless)
  Audio      : none (silent – schools add their own narration)
  Transitions: 0.6 s smooth crossfade between slides
  Slide hold : 4 s per screenshot, 2 s per section header
"""

import os
import re
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from moviepy import ImageClip, concatenate_videoclips
from moviepy.video.fx import CrossFadeIn, CrossFadeOut

# ── Constants ─────────────────────────────────────────────────────────────────
W, H       = 1440, 900
FPS        = 30
CRF        = 18          # H.264 quality (lower = better)
SLIDE_DUR  = 4.0         # seconds per screenshot
SECTION_DUR= 2.2         # seconds per section-break card
TITLE_DUR  = 4.5         # opening / closing title card
FADE       = 0.6         # crossfade duration

FONT_BOLD   = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG    = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

SCREENSHOTS = Path("/home/user/westgold_disciplinary_system/screenshots")
OUT_BASE    = SCREENSHOTS          # save videos alongside the screenshot folders

# ── Brand colours ──────────────────────────────────────────────────────────────
BRAND = {
    "admin":      {"primary": (37,  99, 235), "accent": (219, 234, 254), "label": "Admin Portal"},
    "teacher":    {"primary": (5,  150, 105), "accent": (209, 250, 229), "label": "Teacher Portal"},
    "grade-head": {"primary": (124, 58, 237), "accent": (237, 233, 254), "label": "Grade Head Portal"},
    "parent":     {"primary": (220, 38,  38), "accent": (254, 226, 226), "label": "Parent Portal"},
}

# ── Screenshot selection ───────────────────────────────────────────────────────
# Only the detailed walkthrough screenshots (not the original basic 8-page set).
# Pattern: files whose base name (after the leading digits) contains at least
# two words/segments → these are the walkthrough ones.

BASIC_NAMES = {
    # admin basic set
    "01-dashboard", "02-discipline-center", "03-students",
    "04-detention-sessions", "05-behaviour", "06-merits",
    "07-attendance", "08-interventions", "09-reports",
    "10-teachers", "11-classes", "12-settings", "00-login",
    # grade-head basic set
    "02-behaviour", "03-students", "04-detentions", "05-merits",
    # parent basic set
    "02-incidents", "03-merits", "04-attendance", "05-detentions",
    "06-notifications", "07-messages", "08-profile",
}

def walkthrough_screenshots(folder: Path):
    """Return sorted walkthrough PNGs, excluding the original basic set."""
    files = sorted(folder.glob("*.png"))
    result = []
    for f in files:
        stem = f.stem               # e.g. "03-dashboard-overview"
        # Skip the exact basic-set names
        if stem in BASIC_NAMES:
            continue
        # Skip any file named just like "01-dashboard" (basic pattern)
        # Walkthrough names always have 3+ hyphen-segments
        if stem.count("-") < 2 and stem not in ("00-login-page", "01-login-page"):
            # Allow multi-word stems like "login-page" (2 segments but valid)
            pass
        result.append(f)
    return result

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def gradient_bg(color1, color2, w=W, h=H):
    """Vertical gradient from color1 (top) to color2 (bottom)."""
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        t = y / (h - 1)
        r = int(color1[0] * (1 - t) + color2[0] * t)
        g = int(color1[1] * (1 - t) + color2[1] * t)
        b = int(color1[2] * (1 - t) + color2[2] * t)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr)


def darken(color, factor=0.6):
    return tuple(int(c * factor) for c in color)


def lighten(color, factor=1.4):
    return tuple(min(255, int(c * factor)) for c in color)


def make_title_card(portal_key, subtitle=""):
    """Opening title card for a portal."""
    cfg   = BRAND[portal_key]
    pri   = cfg["primary"]
    label = cfg["label"]

    img = gradient_bg(darken(pri, 0.45), darken(pri, 0.75))
    draw = ImageDraw.Draw(img)

    # Diagonal decorative band
    from PIL import Image as PILImage
    overlay = PILImage.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.polygon([(0, H//2), (W, H//4), (W, H//2+80), (0, H//2+220)],
               fill=(*lighten(pri, 1.3), 22))
    img = PILImage.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # "Classly" wordmark
    wm_font = load_font(FONT_BOLD, 34)
    draw.text((60, 52), "Classly", font=wm_font, fill=(255, 255, 255, 200))
    draw.text((60, 92), "School Disciplinary Management Platform",
              font=load_font(FONT_REG, 20), fill=(200, 220, 255))

    # Portal title
    title_font = load_font(FONT_BOLD, 78)
    draw.text((80, H // 2 - 80), label, font=title_font, fill=(255, 255, 255))

    # Subtitle
    if subtitle:
        draw.text((82, H // 2 + 22), subtitle,
                  font=load_font(FONT_REG, 28), fill=(210, 230, 255))

    # Bottom accent bar
    draw.rectangle([(0, H - 8), (W, H)], fill=lighten(pri, 1.5))

    return np.array(img)


def make_closing_card():
    """Shared closing card."""
    img = gradient_bg((15, 23, 42), (30, 41, 59))
    draw = ImageDraw.Draw(img)
    cx = W // 2

    title_font  = load_font(FONT_BOLD, 56)
    body_font   = load_font(FONT_REG,  28)
    small_font  = load_font(FONT_REG,  22)

    tw = draw.textlength("Classly", font=title_font)
    draw.text(((W - tw) // 2, H // 2 - 100), "Classly",
              font=title_font, fill=(255, 255, 255))

    sub = "School Disciplinary Management Platform"
    sw = draw.textlength(sub, font=body_font)
    draw.text(((W - sw) // 2, H // 2 - 28), sub,
              font=body_font, fill=(148, 163, 184))

    tagline = "Empowering schools with transparent, consistent discipline"
    tgw = draw.textlength(tagline, font=small_font)
    draw.text(((W - tgw) // 2, H // 2 + 50), tagline,
              font=small_font, fill=(100, 116, 139))

    return np.array(img)


def make_section_card(section_title, portal_key):
    """A 2-second divider card that announces a new section."""
    cfg = BRAND[portal_key]
    pri = cfg["primary"]

    img  = gradient_bg(darken(pri, 0.35), darken(pri, 0.60))
    draw = ImageDraw.Draw(img)

    # Horizontal accent line
    draw.rectangle([(60, H // 2 - 55), (W - 60, H // 2 - 50)],
                   fill=(*lighten(pri, 1.6), 255))

    # Section title
    font = load_font(FONT_BOLD, 56)
    tw = draw.textlength(section_title, font=font)
    draw.text(((W - tw) // 2, H // 2 - 40), section_title,
              font=font, fill=(255, 255, 255))

    # Bottom accent
    draw.rectangle([(0, H - 6), (W, H)], fill=lighten(pri, 1.5))

    return np.array(img)


def caption_bar_height():
    return 90


def add_caption(screenshot_path, caption_text, portal_key):
    """
    Overlay a branded caption bar at the bottom of a screenshot.
    Returns a numpy array (H, W, 3).
    """
    cfg = BRAND[portal_key]
    pri = cfg["primary"]

    img = Image.open(screenshot_path).convert("RGB")
    # Resize to standard dimensions if needed
    if img.size != (W, H):
        img = img.resize((W, H), Image.LANCZOS)

    bar_h = caption_bar_height()

    # Build the caption overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # Semi-transparent dark bar
    od.rectangle([(0, H - bar_h), (W, H)], fill=(10, 15, 30, 215))

    # Accent stripe on left
    od.rectangle([(0, H - bar_h), (6, H)], fill=(*pri, 255))

    # Caption text (wrap to fit)
    cap_font = load_font(FONT_REG, 21)
    bold_font = load_font(FONT_BOLD, 21)

    # Wrap text
    max_chars = 115
    lines = textwrap.wrap(caption_text, width=max_chars)
    y_start = H - bar_h + 14
    for i, line in enumerate(lines[:3]):
        od.text((24, y_start + i * 26), line,
                font=cap_font, fill=(230, 240, 255, 245))

    # Step indicator / slide number (top-right corner)
    step_font = load_font(FONT_BOLD, 16)
    portal_label = cfg["label"]
    od.text((W - 200, H - bar_h + 18), portal_label,
            font=step_font, fill=(*lighten(pri, 1.6), 200))

    # Compose
    result = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return np.array(result)


def stem_to_caption(stem):
    """
    Convert a filename stem like '07-students-list' to a readable caption,
    e.g. 'Students List'.
    """
    # Remove leading number
    name = re.sub(r"^\d+-", "", stem)
    return name.replace("-", " ").title()


def infer_section(stem):
    """Guess a section name from the file stem."""
    name = re.sub(r"^\d+-", "", stem).lower()
    if "login" in name:         return "Getting Started"
    if "dashboard" in name:     return "Dashboard Overview"
    if "my-dashboard" in name:  return "My Teaching Dashboard"
    if "my-teach" in name:      return "My Teachings"
    if "my-class" in name:      return "My Class"
    if "student" in name:       return "Student Management"
    if "class" in name:         return "Class Management"
    if "teacher" in name:       return "Teacher Management"
    if "behaviour" in name or "incident" in name:  return "Behaviour Management"
    if "log-incident" in name:  return "Logging Incidents"
    if "merit" in name or "award" in name:         return "Merits & Awards"
    if "detention" in name:     return "Detention Management"
    if "discipline" in name:    return "Discipline Centre"
    if "consequence" in name:   return "Consequence Management"
    if "intervention" in name:  return "Interventions & Support"
    if "report" in name or "analytic" in name:     return "Reports & Analytics"
    if "setting" in name:       return "Settings"
    if "notif" in name:         return "Notifications"
    if "message" in name:       return "Messaging"
    if "profile" in name:       return "Parent Profile"
    if "children" in name or "child" in name:      return "My Children"
    if "attendance" in name:    return "Attendance"
    if "sidebar" in name:       return "Portal Navigation"
    if "bulk" in name:          return "Bulk Operations"
    return "Features Overview"


# ── Core video builder ─────────────────────────────────────────────────────────

def build_video(portal_key, screenshots, output_path):
    cfg        = BRAND[portal_key]
    label      = cfg["label"]
    print(f"\n🎬  Building {label} video ({len(screenshots)} slides)...")

    clips      = []
    current_sec = None

    def add_clip(arr, duration):
        clip = ImageClip(arr, duration=duration).with_effects([CrossFadeIn(FADE)])
        clips.append(clip)

    # ── Opening title card ────────────────────────────────────────────────
    opening = make_title_card(portal_key,
                              f"Step-by-step feature walkthrough  •  {len(screenshots)} sections")
    add_clip(opening, TITLE_DUR)

    # ── Screenshot slides ─────────────────────────────────────────────────
    for idx, img_path in enumerate(screenshots):
        stem = img_path.stem
        section = infer_section(stem)
        caption = stem_to_caption(stem)

        # Insert a section break when section changes
        if section != current_sec:
            sec_arr = make_section_card(section, portal_key)
            add_clip(sec_arr, SECTION_DUR)
            current_sec = section
            print(f"  ── {section}")

        # Load screenshot with caption overlay
        try:
            frame = add_caption(img_path, caption, portal_key)
        except Exception as e:
            print(f"  ⚠  Skipping {img_path.name}: {e}")
            continue

        add_clip(frame, SLIDE_DUR)
        print(f"    ✓ {img_path.name}")

    # ── Closing card ──────────────────────────────────────────────────────
    closing = make_closing_card()
    add_clip(closing, TITLE_DUR)

    # ── Concatenate with crossfades ───────────────────────────────────────
    print(f"  Encoding {len(clips)} clips → {output_path.name} ...")
    video = concatenate_videoclips(clips, method="compose", padding=-FADE)
    video.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        ffmpeg_params=["-crf", str(CRF), "-preset", "slow",
                       "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        logger=None,
        audio=False,
    )
    size_mb = output_path.stat().st_size / 1_048_576
    total_s = int(video.duration)
    print(f"  ✅  {output_path.name}  {total_s//60}:{total_s%60:02d} min  {size_mb:.1f} MB")
    video.close()


# ── Portal definitions ─────────────────────────────────────────────────────────

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
    print("  Classly Portal Demo Video Generator")
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
