import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { getMyTimeLogs, getTimeLogStats, type TimeLog } from '../services/timeTracking.service';
import { useTranslation } from 'react-i18next';

export const MyTimeLogsPage: React.FC = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [logs, statistics] = await Promise.all([
        getMyTimeLogs(filterStatus === 'all' ? undefined : filterStatus),
        getTimeLogStats()
      ]);

      setTimeLogs(logs);
      setStats(statistics);
    } catch (err) {
      setError(t('timeLogs.errorLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('timeLogs.title')}</h1>
            <p className="text-gray-600">{t('timeLogs.subtitle')}</p>
          </div>
          <Link to="/my-time-logs/manual">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('timeLogs.addManually')}
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">❌ {error}</p>
          </Card>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.totalApprovedHours')}</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalHours.toFixed(2)}h
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.totalLogs')}</p>
              <p className="text-3xl font-bold text-primary-600">{stats.logsCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">{t('timeLogs.executor')}</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.executor.firstName} {stats.executor.lastName}
              </p>
            </Card>
          </div>
        )}

        {/* Filter Buttons */}
        <Card className="p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilterStatus('all')}
              className={`${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('common.all')}
            </Button>
            <Button
              onClick={() => setFilterStatus('PENDING')}
              className={`${
                filterStatus === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('timeLogs.pending')}
            </Button>
            <Button
              onClick={() => setFilterStatus('APPROVED')}
              className={`${
                filterStatus === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('timeLogs.approved')}
            </Button>
            <Button
              onClick={() => setFilterStatus('REJECTED')}
              className={`${
                filterStatus === 'REJECTED'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('timeLogs.rejected')}
            </Button>
          </div>
        </Card>

        {/* Time Logs List */}
        {timeLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 text-lg">
              {t('timeLogs.noLogs')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {timeLogs.map(log => (
              <Card key={log.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Task Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {log.taskTitle}
                    </h3>

                    {/* Details Grid */}
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
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status === 'APPROVED' ? t('timeLogs.approved') : log.status === 'PENDING' ? t('timeLogs.pending') : log.status === 'REJECTED' ? t('timeLogs.rejected') : log.status}
                    </span>
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
