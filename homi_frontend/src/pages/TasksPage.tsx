import React, { useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { useTaskStore } from '../stores/taskStore';
import { Card, LoadingSpinner } from '../components/common';
import { Link } from 'react-router-dom';

export const TasksPage: React.FC = () => {
  const { tasks, isLoading, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        <Link
          to="/create-task"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + New Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">Create your first task to get started!</p>
            <Link
              to="/create-task"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Create Task
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-success-100 text-success-700' :
                      task.status === 'in_progress' ? 'bg-primary-100 text-primary-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {task.dueTime && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.dueTime}
                      </div>
                    )}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};
