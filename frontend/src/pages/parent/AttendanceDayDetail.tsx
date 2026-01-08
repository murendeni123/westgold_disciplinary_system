import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

const AttendanceDayDetail: React.FC = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (date) {
      fetchAttendance();
    }
  }, [date]);

  const fetchAttendance = async () => {
    try {
      const response = await api.getAttendance({ date });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="secondary" onClick={() => navigate('/parent/attendance')}>
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Details</h1>
          <p className="text-gray-600 mt-2">Date: {date}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {attendance.map((record) => (
            <div
              key={record.id}
              className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{record.student_name}</p>
                <p className="text-sm text-gray-600">{record.class_name}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  record.status === 'present'
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'absent'
                    ? 'bg-red-100 text-red-800'
                    : record.status === 'late'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {record.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AttendanceDayDetail;



