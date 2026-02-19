import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner, SpellCheckInput, SpellCheckTextarea } from '../components/common';
import { recurringTaskService, type RecurringTaskTemplate, type CreateRecurringTaskForm } from '../services/recurringTask.service';
import { useDomicileStore } from '../stores/domicileStore';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bi-hebdomadaire',
  monthly: 'Mensuel',
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const RecurringTasksPage: React.FC = () => {
  const { t: _t } = useTranslation();
  const { domiciles, fetchDomiciles } = useDomicileStore();
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [executors, setExecutors] = useState<{ id: number; firstName: string; lastName: string; email: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CreateRecurringTaskForm>({
    title: '',
    description: '',
    domicileId: 0,
    executorId: 0,
    frequency: 'weekly',
    daysOfWeek: '1',
    preferredStartTime: '09:00',
    estimatedDurationMinutes: 120,
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [data] = await Promise.all([
          recurringTaskService.getAll(),
          fetchDomiciles(),
        ]);
        setTemplates(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchDomiciles]);

  // Charger les executeurs (users non-admin)
  useEffect(() => {
    const loadExecutors = async () => {
      try {
        const res = await api.get('/users');
        const users = (res.data as any[]).filter(u => u.role === 'ROLE_USER');
        setExecutors(users);
      } catch { /* ignore */ }
    };
    loadExecutors();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.domicileId || !form.executorId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setError(null);
      const newTemplate = await recurringTaskService.create(form);
      setTemplates(prev => [newTemplate, ...prev]);
      setShowForm(false);
      setForm(prev => ({ ...prev, title: '', description: '' }));
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await recurringTaskService.toggle(id);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce template ?')) return;
    try {
      await recurringTaskService.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGenerateResult(null);
      const result = await recurringTaskService.generate();
      setGenerateResult(`${result.message} pour le ${result.date}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const [selectedDays, setSelectedDays] = useState<number[]>([1]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      setForm(f => ({ ...f, daysOfWeek: next.join(',') }));
      return next;
    });
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔄 Tâches Récurrentes</h1>
            <p className="text-gray-500 mt-1">
              Automatisez la création de tâches répétitives
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={generating}
            >
              {generating ? '⏳ Génération...' : '▶ Générer aujourd\'hui'}
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              + Nouveau template
            </Button>
          </div>
        </div>

        {generateResult && (
          <Card className="p-4 bg-green-50 border-green-200 text-green-700">
            ✅ {generateResult}
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-red-50 border-red-200 text-red-700">
            ❌ {error}
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <Card className="p-6 border-primary-200 bg-primary-50/30">
            <h3 className="text-lg font-semibold mb-4">Nouveau template de tâche récurrente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <SpellCheckInput
                  type="text"
                  value={form.title}
                  onValueChange={val => setForm(f => ({ ...f, title: val }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: Ménage salon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <SpellCheckTextarea
                  value={form.description}
                  onValueChange={val => setForm(f => ({ ...f, description: val }))}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Description de la tâche..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicile *</label>
                <select
                  value={form.domicileId}
                  onChange={e => setForm(f => ({ ...f, domicileId: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={0}>Sélectionner...</option>
                  {domiciles.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exécuteur *</label>
                <select
                  value={form.executorId}
                  onChange={e => setForm(f => ({ ...f, executorId: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={0}>Sélectionner...</option>
                  {executors.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Days of week selector */}
              {(form.frequency === 'weekly' || form.frequency === 'biweekly') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jours de la semaine</label>
                  <div className="flex gap-2">
                    {DAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDays.includes(i)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                <input
                  type="time"
                  value={form.preferredStartTime || ''}
                  onChange={e => setForm(f => ({ ...f, preferredStartTime: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée (min)</label>
                <input
                  type="number"
                  value={form.estimatedDurationMinutes || ''}
                  onChange={e => setForm(f => ({ ...f, estimatedDurationMinutes: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                <input
                  type="date"
                  value={form.endDate || ''}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value || undefined }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
                Créer le template
              </Button>
              <Button onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700">
                Annuler
              </Button>
            </div>
          </Card>
        )}

        {/* Templates List */}
        {templates.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p className="text-5xl mb-4">🔄</p>
            <p className="text-lg">Aucun template de tâche récurrente</p>
            <p className="text-sm mt-2">Créez votre premier template pour automatiser la planification</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map(tmpl => (
              <Card
                key={tmpl.id}
                className={`p-5 border-l-4 ${tmpl.isActive ? 'border-l-green-500' : 'border-l-gray-300 opacity-60'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{tmpl.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tmpl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tmpl.isActive ? '✅ Actif' : '⏸ Inactif'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        {FREQ_LABELS[tmpl.frequency] || tmpl.frequency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{tmpl.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span>🏠 {tmpl.domicile.name}</span>
                      <span>👤 {tmpl.assignedTo.firstName} {tmpl.assignedTo.lastName}</span>
                      {tmpl.preferredStartTime && <span>🕐 {tmpl.preferredStartTime}</span>}
                      {tmpl.estimatedDurationMinutes && <span>⏱ {tmpl.estimatedDurationMinutes} min</span>}
                      {tmpl.daysOfWeek && (
                        <span>
                          📅 {tmpl.daysOfWeek.split(',').map(d => DAY_LABELS[Number(d)]).join(', ')}
                        </span>
                      )}
                    </div>
                    {tmpl.lastGeneratedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Dernière génération : {new Date(tmpl.lastGeneratedAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggle(tmpl.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      title={tmpl.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {tmpl.isActive ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => handleDelete(tmpl.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                      title="Supprimer"
                    >
                      🗑
                    </button>
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
