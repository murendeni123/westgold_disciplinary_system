import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface ImportProgress {
  type: 'students' | 'teachers' | 'classes';
  status: 'starting' | 'processing' | 'complete' | 'error';
  currentBatch?: number;
  totalBatches?: number;
  processed?: number;
  total?: number;
  percent?: number;
  message?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
}

export const useImportProgress = () => {
  const socket = useSocket();
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data: ImportProgress) => {
      setProgress(data);
    };

    socket.on('import-progress', handleProgress);

    return () => {
      socket.off('import-progress', handleProgress);
    };
  }, [socket]);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return { progress, resetProgress };
};
