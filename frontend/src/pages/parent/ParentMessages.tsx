import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { Plus } from 'lucide-react';

const ParentMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageType, setMessageType] = useState<'received' | 'sent'>('received');
  const [formData, setFormData] = useState({
    receiver_id: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [messageType]);

  const fetchMessages = async () => {
    try {
      const response = await api.getMessages(messageType);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [teachersRes] = await Promise.all([api.getTeachers()]);
      const allUsers = [
        ...teachersRes.data.map((t: any) => ({ id: t.id, name: t.name, email: t.email, role: 'teacher' })),
        { id: 'admin', name: 'Admin', email: 'admin@school.com', role: 'admin' },
      ];
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMessage(formData);
      setIsModalOpen(false);
      setFormData({ receiver_id: '', subject: '', message: '' });
      fetchMessages();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error sending message');
    }
  };

  const columns = [
    {
      key: messageType === 'received' ? 'sender_name' : 'receiver_name',
      label: messageType === 'received' ? 'From' : 'To',
    },
    { key: 'subject', label: 'Subject' },
    { key: 'message', label: 'Message' },
    {
      key: 'is_read',
      label: 'Status',
      render: (value: number) => (
        <span className={value ? 'text-gray-500' : 'text-blue-600 font-semibold'}>
          {value ? 'Read' : 'Unread'}
        </span>
      ),
    },
    { key: 'created_at', label: 'Date' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Communicate with teachers and admin</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          New Message
        </Button>
      </div>

      <Card>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setMessageType('received')}
            className={`px-4 py-2 rounded-lg font-medium ${
              messageType === 'received'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setMessageType('sent')}
            className={`px-4 py-2 rounded-lg font-medium ${
              messageType === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sent
          </button>
        </div>
        <Table columns={columns} data={messages} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Send Message"
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <Select
            label="To"
            value={formData.receiver_id}
            onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })}
            options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            required
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <Textarea
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParentMessages;



