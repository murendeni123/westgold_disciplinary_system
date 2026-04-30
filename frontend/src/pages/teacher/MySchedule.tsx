import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Select from '../../components/Select';
import { Calendar, Clock, BookOpen, Coffee } from 'lucide-react';

const MySchedule: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Monday = 0

  const days = [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
    { value: '5', label: 'Saturday' },
    { value: '6', label: 'Sunday' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchSchedule();
    }
  }, [user, selectedDay]);

  const fetchSchedule = async () => {
    try {
      const response = await api.getTimetables({ teacher_id: user?.id, day_of_week: selectedDay });
      // Sort by period number
      const sorted = response.data.sort((a: any, b: any) => a.period_number - b.period_number);
      setSchedule(sorted);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaySchedule = (day: number) => {
    return schedule.filter((s: any) => s.day_of_week === day);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">My Schedule</h1>
        <p className="text-text-muted mt-2">View your daily timetable and off periods</p>
      </div>

      <Card>
        <div className="mb-6">
          <Select
            label="Select Day"
            value={selectedDay.toString()}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            options={days}
          />
        </div>

        {schedule.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Calendar className="mx-auto mb-4 text-text-muted" size={48} />
            <p>No schedule found for {days.find(d => d.value === selectedDay.toString())?.label}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.map((item: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  item.is_break
                    ? 'bg-border-line border-text-muted'
                    : 'bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border-accent-green'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-xl ${
                      item.is_break ? 'bg-border-line' : 'bg-accent-green/20'
                    }`}>
                      {item.is_break ? (
                        <Coffee className={item.is_break ? 'text-text-muted' : 'text-accent-green'} size={24} />
                      ) : (
                        <BookOpen className="text-accent-green" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-lg text-text-main">
                          Period {item.period_number}
                        </span>
                        {item.is_break && (
                          <span className="px-2 py-1 bg-border-line text-text-muted rounded text-xs font-medium">
                            Off Period
                          </span>
                        )}
                      </div>
                      {!item.is_break && (
                        <>
                          <p className="text-text-main font-medium mb-1">
                            {item.subject || 'No Subject'}
                          </p>
                          {item.class_name && (
                            <p className="text-sm text-text-muted mb-2">
                              Class: {item.class_name}
                            </p>
                          )}
                        </>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        {item.start_time && item.end_time && (
                          <div className="flex items-center space-x-1">
                            <Clock size={16} />
                            <span>
                              {item.start_time} - {item.end_time}
                            </span>
                          </div>
                        )}
                        {item.room && !item.is_break && (
                          <span>Room: {item.room}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly Overview */}
      <Card title="Weekly Overview">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const daySchedule = getDaySchedule(Number(day.value));
            const lessonCount = daySchedule.filter((s: any) => !s.is_break).length;
            const offPeriodCount = daySchedule.filter((s: any) => s.is_break).length;

            return (
              <div
                key={day.value}
                className={`p-4 rounded-xl border-2 transition-all ${
                  Number(day.value) === selectedDay
                    ? 'border-accent-green bg-gradient-to-r from-accent-green/10 to-accent-cyan/10'
                    : 'border-border-line bg-card-bg hover:border-accent-green/50'
                }`}
              >
                <h3 className="font-semibold text-text-main mb-2">{day.label}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Lessons:</span>
                    <span className="font-semibold text-accent-green">{lessonCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Off:</span>
                    <span className="font-semibold text-text-muted">{offPeriodCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(Number(day.value))}
                  className="mt-3 w-full text-xs text-accent-green hover:text-accent-cyan font-medium transition-colors"
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MySchedule;



