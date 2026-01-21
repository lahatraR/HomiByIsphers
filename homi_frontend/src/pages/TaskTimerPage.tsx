import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { submitTimeLog } from '../services/timeTracking.service';

export const TaskTimerPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, isLoading, fetchTasks, startTask, completeTask } = useTaskStore();
  const { user } = useAuthStore();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [taskStarted, setTaskStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const task = tasks.find(t => t.id === Number(taskId));

  // Empêcher les utilisateurs de quitter la page avec la navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTimerRunning || taskStarted) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTimerRunning, taskStarted]);

  // Vérifier que l'utilisateur accède bien à sa tâche
  useEffect(() => {
    if (!task && !isLoading) {
      fetchTasks();
    }
  }, [task, isLoading, fetchTasks]);

  // Timer principal
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Démarrer la tâche
  useEffect(() => {
    const initializeTask = async () => {
      if (task && !taskStarted && task.status === 'TODO') {
        try {
          await startTask(task.id);
          setTaskStarted(true);
        } catch (error: any) {
          setSubmitError(error?.message || 'Impossible de démarrer la tâche');
        }
      }
    };

    initializeTask();
  }, [task, taskStarted, startTask]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCompleteTask = async () => {
    if (window.confirm('Mark this task as completed?')) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        // Créer les timestamps pour le log de temps
        const taskStartDate = new Date();
        const taskEndDate = new Date(taskStartDate.getTime() + (timerSeconds * 1000));

        // Soumettre le log de temps
        await submitTimeLog(task!.id, taskStartDate, taskEndDate);

        // Marquer la tâche comme complétée
        await completeTask(task!.id);
        setIsTimerRunning(false);

        // Afficher un message de succès et rediriger
        setTimeout(() => {
          navigate('/tasks');
        }, 2000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit time log';
        setSubmitError(errorMessage);
        console.error('Failed to complete task', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelTask = () => {
    if (window.confirm('Cancel this task? Progress will be lost.')) {
      setIsTimerRunning(false);
      navigate('/tasks');
    }
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  if (isLoading || !task) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // Vérifier que l'utilisateur accède à sa propre tâche
  if (task.assignedTo?.id !== user?.id) {
    return (
      <MainLayout>
        <Card className="p-8 max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You can only access tasks assigned to you.</p>
          <Button onClick={() => navigate('/tasks')} className="bg-primary-600 hover:bg-primary-700 text-white">
            Return to Tasks
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{task.title}</h1>
          <p className="text-gray-600">{task.description}</p>
        </Card>

        {/* Error Message */}
        {submitError && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{submitError}</p>
          </Card>
        )}

        {/* Timer Section */}
        <Card className="p-12 mb-6 text-center">
          <p className="text-gray-600 text-lg mb-4">Time Elapsed</p>
          <div className="mb-8">
            <p className="text-7xl font-bold text-primary-600 font-mono">
              {formatTime(timerSeconds)}
            </p>
          </div>

          {/* Timer Status */}
          <div className="mb-8">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              isTimerRunning
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isTimerRunning ? '⏱️ Timer Running' : '⏸️ Timer Paused'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={handleToggleTimer}
              className={`${
                isTimerRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isTimerRunning ? '⏸️ Pause' : '▶️ Resume'}
            </Button>

            <Button
              onClick={handleCompleteTask}
              disabled={!isTimerRunning && timerSeconds === 0 || isSubmitting}
              className="bg-success-600 hover:bg-success-700 text-white"
            >
              {isSubmitting ? '⏳ Submitting...' : '✅ Complete Task'}
            </Button>

            <Button
              onClick={handleCancelTask}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ❌ Cancel Task
            </Button>
          </div>
        </Card>

        {/* Task Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Task Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Domicile</p>
              <p className="text-lg font-medium text-gray-900">
                {task.domicile?.name} - {task.domicile?.address}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'COMPLETED' ? 'bg-success-100 text-success-700' :
                task.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Planned Duration</p>
              {task.startTime && task.endTime ? (
                <p className="text-lg font-medium text-gray-900">
                  {new Date(task.startTime).toLocaleString()} - {new Date(task.endTime).toLocaleString()}
                </p>
              ) : (
                <p className="text-gray-500">No duration specified</p>
              )}
            </div>
          </div>
        </Card>

        {/* Warning */}
        {(isTimerRunning || taskStarted) && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ You cannot leave this page until you complete or cancel the task.
            </p>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ Error: {submitError}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
