import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { 
  getPendingTimeLogs, 
  approveTimeLog, 
  rejectTimeLog, 
  getAdminTimeLogStats,
  type TimeLog,
  type AdminTimeLogStats
} from '../services/timeTracking.service';
import { useTranslation } from 'react-i18next';

export const AdminTimeLogsPage: React.FC = () => {
  const [pendingLogs, setPendingLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminTimeLogStats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    Promise.all([fetchPendingLogs(), fetchStats()]).catch(() => {});
  }, []);

  const fetchPendingLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const logs = await getPendingTimeLogs();
      setPendingLogs(logs);
    } catch (err) {
      setError(t('timeLogs.errorLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAdminTimeLogStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (logId: number) => {
    if (!window.confirm(t('timeLogs.confirmApprove'))) return;

    try {
      setProcessingId(logId);
      await approveTimeLog(logId);
      // Retirer le log de la liste
      setPendingLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      setError(t('timeLogs.errorApprove'));
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (logId: number) => {
    const reason = window.prompt(t('timeLogs.rejectReason'));
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(logId);
      await rejectTimeLog(logId, reason || undefined);
      // Retirer le log de la liste
      setPendingLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      setError(t('timeLogs.errorReject'));
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('timeLogs.titleAdmin')}
          </h1>
          <p className="text-gray-600">
            {t('timeLogs.subtitleAdmin')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">❌ {error}</p>
          </Card>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.pendingLogs')}</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalPendingCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.approvedHours')}</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalApprovedHours.toFixed(2)}h
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.approvedLogs')}</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.statuses.APPROVED.count}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.rejectedLogs')}</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.statuses.REJECTED.count}
              </p>
            </Card>
          </div>
        )}

        {/* Pending Logs List */}
        {pendingLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 text-lg">
              ✅ {t('timeLogs.noLogs')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingLogs.map(log => (
              <Card key={log.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Task Info */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {log.taskTitle || t('timeLogs.task')}
                    </h3>
                    
                    {/* Executor & Time */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">{t('timeLogs.duration')}</p>
                        <p className="text-lg font-bold text-primary-600">
                          {log.hoursWorked.toFixed(2)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('timeLogs.startTime')}</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('timeLogs.endTime')}</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('timeLogs.submitted')}</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">{t('timeLogs.notes')}</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {log.notes}
                        </p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('timeLogs.pending')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleApprove(log.id)}
                      disabled={processingId === log.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === log.id ? '⏳' : '✅'} {t('timeLogs.approve')}
                    </Button>
                    <Button
                      onClick={() => handleReject(log.id)}
                      disabled={processingId === log.id}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {processingId === log.id ? '⏳' : '❌'} {t('timeLogs.reject')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
