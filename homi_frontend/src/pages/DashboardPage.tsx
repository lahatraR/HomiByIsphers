import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { stats, isLoading, fetchTasks, tasks } = useTaskStore(); //fetchStats  fetchStats();fetchStats,
    
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    console.log('Tasks:', tasks);
    const formatTime = (seconds: number = 0) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
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
            {/* Welcome Section */}
            <section className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, <span className="text-primary-600">{user?.firstName}</span>! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening with your tasks today</p>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Today's Time Card */}
                <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium opacity-90">Today's Time</span>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {formatTime(stats?.todayWorkedTime)}
                    </div>
                    <p className="text-sm opacity-80">Keep up the great work!</p>
                </Card>

                {/* Active Tasks Card */}
                <Card className="p-6 bg-gradient-to-br from-success-500 to-success-700 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium opacity-90">Active Tasks</span>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {stats?.inProgressTasks || 0}
                    </div>
                    <p className="text-sm opacity-80">In progress</p>
                </Card>

                {/* Completed Tasks Card */}
                <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium opacity-90">Completed</span>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {stats?.completedTasks || 0}
                    </div>
                    <p className="text-sm opacity-80">Tasks done</p>
                </Card>

                {/* Pending Tasks Card */}
                <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-medium opacity-90">Pending</span>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {stats?.pendingTasks || 0}
                    </div>
                    <p className="text-sm opacity-80">Awaiting action</p>
                </Card>
            </div>

            {/* Recent Tasks */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>

                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">No tasks yet</p>
                        <p className="text-sm text-gray-500 mt-1">Create your first task to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.slice(0, 5).map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-success-500' :
                                            task.status === 'in_progress' ? 'bg-primary-500' :
                                                'bg-gray-400'
                                        }`}></div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                                        <p className="text-sm text-gray-600">{task.description.substring(0, 60)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </MainLayout>
    );
};
