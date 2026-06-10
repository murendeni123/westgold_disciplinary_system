# Handoff: AI Timetable Extraction (`POST /api/teacher-timetable/upload`)

**Status:** Deferred. The endpoint exists but returns `501 Not Implemented`. Teachers
currently build their timetable manually via `POST /api/teacher-timetable/confirm`.

This document captures everything needed to finish the AI extraction feature later.

---

## Goal

Let a teacher upload a photo/scan/PDF of their printed timetable grid. The backend
sends the image to Claude, which returns structured lesson slots. The backend matches
each slot to a class, then returns the slots to the teacher for review. The teacher
edits/confirms, and the existing `POST /api/teacher-timetable/confirm` saves them.

**The save path already works.** Only the extraction step is outstanding.

---

## Why it was deferred

- No `ANTHROPIC_API_KEY` is configured in `backend/.env`.
- The `@anthropic-ai/sdk` package is not installed.

Both are required before this can run or be tested.

---

## Decisions already made

- **Model:** use the latest Claude Sonnet — **`claude-sonnet-4-6`** (env-configurable).
  Put it in a constant: `const TIMETABLE_MODEL = process.env.TIMETABLE_MODEL || 'claude-sonnet-4-6';`
  (The original spec said `claude-sonnet-4-20250514`; we chose the newer Sonnet for
  stronger document/vision extraction. Keep it overridable via env.)
- The extraction endpoint must **not save** anything — it returns slots for teacher
  confirmation. Saving happens only in `/confirm`.

---

## Implementation steps

### 1. Dependencies & env
```bash
cd backend
npm install @anthropic-ai/sdk
```
Add to `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
TIMETABLE_MODEL=claude-sonnet-4-6
```

### 2. File upload
`multer` is already installed. Use memory storage and accept images + PDF:
```js
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
```
Mount on the route: `router.post('/upload', authenticateToken, upload.single('file'), handler)`.

For images, `sharp` (already installed) can normalise/downscale and produce a base64
buffer. For PDFs, either send the PDF bytes via the Anthropic *document* content block,
or rasterise the first page to PNG first.

### 3. Claude call (vision/document → JSON)
Use the exact system prompt from the spec:
```
You are reading a school teacher timetable grid. Extract each lesson slot as
structured JSON. The grid has days as columns (Monday to Friday) and lesson numbers
as rows. Each cell contains a subject name and a room number. Blank cells are off
periods. Return ONLY a JSON array with no explanation. Each item: { day_of_week
(0=Mon,4=Fri), lesson_number, subject, room, is_off_period (true/false) }. If a cell
is blank, set is_off_period to true and subject and room to null.
```
Send the image as a base64 `image` content block (media type `image/png` etc.) or the
PDF as a `document` block. Parse the returned text as JSON. Be defensive: strip
markdown fences, `JSON.parse`, validate it's an array of the expected shape.

### 4. Class matching (per extracted slot)
For each non-off slot, try to resolve a `class_id` using the authenticated teacher's
classes + subject text:
- Candidate classes: `SELECT id, class_name FROM classes` (optionally those linked to
  the teacher via `classes.teacher_id = <teacherId>` or the teacher's
  `teacher_timetable_slots`).
- Fuzzy match the extracted `subject` / room against `class_name` (and the teacher's
  `teachers.subjects` text[] array). Use a simple normalised includes/Levenshtein.
- Set `class_id` when confident; otherwise leave it `null` for the teacher to pick.

Return shape (no DB writes):
```json
{
  "slots": [
    { "day_of_week": 0, "lesson_number": 1, "subject": "Mathematics",
      "room": "B12", "is_off_period": false, "class_id": 2, "matched": true },
    { "day_of_week": 0, "lesson_number": 2, "is_off_period": true,
      "subject": null, "room": null, "class_id": null, "matched": false }
  ]
}
```

### 5. Frontend flow
1. Teacher uploads file → `/upload` returns slots (with `matched` flags).
2. Teacher reviews in a grid, fixes any unmatched `class_id`s.
3. Teacher submits → `POST /api/teacher-timetable/confirm` (already implemented).

---

## Guardrails
- Keep the upload endpoint teacher-only (already enforced).
- Never auto-save extracted slots — always require `/confirm`.
- Fail gracefully if `ANTHROPIC_API_KEY` is missing: return a clear 503 with a message
  telling the user to configure the key (don't 500).
- Validate/clamp `day_of_week` to 0–4 and `lesson_number` to the configured
  `total_lessons` for that day (from `school_day_config`) before returning.

---

## Relevant existing code
- Route stub: `backend/routes/teacherTimetable.js` → `POST /upload` (returns 501).
- Save path: same file → `POST /confirm`.
- Tables: `teacher_timetable_slots` (created in `utils/schemaRepair.js` and
  `database/school_schema_template.sql`).
- Lesson-time helper: `backend/utils/lessonTimes.js`.
