import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { CalendarDays, Save, Info } from 'lucide-react';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_LESSONS_PER_DAY = 8;

interface Cell {
  class_id: number | '';
  subject: string;
  room: string;
  teaching: boolean;
}

type Grid = Record<number, Record<number, Cell>>; // day -> lesson_number -> cell

const emptyCell = (): Cell => ({ class_id: '', subject: '', room: '', teaching: false });

const MyTimetable: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [lessonsPerDay, setLessonsPerDay] = useState<Record<number, number>>({});
  const [configured, setConfigured] = useState(false);
  const [grid, setGrid] = useState<Grid>(() => {
    const g: Grid = {};
    for (let d = 0; d < 5; d++) {
      g[d] = {};
      for (let l = 1; l <= DEFAULT_LESSONS_PER_DAY; l++) g[d][l] = emptyCell();
    }
    return g;
  });
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [classRes, cfgRes, weekRes] = await Promise.all([
          api.getClasses(),
          api.getSchoolDayConfig(),
          api.getMyWeekTimetable(),
        ]);
        setClasses(classRes.data || []);

        // Lessons per day from school config (fallback to a sensible default)
        const perDay: Record<number, number> = {};
        const cfgDays = cfgRes.data?.days || [];
        setConfigured(!!cfgRes.data?.configured);
        for (let d = 0; d < 5; d++) {
          const dayCfg = cfgDays.find((x: any) => x.day_of_week === d);
          perDay[d] = dayCfg?.total_lessons || DEFAULT_LESSONS_PER_DAY;
        }
        setLessonsPerDay(perDay);

        // Seed grid from existing confirmed slots
        const g: Grid = {};
        for (let d = 0; d < 5; d++) {
          g[d] = {};
          for (let l = 1; l <= perDay[d]; l++) g[d][l] = emptyCell();
        }
        const byDay = weekRes.data?.by_day || {};
        Object.keys(byDay).forEach((dStr) => {
          const d = Number(dStr);
          (byDay[d] || []).forEach((slot: any) => {
            if (!g[d]) g[d] = {};
            g[d][slot.lesson_number] = {
              class_id: slot.is_off_period ? '' : slot.class_id ?? '',
              subject: slot.subject || '',
              room: slot.room || '',
              teaching: !slot.is_off_period && !!slot.class_id,
            };
          });
        });
        setGrid(g);
      } catch (e) {
        error('Failed to load timetable data');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCell = (day: number, lesson: number, patch: Partial<Cell>) => {
    setGrid((g) => ({
      ...g,
      [day]: { ...(g[day] || {}), [lesson]: { ...(g[day]?.[lesson] || emptyCell()), ...patch } },
    }));
  };

  const filledCount = useMemo(() => {
    let n = 0;
    Object.values(grid).forEach((day) =>
      Object.values(day).forEach((c) => {
        if (c.teaching && c.class_id) n += 1;
      })
    );
    return n;
  }, [grid]);

  const handleSave = async () => {
    const slots: any[] = [];
    Object.keys(grid).forEach((dStr) => {
      const d = Number(dStr);
      Object.keys(grid[d]).forEach((lStr) => {
        const l = Number(lStr);
        const c = grid[d][l];
        if (c.teaching && c.class_id) {
          slots.push({
            day_of_week: d,
            lesson_number: l,
            class_id: Number(c.class_id),
            subject: c.subject || null,
            room: c.room || null,
            is_off_period: false,
          });
        }
      });
    });

    if (slots.length === 0) {
      error('Add at least one lesson before saving');
      return;
    }

    setSaving(true);
    try {
      await api.confirmTimetable(slots);
      success(`Timetable saved — ${slots.length} lesson(s)`);
    } catch (e: any) {
      error(e?.response?.data?.error || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  const dayLessons = lessonsPerDay[selectedDay] || DEFAULT_LESSONS_PER_DAY;

  return (
    <div className="space-y-8">
      <ToastContainer />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          My Timetable
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Set the lessons you teach each day. These power your daily lesson registers.
        </p>
      </motion.div>

      {!configured && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3 text-sm text-blue-800">
          <Info size={18} className="mt-0.5 shrink-0" />
          <span>
            The school day hasn't been configured by an admin yet, so a default of{' '}
            {DEFAULT_LESSONS_PER_DAY} lessons per day is shown. Lesson times will appear once the
            school day is set up.
          </span>
        </div>
      )}

      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {DAY_NAMES.map((name, d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedDay === d
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/80 text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="text-emerald-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">{DAY_NAMES[selectedDay]}</h2>
        </div>

        <div className="space-y-3">
          {Array.from({ length: dayLessons }, (_, i) => i + 1).map((lesson) => {
            const cell = grid[selectedDay]?.[lesson] || emptyCell();
            return (
              <div
                key={lesson}
                className={`p-4 rounded-xl border transition-all ${
                  cell.teaching
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                    {lesson}
                  </div>
                  <span className="font-semibold text-gray-800">Lesson {lesson}</span>
                  <label className="ml-auto inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cell.teaching}
                      onChange={(e) =>
                        updateCell(selectedDay, lesson, { teaching: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span className="text-sm font-medium text-gray-600">Teaching</span>
                  </label>
                </div>

                {cell.teaching && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={cell.class_id}
                      onChange={(e) =>
                        updateCell(selectedDay, lesson, {
                          class_id: e.target.value ? Number(e.target.value) : '',
                        })
                      }
                      className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    >
                      <option value="">Select class…</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={cell.subject}
                      onChange={(e) =>
                        updateCell(selectedDay, lesson, { subject: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Room"
                      value={cell.room}
                      onChange={(e) => updateCell(selectedDay, lesson, { room: e.target.value })}
                      className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
        <p className="text-sm text-gray-600">
          {filledCount} lesson{filledCount === 1 ? '' : 's'} across the week
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 shadow-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? 'Saving…' : 'Save timetable'}
        </motion.button>
      </div>
    </div>
  );
};

export default MyTimetable;
