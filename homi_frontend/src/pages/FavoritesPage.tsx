import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface Favorite {
  id: number;
  entityType: string;
  entityId: number;
  label: string;
  createdAt: string;
}

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Favorite[]>('/favorites/');
      setFavorites(res.data);
    } catch (err: any) {
      setError(err.message || t('favorites.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id: number) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || t('favorites.errorRemoving'));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'task': return { icon: '📋', bg: 'bg-blue-100', label: t('favorites.task') };
      case 'domicile': return { icon: '🏠', bg: 'bg-orange-100', label: t('favorites.domicile') };
      case 'invoice': return { icon: '💰', bg: 'bg-green-100', label: t('favorites.invoice') };
      case 'user': return { icon: '👤', bg: 'bg-purple-100', label: t('favorites.user') };
      default: return { icon: '⭐', bg: 'bg-yellow-100', label: type || t('favorites.other') };
    }
  };

  const types = [...new Set(favorites.map(f => f.entityType))];
  const filtered = favorites.filter(f => filterType === 'all' || f.entityType === filterType);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('favorites.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('favorites.count', { count: favorites.length })}</p>
        </div>

        {types.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {t('search.filterAll')} ({favorites.length})
            </button>
            {types.map(typ => {
              const style = getTypeIcon(typ);
              return (
                <button key={typ} onClick={() => setFilterType(typ)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === typ ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {style.icon} {style.label} ({favorites.filter(f => f.entityType === typ).length})
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span><button onClick={load} className="text-sm font-medium underline">{t('common.retry')}</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-gray-500 font-medium">{t('favorites.noFavorites')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('favorites.noFavoritesDesc')}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(fav => {
              const style = getTypeIcon(fav.entityType);
              return (
                <Card key={fav.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{fav.label || `${style.label} #${fav.entityId}`}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{style.label}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{fav.createdAt ? new Date(fav.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(fav.id)} title={t('favorites.remove')}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
