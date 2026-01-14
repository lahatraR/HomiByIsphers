import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { Card, LoadingSpinner, Button } from '../components/common';
import { Link, useNavigate } from 'react-router-dom';
import { UserRoles } from '../types';
import api from '../services/api';

export const TasksPage: React.FC = () => {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === UserRoles.ADMIN;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const myTasks = tasks.filter(task => task.assignedTo?.id === user?.id);
  const displayTasks = isAdmin ? tasks : myTasks;

  const handleStartTimer = async (task: any) => {
    setError(null);
    try {
      // Vérifier que l'utilisateur est un exécuteur autorisé
      const response = await api.get(`/domiciles/${task.domicile.id}/executors`);
      const executors = response.data;
     
      const isAuthorized = executors.some((executor: any) => executor.id === user?.id);
      
      if (!isAuthorized) {
        setError('You are not authorized to execute tasks for this domicile. Please contact the administrator.');
        return;
      }

      // Naviguer vers la page timer
      navigate(`/tasks/${task.id}/timer`, { state: { task } });
    } catch (err) {
      console.error('Failed to verify executor status', err);
      setError('Failed to start timer. Please try again.');
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
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage all tasks' : 'Manage and track your assigned tasks'}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/create-task"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + New Task
          </Link>
        )}
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </Card>
      )}

      {displayTasks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">
              {isAdmin ? 'Create your first task to get started!' : 'No tasks assigned to you yet'}
            </p>
            {isAdmin && (
              <Link
                to="/create-task"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Task
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
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="space-y-2">
                    {/* Dates prévues */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium mr-1">Planned:</span>
                        {task.startTime ? new Date(task.startTime).toLocaleString() : 'No start date'}
                      </div>
                      {task.endTime && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(task.endTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Dates réelles pour les tâches complétées */}
                    {task.status === 'COMPLETED' && (task.actualStartTime || task.actualEndTime) && (
                      <div className="flex items-center space-x-4 text-sm text-success-700">
                        {task.actualStartTime && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium mr-1">Started:</span>
                            {new Date(task.actualStartTime).toLocaleString()}
                          </div>
                        )}
                        {task.actualEndTime && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium mr-1">Completed:</span>
                            {new Date(task.actualEndTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {task.domicile && (
                    <div className="mt-2 text-sm text-gray-500">
                      📍 {task.domicile.name} - {task.domicile.address}
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
                      ⏱️ Start Timer
                    </Button>
                  )}
                  {isAdmin && (
                    <span className="text-xs text-gray-500">Executor: {task.assignedTo?.email ?? 'N/A'}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};
