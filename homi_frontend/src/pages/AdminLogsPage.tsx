import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface LogEntry {
  id: number;
  type: string;
  message: string;
  date: string;
}

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<LogEntry[]>('/admin/logs/');
      setLogs(res.data);
    } catch (err: any) {
      setError(err.message || t('admin.logs.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const logTypes = [...new Set(logs.map(l => l.type))];

  const filteredLogs = logs.filter(l => {
    const matchesType = filterType === 'all' || l.type === filterType;
    const matchesSearch = searchQuery === '' || l.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.logs.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('admin.logs.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><div className="text-sm text-gray-600">{t('admin.logs.total')}</div><div className="mt-1 text-2xl font-bold text-gray-900">{logs.length}</div></Card>
          <Card><div className="text-sm text-gray-600">{t('admin.logs.errors')}</div><div className="mt-1 text-2xl font-bold text-red-600">{logs.filter(l => l.type === 'error').length}</div></Card>
          <Card><div className="text-sm text-gray-600">{t('admin.logs.warnings')}</div><div className="mt-1 text-2xl font-bold text-yellow-600">{logs.filter(l => l.type === 'warning').length}</div></Card>
          <Card><div className="text-sm text-gray-600">{t('admin.logs.info')}</div><div className="mt-1 text-2xl font-bold text-blue-600">{logs.filter(l => l.type === 'info').length}</div></Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder={t('admin.logs.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterType('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {t('admin.users.filterAll')}
              </button>
              {logTypes.map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={loadLogs} className="text-sm font-medium underline">{t('common.retry')}</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filteredLogs.length === 0 ? (
          <Card><div className="text-center py-12"><p className="text-gray-500">{t('admin.logs.noLogs')}</p></div></Card>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap mt-0.5 ${getTypeColor(log.type)}`}>
                  {log.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{log.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {log.date ? new Date(log.date).toLocaleString('fr-FR') : '\u2014'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
