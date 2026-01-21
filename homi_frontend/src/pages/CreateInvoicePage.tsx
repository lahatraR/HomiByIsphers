import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { domicileService, type Domicile } from '../services/domicile.service';
import { userService } from '../services/user.service';
import { createInvoice } from '../services/invoice.service';
import type { User } from '../types';
import { getAdminTimeLogStats, type AdminTimeLogStats } from '../services/timeTracking.service';

export const CreateInvoicePage: React.FC = () => {
  const [domiciles, setDomiciles] = useState<Domicile[]>([]);
  const [executors, setExecutors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminTimeLogStats | null>(null);
  const [domicileId, setDomicileId] = useState<number | ''>('');
  const [executorId, setExecutorId] = useState<number | ''>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [taxRate, setTaxRate] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const [doms, users, stats] = await Promise.all([
        domicileService.getAllDomiciles(),
        userService.getNonAdminUsers(),
        getAdminTimeLogStats()
      ]);
      setDomiciles(doms);
      setExecutors(users);
      setAdminStats(stats);
    } catch (err: any) {
      setError('Impossible de charger les données (domiciles ou exécutants)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!executorId || periodStart || periodEnd) return;
    const execStats = adminStats?.hoursByExecutor.find((item) => item.executorId === executorId);
    if (execStats && execStats.totalHours > 0) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setPeriodStart(start.toISOString().split('T')[0]);
      setPeriodEnd(today.toISOString().split('T')[0]);
    }
  }, [executorId, adminStats, periodStart, periodEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!domicileId || !executorId || !periodStart || !periodEnd) {
      setError('Veuillez renseigner domicile, exécutant et période');
      return;
    }

    setSubmitting(true);
    try {
      await createInvoice({
        domicileId: Number(domicileId),
        executorId: Number(executorId),
        periodStart,
        periodEnd,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        taxRate: taxRate ? Number(taxRate) : undefined,
        notes: notes || undefined,
      });
      setSuccess('Facture générée avec succès');
      setDomicileId('');
      setExecutorId('');
      setPeriodStart('');
      setPeriodEnd('');
      setHourlyRate('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la génération de la facture');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Créer une facture</h1>
          <p className="text-gray-600 mt-1">Générer une facture à partir des heures approuvées</p>
          <p className="text-sm text-gray-500">La période se pré-remplit au mois courant dès qu'un exécutant avec des heures approuvées est sélectionné.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicile</label>
                <select
                  value={domicileId}
                  onChange={(e) => setDomicileId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Sélectionner un domicile</option>
                  {domiciles.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exécutant</label>
                <select
                  value={executorId}
                  onChange={(e) => setExecutorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Sélectionner un exécutant</option>
                  {executors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Période début</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Période fin</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux horaire (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="Optionnel (priorité au taux du domicile-exécutant)"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Optionnel"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Génération…' : 'Créer la facture'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
