import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Button, Input, Card } from '../components/common';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { useDomicileStore } from '../stores/domicileStore';
import { UserRoles } from '../types';
import type { User } from '../types';
import { userService } from '../services/user.service';
import { useTranslation } from 'react-i18next';

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTask, isLoading } = useTaskStore();
  const { user } = useAuthStore();
  const { domiciles, isLoading: domicilesLoading, fetchDomiciles } = useDomicileStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domicileId: '',
    executorId: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
  });

  const [executors, setExecutors] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = useMemo(() => user?.role === UserRoles.ADMIN, [user]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchExecutors = async () => {
      if (!isAdmin) return;
      setIsFetchingUsers(true);
      try {
        const users = await userService.getNonAdminUsers();
        setExecutors(users);
      } catch (err: any) {
        setError(err?.message || 'Impossible de charger les exécutants');
      } finally {
        setIsFetchingUsers(false);
      }
    };

    fetchExecutors();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchDomiciles();
    }
  }, [isAdmin, fetchDomiciles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        domicileId: Number(formData.domicileId),
        executorId: Number(formData.executorId),
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      });
      navigate('/tasks');
    } catch (error: any) {
      setError(error?.message || 'Échec de la création de la tâche');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <Card className="p-8 max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access restricted</h1>
          <p className="text-gray-600 mb-4">Only administrators can create tasks.</p>
          <Button variant="primary" onClick={() => navigate('/tasks')}>
            Return to tasks
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('createTask.title')}</h1>
          <p className="text-gray-600">{t('createTask.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h2>
            
            <div className="space-y-4">
              <Input
                label={t('createTask.taskTitle')}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('createTask.taskTitlePlaceholder')}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createTask.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('createTask.descriptionPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createTask.selectDomicile')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="domicileId"
                  value={formData.domicileId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    {domicilesLoading ? t('common.loading') : t('createTask.selectDomicile')}
                  </option>
                  {domiciles.map((domicile) => (
                    <option key={domicile.id} value={domicile.id}>
                      {domicile.name} - {domicile.address}, {domicile.city}
                    </option>
                  ))}
                </select>
                {domiciles.length === 0 && !domicilesLoading && (
                  <p className="text-sm text-red-600 mt-2">
                    {t('createTask.noDomiciles')} <button type="button" onClick={() => navigate('/create-domicile')} className="text-primary-600 hover:text-primary-700 font-medium">Create one</button>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('createTask.assignTo')}</label>
                <select
                  name="executorId"
                  value={formData.executorId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    {isFetchingUsers ? t('common.loading') : t('createTask.selectUser')}
                  </option>
                  {executors.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.email} ({exec.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('createTask.startDate')}
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />

                <Input
                  label={t('createTask.endDate')}
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Card>

          <div className="flex items-center space-x-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
            >
              {t('createTask.create')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
