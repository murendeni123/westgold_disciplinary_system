import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Award, AlertTriangle } from 'lucide-react';

const MeritsDemeritsSimple: React.FC = () => {
  const [merits, setMerits] = useState<any[]>([]);
  const [demerits, setDemerits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'merits' | 'demerits'>('demerits');

  useEffect(() => {
    fetchData();
  }, [viewType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (viewType === 'merits') {
        console.log('Fetching merits...');
        const response = await api.getMerits({});
        console.log('Merits response:', response.data);
        setMerits(response.data || []);
      } else {
        console.log('Fetching incidents...');
        const response = await api.getIncidents({});
        console.log('Incidents response:', response.data);
        setDemerits(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Merits & Demerits</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewType('merits')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewType === 'merits' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Award size={20} />
            <span>Merits</span>
          </button>
          <button
            onClick={() => setViewType('demerits')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewType === 'demerits' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <AlertTriangle size={20} />
            <span>Demerits</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          {viewType === 'merits' ? 'Merits' : 'Demerits'} ({viewType === 'merits' ? merits.length : demerits.length})
        </h2>
        
        {viewType === 'merits' ? (
          <div className="space-y-2">
            {merits.length === 0 ? (
              <p className="text-gray-500">No merits found</p>
            ) : (
              merits.map((merit) => (
                <div key={merit.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{merit.student_name}</span>
                    <span className="text-sm text-gray-500">{merit.merit_date}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {merit.description} - {merit.points} points
                  </div>
                  <div className="text-xs text-gray-400">
                    Teacher: {merit.teacher_name} | Class: {merit.class_name || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {demerits.length === 0 ? (
              <p className="text-gray-500">No demerits found</p>
            ) : (
              demerits.map((demerit) => (
                <div key={demerit.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{demerit.student_name}</span>
                    <span className="text-sm text-gray-500">{demerit.date}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {demerit.description} - {demerit.severity}
                  </div>
                  <div className="text-xs text-gray-400">
                    Teacher: {demerit.teacher_name} | Class: {demerit.class_name || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeritsDemeritsSimple;
