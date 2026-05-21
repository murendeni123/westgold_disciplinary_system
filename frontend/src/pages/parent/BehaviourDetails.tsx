import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';
import { decodeHtmlEntities } from '../../utils/htmlDecode';
import { useLanguage } from '../../contexts/LanguageContext';

const BehaviourDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchIncident();
    }
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await api.getIncident(Number(id));
      setIncident(response.data);
    } catch (error) {
      console.error('Error fetching incident:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>;
  }

  if (!incident) {
    return <div>{t('errors.notFound') || 'Incident not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="secondary" onClick={() => navigate('/parent/behaviour')}>
          <ArrowLeft size={20} className="mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('parent.incidentDetails')}</h1>
          <p className="text-gray-600 mt-2">Date: {incident.incident_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('parent.incidentInfo')}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">{t('parent.student')}</p>
              <p className="text-lg font-semibold">{incident.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('common.class')}</p>
              <p className="text-lg font-semibold">{incident.class_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('parent.dateTime')}</p>
              <p className="text-lg font-semibold">
                {incident.incident_date} {incident.incident_time || ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('common.type')}</p>
              <p className="text-lg font-semibold">{incident.incident_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('behaviour.severity')}</p>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  incident.severity === 'high'
                    ? 'bg-red-100 text-red-800'
                    : incident.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('common.status')}</p>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  incident.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : incident.status === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {incident.status.toUpperCase()}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Description">
          <p className="text-gray-700">{decodeHtmlEntities(incident.description) || t('parent.noDescription')}</p>
          {incident.admin_notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">{t('parent.adminNotes')}:</p>
              <p className="text-gray-700">{incident.admin_notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BehaviourDetails;



