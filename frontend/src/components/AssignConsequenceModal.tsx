import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Textarea from './Textarea';
import { api } from '../services/api';

interface AssignConsequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: number;
  incidentId?: number;
  onSuccess?: () => void;
}

const AssignConsequenceModal: React.FC<AssignConsequenceModalProps> = ({
  isOpen,
  onClose,
  studentId,
  incidentId,
  onSuccess,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [consequences, setConsequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: studentId || '',
    consequence_id: '',
    incident_id: incidentId || '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchConsequences();
      if (studentId) {
        setFormData(prev => ({ ...prev, student_id: studentId }));
      }
      if (incidentId) {
        setFormData(prev => ({ ...prev, incident_id: incidentId }));
      }
    }
  }, [isOpen, studentId, incidentId]);

  const fetchStudents = async () => {
    try {
      const response = await api.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchConsequences = async () => {
    try {
      const response = await api.getConsequenceDefinitions();
      setConsequences(response.data);
    } catch (error) {
      console.error('Error fetching consequences:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.assignConsequence(formData);
      alert('Consequence assigned successfully!');
      onSuccess?.();
      onClose();
      setFormData({
        student_id: studentId || '',
        consequence_id: '',
        incident_id: incidentId || '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error assigning consequence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Consequence">
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
          label="Consequence"
          value={formData.consequence_id}
          onChange={(e) => setFormData({ ...formData, consequence_id: e.target.value })}
        >
          <option value="">Select a consequence (optional)</option>
          {consequences.map((consequence) => (
            <option key={consequence.id} value={consequence.id}>
              {consequence.name} ({consequence.severity})
            </option>
          ))}
        </Select>

        <Input
          label="Assigned Date"
          type="date"
          value={formData.assigned_date}
          onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
          required
        />

        <Input
          label="Due Date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Consequence'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignConsequenceModal;

