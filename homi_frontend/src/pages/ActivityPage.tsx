import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Activity[]>('/activity/');
      setActivities(res.data);
    } catch (err: any) {
      setError(err.message || t('activity.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'task_created': return { icon: '📝', bg: 'bg-blue-100', color: 'text-blue-600' };
      case 'task_completed': return { icon: '✅', bg: 'bg-green-100', color: 'text-green-600' };
      case 'invoice_created': return { icon: '💰', bg: 'bg-yellow-100', color: 'text-yellow-600' };
      case 'invoice_paid': return { icon: '💵', bg: 'bg-green-100', color: 'text-green-600' };
      case 'time_logged': return { icon: '⏱️', bg: 'bg-purple-100', color: 'text-purple-600' };
      case 'domicile_created': return { icon: '🏠', bg: 'bg-orange-100', color: 'text-orange-600' };
      case 'user_login': return { icon: '🔑', bg: 'bg-gray-100', color: 'text-gray-600' };
      default: return { icon: '📌', bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  const types = [...new Set(activities.map(a => a.type))];
  const filtered = activities.filter(a => filterType === 'all' || a.type === filterType);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 1) return t('activity.justNow');
    if (diffMin < 60) return t('activity.minutesAgo', { count: diffMin });
    if (diffHour < 24) return t('activity.hoursAgo', { count: diffHour });
    if (diffDay < 7) return t('activity.daysAgo', { count: diffDay });
    return date.toLocaleDateString('fr-FR');
  };

  // Group by day
  const groupedByDay = filtered.reduce<Record<string, Activity[]>>((acc, activity) => {
    const day = activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date inconnue';
    if (!acc[day]) acc[day] = [];
    acc[day].push(activity);
    return acc;
  }, {});

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('activity.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('activity.subtitle')}</p>
        </div>

        {types.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Tout ({activities.length})
            </button>
            {types.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span><button onClick={load} className="text-sm font-medium underline">Reessayer</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500 font-medium">{t('activity.noActivity')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('activity.noActivityDesc')}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayActivities]) => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">{day}</h3>
                <div className="space-y-1">
                  {dayActivities.map(activity => {
                    const style = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start gap-3 py-3 px-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className={`w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 text-base`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <span className="text-xs text-gray-400">{activity.createdAt ? formatRelativeTime(activity.createdAt) : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
