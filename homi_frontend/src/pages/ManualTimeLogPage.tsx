import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner, SpellCheckTextarea } from '../components/common';
import { taskService, type Task } from '../services/task.service';
import { submitTimeLog } from '../services/timeTracking.service';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ManualTimeLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [taskId, setTaskId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const allTasks = await taskService.getAllTasks();
      // Filtrer les tâches assignées à l'utilisateur
      setTasks(allTasks);
    } catch (err: any) {
      setError(t('timeLogs.errorLoadTasks'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!taskId) {
      setError(t('timeLogs.selectTaskError'));
      return;
    }

    if (!date || !startTime || !endTime) {
      setError(t('timeLogs.fillRequired'));
      return;
    }

    // Créer les timestamps
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setError(t('timeLogs.endAfterStart'));
      return;
    }

    setSubmitting(true);
    try {
      await submitTimeLog(
        Number(taskId),
        startDateTime,
        endDateTime,
        notes || undefined
      );
      setSuccess(t('timeLogs.submitSuccess'));
      
      // Réinitialiser le formulaire
      setTaskId('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('17:00');
      setNotes('');

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/my-time-logs');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || t('timeLogs.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff.toFixed(2) : 0;
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('timeLogs.manualEntry')}</h1>
          <p className="text-gray-600 mt-1">
            {t('timeLogs.manualSubtitle')}
          </p>
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
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Sélection de la tâche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('timeLogs.selectTask')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">{t('timeLogs.selectTaskPlaceholder')}</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} - {task.domicile.name} ({task.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('timeLogs.date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Heures de début et fin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('timeLogs.startTime')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('timeLogs.endTime')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Affichage du total d'heures */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{t('timeLogs.totalHours')}:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {calculateHours()}h
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('timeLogs.notes')}
                </label>
                <SpellCheckTextarea
                  value={notes}
                  onValueChange={(val) => setNotes(val)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('timeLogs.notesPlaceholder')}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? t('common.saving') : t('common.save')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/my-time-logs')}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Information */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('timeLogs.infoTitle')}:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('timeLogs.infoLine1')}</li>
                <li>{t('timeLogs.infoLine2')}</li>
                <li>{t('timeLogs.infoLine3')}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
