import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Clock, Save, Plus, Trash2, Copy } from 'lucide-react';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface BreakRow {
  after_lesson_number: number;
  duration_minutes: number;
}
interface DayConfig {
  enabled: boolean;
  school_start_time: string;
  total_lessons: number;
  lesson_duration_minutes: number;
  breaks: BreakRow[];
}

const defaultDay = (): DayConfig => ({
  enabled: true,
  school_start_time: '08:00',
  total_lessons: 8,
  lesson_duration_minutes: 40,
  breaks: [],
});

const SchoolDayConfig: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<Record<number, DayConfig>>(() => {
    const init: Record<number, DayConfig> = {};
    for (let d = 0; d < 5; d++) init[d] = defaultDay();
    return init;
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getSchoolDayConfig();
        const cfgDays = res.data?.days || [];
        if (cfgDays.length > 0) {
          const next: Record<number, DayConfig> = {};
          for (let d = 0; d < 5; d++) {
            const found = cfgDays.find((x: any) => x.day_of_week === d);
            next[d] = found
              ? {
                  enabled: true,
                  school_start_time: (found.school_start_time || '08:00').slice(0, 5),
                  total_lessons: found.total_lessons,
                  lesson_duration_minutes: found.lesson_duration_minutes,
                  breaks: (found.breaks || []).map((b: any) => ({
                    after_lesson_number: b.after_lesson_number,
                    duration_minutes: b.duration_minutes,
                  })),
                }
              : { ...defaultDay(), enabled: false };
          }
          setDays(next);
        }
      } catch (e) {
        // No config yet is fine — keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateDay = (d: number, patch: Partial<DayConfig>) =>
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  const addBreak = (d: number) =>
    setDays((prev) => ({
      ...prev,
      [d]: {
        ...prev[d],
        breaks: [...prev[d].breaks, { after_lesson_number: 1, duration_minutes: 15 }],
      },
    }));

  const updateBreak = (d: number, idx: number, patch: Partial<BreakRow>) =>
    setDays((prev) => ({
      ...prev,
      [d]: {
        ...prev[d],
        breaks: prev[d].breaks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
      },
    }));

  const removeBreak = (d: number, idx: number) =>
    setDays((prev) => ({
      ...prev,
      [d]: { ...prev[d], breaks: prev[d].breaks.filter((_, i) => i !== idx) },
    }));

  const copyMondayToAll = () =>
    setDays((prev) => {
      const m = prev[0];
      const next: Record<number, DayConfig> = { 0: m };
      for (let d = 1; d < 5; d++) {
        next[d] = { ...m, breaks: m.breaks.map((b) => ({ ...b })) };
      }
      return next;
    });

  const handleSave = async () => {
    const payloadDays = Object.keys(days)
      .map(Number)
      .filter((d) => days[d].enabled)
      .map((d) => ({
        day_of_week: d,
        school_start_time: days[d].school_start_time,
        total_lessons: days[d].total_lessons,
        lesson_duration_minutes: days[d].lesson_duration_minutes,
        breaks: days[d].breaks,
      }));

    if (payloadDays.length === 0) {
      error('Enable at least one day before saving');
      return;
    }

    setSaving(true);
    try {
      await api.setupSchoolDayConfig({ days: payloadDays });
      success(`School day saved for ${payloadDays.length} day(s)`);
    } catch (e: any) {
      error(e?.response?.data?.error || 'Failed to save configuration');
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
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          School Day Configuration
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Define start time, number of lessons, lesson length and breaks for each weekday. Lesson
          times are calculated automatically from these settings.
        </p>
      </motion.div>

      <div className="flex justify-end">
        <button
          onClick={copyMondayToAll}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          <Copy size={16} /> Copy Monday to all days
        </button>
      </div>

      <div className="space-y-5">
        {DAY_NAMES.map((name, d) => {
          const day = days[d];
          return (
            <motion.div
              key={d}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d * 0.04 }}
              className={`rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border p-6 ${
                day.enabled ? 'border-indigo-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="text-indigo-600" size={22} />
                  <h2 className="text-xl font-bold text-gray-900">{name}</h2>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(d, { enabled: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-600">School day</span>
                </label>
              </div>

              {day.enabled && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Start time
                      </label>
                      <input
                        type="time"
                        value={day.school_start_time}
                        onChange={(e) => updateDay(d, { school_start_time: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Number of lessons
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={day.total_lessons}
                        onChange={(e) =>
                          updateDay(d, { total_lessons: Number(e.target.value) || 1 })
                        }
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Lesson length (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={day.lesson_duration_minutes}
                        onChange={(e) =>
                          updateDay(d, { lesson_duration_minutes: Number(e.target.value) || 5 })
                        }
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Breaks</span>
                      <button
                        onClick={() => addBreak(d)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        <Plus size={16} /> Add break
                      </button>
                    </div>
                    {day.breaks.length === 0 ? (
                      <p className="text-sm text-gray-400">No breaks.</p>
                    ) : (
                      <div className="space-y-2">
                        {day.breaks.map((b, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <span className="text-sm text-gray-600">After lesson</span>
                            <input
                              type="number"
                              min={1}
                              max={day.total_lessons}
                              value={b.after_lesson_number}
                              onChange={(e) =>
                                updateBreak(d, idx, {
                                  after_lesson_number: Number(e.target.value) || 1,
                                })
                              }
                              className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-sm"
                            />
                            <span className="text-sm text-gray-600">for</span>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={b.duration_minutes}
                              onChange={(e) =>
                                updateBreak(d, idx, {
                                  duration_minutes: Number(e.target.value) || 1,
                                })
                              }
                              className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-sm"
                            />
                            <span className="text-sm text-gray-600">min</span>
                            <button
                              onClick={() => removeBreak(d, idx)}
                              className="ml-auto text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-end sticky bottom-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold px-8 py-3 shadow-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? 'Saving…' : 'Save configuration'}
        </motion.button>
      </div>
    </div>
  );
};

export default SchoolDayConfig;
