/**
 * Lesson time computation helpers.
 *
 * Lesson start/end times are NOT stored per-lesson. They are derived at read
 * time from a day's `school_day_config` row (start time, lesson count, lesson
 * duration) plus that day's `school_breaks` rows (a break of N minutes after a
 * given lesson). This keeps the schedule a single source of truth.
 */

/** Convert a "HH:MM" or "HH:MM:SS" time string to minutes since midnight. */
function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
}

/** Convert minutes since midnight back to a zero-padded "HH:MM" string. */
function minutesToTimeString(mins) {
    const total = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Compute the start/end time for every lesson in a day.
 *
 * @param {object} dayConfig  Row from school_day_config:
 *                            { school_start_time, total_lessons, lesson_duration_minutes }
 * @param {Array}  breaks     Rows from school_breaks for the same day:
 *                            [{ after_lesson_number, duration_minutes }]
 * @returns {Array} Ordered list of
 *   { lesson_number, start_time, end_time, break_after_minutes }
 */
function computeLessonTimes(dayConfig, breaks = []) {
    if (!dayConfig) return [];

    const total = parseInt(dayConfig.total_lessons, 10) || 0;
    const duration = parseInt(dayConfig.lesson_duration_minutes, 10) || 0;
    let cursor = timeStringToMinutes(dayConfig.school_start_time);

    // Map of after_lesson_number -> total break minutes (sum if duplicates)
    const breakAfter = {};
    for (const b of breaks) {
        const after = parseInt(b.after_lesson_number, 10);
        const dur = parseInt(b.duration_minutes, 10) || 0;
        if (!Number.isNaN(after)) {
            breakAfter[after] = (breakAfter[after] || 0) + dur;
        }
    }

    const lessons = [];
    for (let n = 1; n <= total; n++) {
        const start = cursor;
        const end = cursor + duration;
        const breakMins = breakAfter[n] || 0;
        lessons.push({
            lesson_number: n,
            start_time: minutesToTimeString(start),
            end_time: minutesToTimeString(end),
            break_after_minutes: breakMins,
        });
        cursor = end + breakMins;
    }
    return lessons;
}

/**
 * Map a JavaScript Date to the project's day_of_week convention
 * (0 = Monday ... 4 = Friday). Returns null for weekends (Sat/Sun).
 */
function jsDateToDayOfWeek(date = new Date()) {
    const js = date.getDay(); // 0=Sunday .. 6=Saturday
    if (js === 0 || js === 6) return null; // weekend — no school day
    return js - 1; // Monday(1) -> 0 ... Friday(5) -> 4
}

/** Local date as YYYY-MM-DD (server timezone). */
function todayDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Current local time as minutes since midnight. */
function nowMinutes(date = new Date()) {
    return date.getHours() * 60 + date.getMinutes();
}

module.exports = {
    timeStringToMinutes,
    minutesToTimeString,
    computeLessonTimes,
    jsDateToDayOfWeek,
    todayDateString,
    nowMinutes,
};
