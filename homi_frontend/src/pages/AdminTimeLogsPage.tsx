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

export const AdminTimeLogsPage: React.FC = () => {
  const [pendingLogs, setPendingLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminTimeLogStats | null>(null);

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
      setError('Failed to load pending time logs');
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
    if (!window.confirm('Approve this time log?')) return;

    try {
      setProcessingId(logId);
      await approveTimeLog(logId);
      // Retirer le log de la liste
      setPendingLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      setError('Failed to approve time log');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (logId: number) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(logId);
      await rejectTimeLog(logId, reason || undefined);
      // Retirer le log de la liste
      setPendingLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      setError('Failed to reject time log');
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
            Pending Time Logs
          </h1>
          <p className="text-gray-600">
            Review and approve time logs submitted by executors
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
              <p className="text-sm text-gray-600 mb-1">Pending Logs</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalPendingCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Heures approuvées</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalApprovedHours.toFixed(2)}h
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Logs approuvés</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.statuses.APPROVED.count}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Logs rejetés</p>
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
              ✅ No pending time logs to review
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
                      {log.taskTitle}
                    </h3>
                    
                    {/* Executor & Time */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Hours Worked</p>
                        <p className="text-lg font-bold text-primary-600">
                          {log.hoursWorked.toFixed(2)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Start Time</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">End Time</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Submitted</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {log.notes}
                        </p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {log.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleApprove(log.id)}
                      disabled={processingId === log.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === log.id ? '⏳' : '✅'} Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(log.id)}
                      disabled={processingId === log.id}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {processingId === log.id ? '⏳' : '❌'} Reject
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
