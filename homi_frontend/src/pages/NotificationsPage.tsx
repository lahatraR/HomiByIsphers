import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Notification[]>('/notifications/');
      setNotifications(res.data);
    } catch (err: any) {
      setError(err.message || t('notifications.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}`, { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      console.error('Erreur:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error('Erreur:', err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Erreur:', err.message);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'task': return { bg: 'bg-blue-100', text: 'text-blue-600', icon: '📋' };
      case 'invoice': return { bg: 'bg-green-100', text: 'text-green-600', icon: '💰' };
      case 'alert': return { bg: 'bg-red-100', text: 'text-red-600', icon: '⚠️' };
      case 'system': return { bg: 'bg-purple-100', text: 'text-purple-600', icon: '⚙️' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🔔' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('notifications.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allRead')}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm font-medium text-blue-600 hover:text-blue-800">
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {f === 'all' ? t('notifications.all', { count: notifications.length }) : f === 'unread' ? t('notifications.unread', { count: unreadCount }) : t('notifications.read', { count: notifications.length - unreadCount })}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span><button onClick={load} className="text-sm font-medium underline">{t('common.retry')}</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 font-medium">{t('notifications.noNotifications')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('notifications.noNotificationsDesc')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => {
              const typeStyle = getTypeIcon(notif.type);
              return (
                <div key={notif.id}
                  className={`bg-white border rounded-lg px-4 py-3 flex items-start gap-3 transition-all hover:shadow-sm ${!notif.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-full ${typeStyle.bg} flex items-center justify-center flex-shrink-0 text-lg`}>
                    {typeStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('fr-FR') : ''}</span>
                      {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} title={t('notifications.markAsRead')}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </button>
                    )}
                    <button onClick={() => handleDelete(notif.id)} title={t('common.delete')}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
