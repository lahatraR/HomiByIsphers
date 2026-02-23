import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../layouts/MainLayout';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { Card, LoadingSpinner, Button, SpellCheckTextarea, IconMapPin, IconStar, IconHourglass, IconCheckCircle, IconXCircle, IconClipboard, IconCalendar, IconClock, IconCheck } from '../components/common';
import { Link, useNavigate } from 'react-router-dom';
import { UserRoles } from '../types';
import { taskReviewService } from '../services/taskReview.service';

export const TasksPage: React.FC = () => {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = user?.role === UserRoles.ADMIN;
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [reviewingTaskId, setReviewingTaskId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedTasks, setReviewedTasks] = useState<Record<number, number>>({}); // taskId → rating

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Load existing reviews for completed tasks
  useEffect(() => {
    if (!isAdmin || tasks.length === 0) return;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    completedTasks.forEach(async (task) => {
      try {
        const review = await taskReviewService.getByTask(task.id);
        if (review) {
          setReviewedTasks(prev => ({ ...prev, [task.id]: review.rating }));
        }
      } catch {
        // no review exists, that's ok
      }
    });
  }, [tasks, isAdmin]);

  const handleSubmitReview = async (taskId: number) => {
    setReviewSubmitting(true);
    try {
      await taskReviewService.create({ taskId, rating: reviewRating, comment: reviewComment || undefined });
      setReviewedTasks(prev => ({ ...prev, [taskId]: reviewRating }));
      setReviewingTaskId(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la notation');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const myTasks = tasks.filter(task => task.assignedTo?.id === user?.id);
  const displayTasks = isAdmin ? tasks : myTasks;

  const handleStartTimer = async (task: any) => {
    setError(null);
    try {
      // Si l'utilisateur est assigné à la tâche, il est autorisé
      if (task.assignedTo?.id !== user?.id) {
        setError(t('tasks.notAuthorized'));
        return;
      }

      // Naviguer vers la page timer
      navigate(`/tasks/${task.id}/timer`, { state: { task } });
    } catch (err) {
      console.error('Failed to verify executor status', err);
      setError(t('tasks.failedStartTimer'));
    }
  };

  if (isLoading) {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? t('tasks.titleAdmin') : t('tasks.title')}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? t('tasks.subtitleAdmin') : t('tasks.subtitle')}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/create-task"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {t('tasks.createNew')}
          </Link>
        )}
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <IconXCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </Card>
      )}

      {displayTasks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <IconClipboard className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('tasks.noTasks')}</h3>
            <p className="text-gray-600 mb-4">
              {isAdmin ? t('tasks.noTasksDesc') : t('tasks.noTasksAssignedDesc')}
            </p>
            {isAdmin && (
              <Link
                to="/create-task"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t('tasks.createTask')}
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayTasks.map((task) => (
            <Card key={task.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'COMPLETED' ? 'bg-success-100 text-success-700' :
                      task.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'COMPLETED' ? t('tasks.statusCompleted') : task.status === 'IN_PROGRESS' ? t('tasks.statusInProgress') : t('tasks.statusTodo')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="space-y-2">
                    {/* Dates prévues */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <IconCalendar className="w-4 h-4 mr-1" />
                        <span className="font-medium mr-1">{t('tasks.planned')}</span>
                        {task.startTime ? new Date(task.startTime).toLocaleString() : t('tasks.noStartDate')}
                      </div>
                      {task.endTime && (
                        <div className="flex items-center">
                          <IconClock className="w-4 h-4 mr-1" />
                          {new Date(task.endTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Dates réelles pour les tâches complétées */}
                    {task.status === 'COMPLETED' && (task.actualStartTime || task.actualEndTime) && (
                      <div className="flex items-center space-x-4 text-sm text-success-700">
                        {task.actualStartTime && (
                          <div className="flex items-center">
                            <IconCheck className="w-4 h-4 mr-1" />
                            <span className="font-medium mr-1">Started:</span>
                            {new Date(task.actualStartTime).toLocaleString()}
                          </div>
                        )}
                        {task.actualEndTime && (
                          <div className="flex items-center">
                            <IconCheckCircle className="w-4 h-4 mr-1" />
                            <span className="font-medium mr-1">Completed:</span>
                            {new Date(task.actualEndTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {task.domicile && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <IconMapPin className="w-4 h-4" /> {task.domicile.name} - {task.domicile.address}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {/* Bouton Timer pour les users uniquement */}
                  {!isAdmin && 
                    task.assignedTo?.id === user?.id && 
                    (task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStartTimer(task)}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      {t('tasks.startTimer')}
                    </Button>
                  )}
                  {isAdmin && (
                    <span className="text-xs text-gray-500">{t('dashboard.executor', 'Exécuteur')}: {task.assignedTo?.firstName && task.assignedTo?.lastName ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : (task.assignedTo?.firstName || t('tasks.notAssigned'))}</span>
                  )}
                  {/* Review button for admin on completed tasks */}
                  {isAdmin && task.status === 'COMPLETED' && !reviewedTasks[task.id] && (
                    <Button
                      size="sm"
                      onClick={() => { setReviewingTaskId(task.id); setReviewRating(5); setReviewComment(''); }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                    >
                      <IconStar className="w-4 h-4 inline" /> Noter
                    </Button>
                  )}
                  {/* Show existing rating */}
                  {reviewedTasks[task.id] && (
                    <span className="text-yellow-500 font-medium text-sm">
                      {'★'.repeat(reviewedTasks[task.id])}{'☆'.repeat(5 - reviewedTasks[task.id])}
                    </span>
                  )}
                </div>
              </div>
              {/* Inline review form */}
              {reviewingTaskId === task.id && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notez cette tâche</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <SpellCheckTextarea
                    value={reviewComment}
                    onValueChange={val => setReviewComment(val)}
                    placeholder="Commentaire (optionnel)..."
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReview(task.id)}
                      disabled={reviewSubmitting}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                    >
                      {reviewSubmitting ? <><IconHourglass className="w-4 h-4 inline" />...</> : <><IconCheckCircle className="w-4 h-4 inline" /> Enregistrer</>}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setReviewingTaskId(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};
