import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { performanceService, type PerformanceData } from '../services/performance.service';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

export const PerformancePage: React.FC = () => {
  const { user: _user } = useAuthStore();
  const { t: _t } = useTranslation();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await performanceService.getDashboard();
        setData(result);
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <Card className="p-6 text-center text-red-600">{error || 'Aucune donnée'}</Card>
      </MainLayout>
    );
  }

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span className="text-yellow-400 text-xl">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(5 - full - (half ? 1 : 0))}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Ma Performance</h1>
          <p className="text-gray-500 mt-1">
            Analyse de vos résultats et progression
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-primary-600">{data.tasks.completed}</p>
            <p className="text-sm text-gray-500 mt-1">Tâches complétées</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{data.speed.totalHours}h</p>
            <p className="text-sm text-gray-500 mt-1">Heures totales</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{data.onTimeRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Dans les temps</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">🔥 {data.streak}</p>
            <p className="text-sm text-gray-500 mt-1">Jours consécutifs</p>
          </Card>
        </div>

        {/* Rating + Speed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">⭐ Note moyenne</h3>
            <div className="flex items-center gap-3">
              {renderStars(data.rating.averageRating)}
              <span className="text-2xl font-bold">{data.rating.averageRating}/5</span>
              <span className="text-sm text-gray-500">({data.rating.totalReviews} avis)</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">⚡ Vitesse</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Moyenne par tâche</span>
                <span className="font-semibold">{data.speed.avgHoursPerTask}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plus rapide</span>
                <span className="font-semibold text-green-600">{data.speed.fastestTask}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plus lente</span>
                <span className="font-semibold text-red-500">{data.speed.slowestTask}h</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Completion Rate Bar */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Taux de complétion</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${data.tasks.completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-xl font-bold">{data.tasks.completionRate}%</span>
          </div>
          <div className="flex gap-6 mt-3 text-sm text-gray-500">
            <span>✅ {data.tasks.completed} complétées</span>
            <span>🔄 {data.tasks.inProgress} en cours</span>
            <span>📋 {data.tasks.todo} à faire</span>
          </div>
        </Card>

        {/* Weekly Activity Sparkline */}
        {data.weeklyActivity.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📅 Activité par semaine</h3>
            <div className="flex items-end gap-2 h-32">
              {data.weeklyActivity.map((week, i) => {
                const maxTasks = Math.max(...data.weeklyActivity.map(w => w.tasksCompleted), 1);
                const height = (week.tasksCompleted / maxTasks) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{week.tasksCompleted}</span>
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${week.tasksCompleted} tâches, ${week.hoursWorked}h`}
                    />
                    <span className="text-xs text-gray-400">
                      S{new Date(week.weekStart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Domicile Breakdown */}
        {data.domicileBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🏠 Répartition par domicile</h3>
            <div className="space-y-3">
              {data.domicileBreakdown.map((dom, i) => {
                const maxTasks = Math.max(...data.domicileBreakdown.map(d => d.taskCount), 1);
                const width = (dom.taskCount / maxTasks) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{dom.domicileName}</span>
                      <span className="text-gray-500">{dom.taskCount} tâches · {dom.totalHours}h</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
