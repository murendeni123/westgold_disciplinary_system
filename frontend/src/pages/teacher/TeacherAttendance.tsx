import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import {
  Sun,
  BookOpen,
  Users,
  CheckCircle,
  Lock,
  ChevronRight,
  CalendarClock,
  Send,
} from 'lucide-react';

type Status = 'present' | 'absent' | 'late' | 'excused' | 'early_departure';

interface Entry {
  id: number;
  student_id: number;
  student_number: string;
  student_name: string;
  status: Status;
  note?: string | null;
}

interface RegisterData {
  id: number;
  class_name?: string;
  subject?: string | null;
  lesson_number?: number;
  submitted_at?: string | null;
  locked?: boolean;
  entries: Entry[];
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
  { value: 'early_departure', label: 'Early departure' },
];

const STATUS_COLORS: Record<Status, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  absent: 'bg-red-100 text-red-700 border-red-300',
  late: 'bg-amber-100 text-amber-700 border-amber-300',
  excused: 'bg-blue-100 text-blue-700 border-blue-300',
  early_departure: 'bg-purple-100 text-purple-700 border-purple-300',
};

/** Inline marking panel for a single register (morning or lesson). */
const RegisterMarker: React.FC<{
  register: RegisterData;
  kind: 'morning' | 'lesson';
  onSubmitted: () => void;
}> = ({ register, kind, onSubmitted }) => {
  const { success, error } = useToast();
  const [entries, setEntries] = useState<Entry[]>(register.entries || []);
  const [submitting, setSubmitting] = useState(false);

  const submitted = !!register.submitted_at;
  const locked = !!register.locked;
  const readOnly = submitted || locked;

  const updateEntry = (entryId: number, data: { status?: string; note?: string }) =>
    kind === 'morning'
      ? api.updateMorningEntry(entryId, data)
      : api.updateLessonEntry(entryId, data);

  const setStatus = async (entry: Entry, status: Status) => {
    if (readOnly || entry.status === status) return;
    const prev = entry.status;
    setEntries((es) => es.map((e) => (e.id === entry.id ? { ...e, status } : e)));
    try {
      await updateEntry(entry.id, { status });
    } catch {
      setEntries((es) => es.map((e) => (e.id === entry.id ? { ...e, status: prev } : e)));
      error('Could not update — register may be locked');
    }
  };

  const markAllPresent = async () => {
    if (readOnly) return;
    const toReset = entries.filter((e) => e.status !== 'present');
    setEntries((es) => es.map((e) => ({ ...e, status: 'present' as Status })));
    try {
      await Promise.all(toReset.map((e) => updateEntry(e.id, { status: 'present' })));
    } catch {
      error('Could not mark all present');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res =
        kind === 'morning'
          ? await api.submitMorningRegister(register.id)
          : await api.submitLessonRegister(register.id);
      const notified = res.data?.notified ?? 0;
      success(`Register submitted${notified ? ` — ${notified} parent(s) notified` : ''}`);
      onSubmitted();
    } catch (e: any) {
      error(e?.response?.data?.error || 'Failed to submit register');
    } finally {
      setSubmitting(false);
    }
  };

  const absentLate = entries.filter((e) => e.status === 'absent' || e.status === 'late').length;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">
          {entries.length} student{entries.length === 1 ? '' : 's'}
          {absentLate > 0 && (
            <span className="ml-2 text-amber-600 font-medium">
              · {absentLate} absent/late
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={markAllPresent}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <CheckCircle size={16} /> Mark all present
          </button>
        )}
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-200 to-teal-200 flex items-center justify-center shrink-0">
                <Users className="text-emerald-700" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{entry.student_name}</p>
                <p className="text-xs text-gray-500">{entry.student_number}</p>
              </div>
            </div>
            {readOnly ? (
              <span
                className={`self-start sm:self-auto px-3 py-1 rounded-lg text-sm font-medium border ${STATUS_COLORS[entry.status]}`}
              >
                {STATUS_OPTIONS.find((s) => s.value === entry.status)?.label}
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(entry, opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      entry.status === opt.value
                        ? STATUS_COLORS[opt.value]
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {readOnly ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500">
          {submitted ? (
            <>
              <CheckCircle size={18} className="text-emerald-600" /> Submitted
            </>
          ) : (
            <>
              <Lock size={18} /> Locked
            </>
          )}
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 shadow-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <Send size={18} /> {submitting ? 'Submitting…' : 'Submit register'}
        </motion.button>
      )}
    </div>
  );
};

const TeacherAttendance: React.FC = () => {
  const { ToastContainer, error } = useToast();
  const [loading, setLoading] = useState(true);

  // Morning register
  const [morning, setMorning] = useState<any>(null);
  const [morningRegister, setMorningRegister] = useState<RegisterData | null>(null);
  const [openingMorning, setOpeningMorning] = useState(false);

  // Lesson registers
  const [lessonState, setLessonState] = useState<{ is_school_day: boolean; lessons: any[] }>({
    is_school_day: true,
    lessons: [],
  });
  const [openLesson, setOpenLesson] = useState<{ slotId: number; register: RegisterData } | null>(
    null
  );
  const [openingLessonId, setOpeningLessonId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      const [mRes, lRes] = await Promise.all([
        api.getMorningRegisterToday(),
        api.getLessonRegistersToday(),
      ]);
      setMorning(mRes.data);
      setMorningRegister(mRes.data?.opened ? mRes.data.register : null);
      setLessonState({
        is_school_day: lRes.data?.is_school_day ?? true,
        lessons: lRes.data?.lessons ?? [],
      });
    } catch (e) {
      error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenMorning = async () => {
    setOpeningMorning(true);
    try {
      const res = await api.openMorningRegister();
      setMorningRegister(res.data.register);
      setMorning((m: any) => ({ ...m, opened: true }));
    } catch (e: any) {
      error(e?.response?.data?.error || 'Could not open morning register');
    } finally {
      setOpeningMorning(false);
    }
  };

  const handleOpenLesson = async (slotId: number) => {
    if (openLesson?.slotId === slotId) {
      setOpenLesson(null);
      return;
    }
    setOpeningLessonId(slotId);
    try {
      const res = await api.openLessonRegister(slotId);
      setOpenLesson({ slotId, register: res.data.register });
    } catch (e: any) {
      error(e?.response?.data?.error || 'Could not open lesson register');
    } finally {
      setOpeningLessonId(null);
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

  const notSchoolDay = lessonState.is_school_day === false;

  return (
    <div className="space-y-8">
      <ToastContainer />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Attendance
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Take your morning register and lesson registers for today.
        </p>
      </motion.div>

      {notSchoolDay && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-8 text-center text-gray-500">
          <CalendarClock className="mx-auto mb-3 text-gray-400" size={36} />
          No lessons are scheduled today (weekend).
        </div>
      )}

      {/* Morning register */}
      {!notSchoolDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400">
              <Sun className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Morning Register</h2>
              {morning?.register?.class_name && (
                <p className="text-sm text-gray-500">{morning.register.class_name}</p>
              )}
            </div>
          </div>

          {!morning?.assigned ? (
            <p className="text-gray-500 mt-4">
              You are not assigned a morning register class today.
            </p>
          ) : !morning.opened && !morningRegister ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleOpenMorning}
              disabled={openingMorning}
              className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 shadow-lg disabled:opacity-60"
            >
              {openingMorning ? 'Opening…' : 'Open morning register'}
            </motion.button>
          ) : morningRegister ? (
            <RegisterMarker
              register={morningRegister}
              kind="morning"
              onSubmitted={loadAll}
            />
          ) : null}
        </motion.div>
      )}

      {/* Lesson registers */}
      {!notSchoolDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
              <BookOpen className="text-white" size={22} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Today's Lessons</h2>
          </div>

          {lessonState.lessons.length === 0 ? (
            <div className="text-gray-500 mt-2">
              <p>No teaching lessons scheduled today.</p>
              <Link
                to="/teacher/my-timetable"
                className="inline-flex items-center gap-1 mt-3 text-emerald-700 font-medium hover:text-emerald-800"
              >
                Set up your timetable <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {lessonState.lessons.map((lesson) => {
                const isOpen = openLesson?.slotId === lesson.timetable_slot_id;
                return (
                  <div
                    key={lesson.timetable_slot_id}
                    className="rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => handleOpenLesson(lesson.timetable_slot_id)}
                      className="w-full flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 shrink-0">
                          {lesson.lesson_number}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {lesson.subject || lesson.class_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {lesson.class_name}
                            {lesson.room ? ` · Room ${lesson.room}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.submitted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle size={14} /> Done
                          </span>
                        ) : lesson.opened ? (
                          <span className="text-xs font-medium text-amber-600">In progress</span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">
                            {openingLessonId === lesson.timetable_slot_id ? 'Opening…' : 'Take register'}
                          </span>
                        )}
                        <ChevronRight
                          size={18}
                          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && openLesson && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-gray-100">
                            <RegisterMarker
                              register={openLesson.register}
                              kind="lesson"
                              onSubmitted={async () => {
                                setOpenLesson(null);
                                await loadAll();
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TeacherAttendance;
