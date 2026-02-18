import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useDomicileStore } from '../stores/domicileStore';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { UserRoles } from '../types';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus } from '../types';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { stats, isLoading: tasksLoading, fetchTasks, tasks } = useTaskStore();
    const { domiciles, isLoading: domicilesLoading, fetchDomiciles } = useDomicileStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const isAdmin = user?.role === UserRoles.ADMIN;
    
    useEffect(() => {
        const loadData = async () => {
            try {
                setError(null);
                await fetchTasks();
                if (isAdmin) {
                    await fetchDomiciles();
                }
            } catch (err: any) {
                setError(err?.message || 'Erreur de chargement des données');
            }
        };
        loadData();
    }, [fetchTasks, fetchDomiciles, isAdmin]);

    if (tasksLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    const getStatusColor = (status: TaskStatus): string => {
        if (status === 'COMPLETED' as TaskStatus) {
            return 'bg-success-500';
        } else if (status === 'IN_PROGRESS' as TaskStatus) {
            return 'bg-primary-500';
        } else if (status === 'TODO' as TaskStatus) {
            return 'bg-gray-400';
        }
        return 'bg-gray-400';
    };

    return (
        <MainLayout>
            {/* Welcome Section */}
            <section className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t('dashboard.welcomeBack', { name: user?.firstName })} 
                            
                        </h1>
                        <p className="text-gray-600">
                            {isAdmin ? t('dashboard.manageDomiciles') : t('dashboard.hereIsWhatsHappening')}
                        </p>
                    </div>
                    
                    {/* Action Buttons (Admin Only) */}
                    {isAdmin && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/create-task')}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                                + {t('dashboard.createTask')}
                            </Button>
                            <Button
                                onClick={() => navigate('/domiciles')}
                                className="bg-success-600 hover:bg-success-700 text-white"
                            >
                                📍 {t('dashboard.manageDomiciles')}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Stats Grid - Only visible to non-admins */}
            {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Today's Time Card */}
                    <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-sm font-medium opacity-90">{t('dashboard.totalTasks')}</span>
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="8 12 11 15 16 9" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold mb-1">
                            {stats?.totalTasks ?? 0}
                        </div>
                        <p className="text-sm opacity-80">{t('dashboard.acrossAllTasks')}</p>
                    </Card>

                    {/* Active Tasks Card */}
                    <Card className="p-6 bg-gradient-to-br from-success-500 to-success-700 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-sm font-medium opacity-90">{t('dashboard.activeTasks')}</span>
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
                        <p className="text-sm opacity-80">{t('dashboard.inProgress')}</p>
                    </Card>

                    {/* Completed Tasks Card */}
                    <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-sm font-medium opacity-90">{t('dashboard.completed')}</span>
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
                        <p className="text-sm opacity-80">{t('dashboard.tasksDone')}</p>
                    </Card>

                    {/* Pending Tasks Card */}
                    <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-sm font-medium opacity-90">{t('dashboard.pending')}</span>
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
                        <p className="text-sm opacity-80">{t('dashboard.awaitingAction')}</p>
                    </Card>
                </div>
            )}

            {/* Recent Tasks */}
            <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {isAdmin ? t('dashboard.allTasks') : t('dashboard.recentTasks')}
                </h2>

                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">{t('dashboard.noTasksYet')}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {isAdmin ? t('dashboard.createFirstTask') : t('dashboard.noTasksAssigned')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(isAdmin ? tasks : tasks.slice(0, 5)).map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                                        <p className="text-sm text-gray-600">{task.description.substring(0, 60)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                    <span>{task.status}</span>
                                    <span className="text-xs text-gray-500">{t('dashboard.executor')}: {task.assignedTo?.email ?? 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Domiciles Section (Admin Only) */}
            {isAdmin && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">📍 {t('dashboard.recentDomiciles')}</h2>
                        <Button
                            onClick={() => navigate('/domiciles')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            {t('dashboard.viewAll')} →
                        </Button>
                    </div>

                    {domicilesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : domiciles.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2.423 3.482A6.967 6.967 0 0012 18.75c5.523 0 10-4.477 10-10S17.523 2 12 2c-3.97 0-7.431 2.325-9.127 5.672M9 9h.008v.008H9V9m4 0h.008v.008H13V9m4 0h.008v.008H17V9" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-2">{t('dashboard.noDomicilesYet')}</p>
                            <Button
                                onClick={() => navigate('/create-domicile')}
                                className="bg-primary-600 hover:bg-primary-700 text-white text-sm mx-auto"
                            >
                                {t('dashboard.createFirstDomicile')}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {domiciles.slice(0, 3).map(domicile => (
                                <div key={domicile.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <h3 className="font-semibold text-gray-900 mb-1">{domicile.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">📍 {domicile.address}</p>
                                    <p className="text-xs text-gray-500">{domicile.city}, {domicile.postalCode}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </MainLayout>
    );
};
