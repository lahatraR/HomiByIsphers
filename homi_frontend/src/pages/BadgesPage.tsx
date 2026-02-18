import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string | null;
  progress?: number;
  target?: number;
}

export const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Badge[]>('/badges/');
      setBadges(res.data);
    } catch (err: any) {
      setError(err.message || t('badges.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const earnedCount = badges.filter(b => b.earnedAt).length;
  const categories = [...new Set(badges.map(b => b.category).filter(Boolean))];
  const filtered = badges.filter(b => filterCategory === 'all' || b.category === filterCategory);

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'tasks': return 'from-blue-500 to-blue-700';
      case 'time': return 'from-purple-500 to-purple-700';
      case 'social': return 'from-pink-500 to-pink-700';
      case 'special': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('badges.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('badges.progress', { earned: earnedCount, total: badges.length })}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0}%</div>
            <div className="text-xs text-gray-500">{t('badges.progressPercent')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
            style={{ width: `${badges.length > 0 ? (earnedCount / badges.length) * 100 : 0}%` }} />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {t('search.filterAll')} ({badges.length})
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
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
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-gray-500 font-medium">{t('badges.noBadges')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('badges.noBadgesDesc')}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(badge => {
              const earned = !!badge.earnedAt;
              return (
                <Card key={badge.id} className={`p-5 text-center transition-all hover:shadow-md ${!earned ? 'opacity-60 grayscale' : ''}`}>
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${getCategoryColor(badge.category)} flex items-center justify-center text-3xl shadow-lg mb-3`}>
                    {badge.icon || '🏅'}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{badge.description}</p>

                  {badge.progress !== undefined && badge.target !== undefined && !earned && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min((badge.progress / badge.target) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">{badge.progress}/{badge.target}</span>
                    </div>
                  )}

                  {earned && (
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="text-xs text-green-600 font-medium">
                        {t('badges.earnedOn', { date: new Date(badge.earnedAt!).toLocaleDateString('fr-FR') })}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
