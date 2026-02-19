import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { budgetService, type BudgetOverview, type TodayCost } from '../services/budget.service';
import { useDomicileStore } from '../stores/domicileStore';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const BudgetPage: React.FC = () => {
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [today, setToday] = useState<TodayCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { domiciles, fetchDomiciles } = useDomicileStore();

  // Form for setting budget
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    domicileId: 0,
    budgetAmount: 0,
  });

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, td] = await Promise.all([
          budgetService.getOverview(),
          budgetService.getToday(),
          fetchDomiciles(),
        ]);
        setOverview(ov);
        setToday(td);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchDomiciles]);

  const handleSetBudget = async () => {
    if (budgetForm.domicileId === 0 || budgetForm.budgetAmount <= 0) {
      setError('Sélectionnez un domicile et un montant valide');
      return;
    }
    try {
      setError(null);
      await budgetService.setBudget({
        domicileId: budgetForm.domicileId,
        year,
        month,
        budgetAmount: budgetForm.budgetAmount,
      });
      // Recharger
      const ov = await budgetService.getOverview();
      setOverview(ov);
      setShowBudgetForm(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'over': return 'bg-red-500';
      case 'warning': return 'bg-orange-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Budget & Coûts</h1>
            <p className="text-gray-500 mt-1">
              {MONTH_NAMES[month - 1]} {year} — Suivi en temps réel
            </p>
          </div>
          <Button
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            ⚙ Définir un budget
          </Button>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200 text-red-700">❌ {error}</Card>
        )}

        {/* Today Widget */}
        {today && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <p className="text-sm text-blue-600 mb-1">💶 Coût aujourd'hui</p>
              <p className="text-3xl font-bold text-blue-700">{today.todayCost.toFixed(2)}€</p>
            </Card>
            <Card className="p-5 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <p className="text-sm text-purple-600 mb-1">⏱ Heures aujourd'hui</p>
              <p className="text-3xl font-bold text-purple-700">{today.todayHours}h</p>
            </Card>
            <Card className="p-5 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <p className="text-sm text-green-600 mb-1">✅ Tâches facturées</p>
              <p className="text-3xl font-bold text-green-700">{today.tasksCount}</p>
            </Card>
          </div>
        )}

        {/* Monthly Summary */}
        {overview && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              📊 Résumé mensuel — {MONTH_NAMES[overview.month - 1]}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Budget total</p>
                <p className="text-xl font-bold">
                  {overview.totalBudget > 0 ? `${overview.totalBudget.toFixed(0)}€` : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Dépensé</p>
                <p className="text-xl font-bold text-blue-600">{overview.totalSpent.toFixed(0)}€</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Projection fin de mois</p>
                <p className="text-xl font-bold text-purple-600">{overview.totalProjected.toFixed(0)}€</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Utilisation</p>
                <p className={`text-xl font-bold ${
                  (overview.percentUsed ?? 0) >= 100 ? 'text-red-600' :
                  (overview.percentUsed ?? 0) >= 80 ? 'text-orange-500' : 'text-green-600'
                }`}>
                  {overview.percentUsed !== null ? `${overview.percentUsed}%` : '—'}
                </p>
              </div>
            </div>

            {/* Global progress bar */}
            {overview.totalBudget > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (overview.percentUsed ?? 0) >= 100 ? 'bg-red-500' :
                    (overview.percentUsed ?? 0) >= 80 ? 'bg-orange-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(overview.percentUsed ?? 0, 100)}%` }}
                />
              </div>
            )}
          </Card>
        )}

        {/* Set Budget Form */}
        {showBudgetForm && (
          <Card className="p-6 border-primary-200 bg-primary-50/30">
            <h3 className="text-lg font-semibold mb-4">Définir le budget du mois</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicile</label>
                <select
                  value={budgetForm.domicileId}
                  onChange={e => setBudgetForm(f => ({ ...f, domicileId: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={0}>Sélectionner...</option>
                  {domiciles.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
                <input
                  type="number"
                  value={budgetForm.budgetAmount || ''}
                  onChange={e => setBudgetForm(f => ({ ...f, budgetAmount: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="1500"
                  min={1}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSetBudget} className="bg-primary-600 hover:bg-primary-700 text-white w-full">
                  Enregistrer
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Per-Domicile Breakdown */}
        {overview && overview.domiciles.length > 0 && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">🏠 Par domicile</h3>
            {overview.domiciles.map(dom => (
              <Card key={dom.domicileId} className={`p-5 border-l-4 ${
                dom.status === 'over' ? 'border-l-red-500' :
                dom.status === 'warning' ? 'border-l-orange-400' : 'border-l-green-500'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{dom.domicileName}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dom.status)}`}>
                    {dom.status === 'over' ? '🔴 Dépassé' : dom.status === 'warning' ? '🟠 Attention' : '🟢 OK'}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-600 mb-2">
                  <span>Budget : {dom.budget ? `${dom.budget.toFixed(0)}€` : 'Non défini'}</span>
                  <span>Dépensé : {dom.spent.toFixed(0)}€</span>
                  <span>Heures : {dom.hoursWorked}h</span>
                  <span>Projection : {dom.projected.toFixed(0)}€</span>
                </div>
                {dom.budget && dom.budget > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBarColor(dom.status)}`}
                      style={{ width: `${Math.min(dom.percentUsed ?? 0, 100)}%` }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
