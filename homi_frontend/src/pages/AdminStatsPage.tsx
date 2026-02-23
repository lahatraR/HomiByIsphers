import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, IconUsers, IconTaskCheck, IconClock, IconDollar, IconUser, IconSettings } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface AdminStats {
  overview: { totalUsers: number; totalTasks: number; totalDomiciles: number; completionRate: number };
  tasks: { byStatus: Record<string, number>; completedThisMonth: number };
  users: { admins: number; executors: number; recentRegistrations: number };
  timeLogs: { totalApprovedLogs: number; totalApprovedHours: number };
  invoices: { totalPaid: number; totalRevenue: number };
}

export const AdminStatsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<AdminStats>('/admin/stats/');
        setStats(res.data);
      } catch (err: any) {
        setError(err.message || t('admin.stats.errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  if (isLoading) {
    return <MainLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></MainLayout>;
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </MainLayout>
    );
  }

  if (!stats) return null;

  const taskStatusColors: Record<string, string> = {
    TODO: 'bg-gray-400',
    IN_PROGRESS: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
  };

  const taskStatusLabels: Record<string, string> = {
    TODO: t('admin.stats.statusTodo'),
    IN_PROGRESS: t('admin.stats.statusInProgress'),
    COMPLETED: t('admin.stats.statusCompleted'),
  };

  const totalTasks = stats.overview.totalTasks || 1;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.stats.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('admin.stats.subtitle')}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{t('admin.stats.users')}</span>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.overview.totalUsers}</div>
            <p className="text-sm opacity-80 mt-1">{stats.users.recentRegistrations} {t('admin.stats.thisMonth')}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-700 text-white">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{t('admin.stats.tasks')}</span>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <IconTaskCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.overview.totalTasks}</div>
            <p className="text-sm opacity-80 mt-1">{stats.tasks.completedThisMonth} {t('admin.stats.completedThisMonth')}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{t('admin.stats.approvedHours')}</span>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <IconClock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.timeLogs.totalApprovedHours}h</div>
            <p className="text-sm opacity-80 mt-1">{stats.timeLogs.totalApprovedLogs} {t('admin.stats.validatedLogs')}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{t('admin.stats.revenue')}</span>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <IconDollar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(stats.invoices.totalRevenue)}</div>
            <p className="text-sm opacity-80 mt-1">{stats.invoices.totalPaid} {t('admin.stats.paidInvoices')}</p>
          </Card>
        </div>

        {/* Task Distribution & Completion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.stats.taskDistribution')}</h2>
            <div className="space-y-4">
              {Object.entries(stats.tasks.byStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{taskStatusLabels[status] || status}</span>
                    <span className="text-gray-500">{count} ({Math.round((count / totalTasks) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${taskStatusColors[status] || 'bg-gray-400'}`}
                      style={{ width: `${Math.round((count / totalTasks) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.stats.team')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                    <IconSettings className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t('admin.stats.administrators')}</div>
                    <div className="text-sm text-gray-500">{t('admin.stats.fullAccess')}</div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{stats.users.admins}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <IconUser className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t('admin.stats.executors')}</div>
                    <div className="text-sm text-gray-500">{t('admin.stats.tasksAndHours')}</div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.users.executors}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">{t('admin.stats.globalCompletionRate')}</div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="h-4 bg-blue-600 rounded-full transition-all" style={{ width: `${stats.overview.completionRate}%` }} />
                </div>
                <span className="text-lg font-bold text-blue-600">{stats.overview.completionRate}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Info */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.stats.domiciles')}</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.overview.totalDomiciles}</div>
              <div className="text-sm text-gray-500">{t('admin.stats.registeredDomiciles')}</div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
