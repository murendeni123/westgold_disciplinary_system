import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Textarea from './Textarea';
import { api } from '../services/api';

interface AssignInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: number;
  onSuccess?: () => void;
}

const AssignInterventionModal: React.FC<AssignInterventionModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: studentId || '',
    type: '',
    description: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchTypes();
      if (studentId) {
        setFormData(prev => ({ ...prev, student_id: studentId }));
      }
    }
  }, [isOpen, studentId]);

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.getInterventionTypes();
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createIntervention(formData);
      alert('Intervention assigned successfully!');
      onSuccess?.();
      onClose();
      setFormData({
        student_id: studentId || '',
        type: '',
        description: '',
        start_date: '',
        end_date: '',
        notes: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error assigning intervention');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Intervention">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!studentId && (
          <Select
            label="Student"
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            required
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.student_id})
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Intervention Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="">Select a type</option>
          {types.map((type) => (
            <option key={type.name} value={type.name}>
              {type.name}
            </option>
          ))}
        </Select>

        <Input
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />

        <Input
          label="End Date"
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Intervention'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignInterventionModal;

