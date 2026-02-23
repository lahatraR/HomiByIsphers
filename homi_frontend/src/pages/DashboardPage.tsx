import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useDomicileStore } from '../stores/domicileStore';
import { UserRoles } from '../types';
// ── Shared components (new architecture) ──
import { PageWrapper } from '../components/layout';
import { EmptyState } from '../components/feedback';
import { StatusDot } from '../components/feedback';
import { StatsCard, StatsGrid } from '../components/data-display';
import { Card, Button, LoadingSpinner, IconMapPin, IconHome, IconCheckCircle, IconEdit, IconClock, IconClipboard } from '../components/common';
import { getUserDisplayName } from '../utils/format';

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
                if (isAdmin) await fetchDomiciles();
            } catch (err: any) {
                setError(err?.message || t('common.error'));
            }
        };
        loadData();
    }, [fetchTasks, fetchDomiciles, isAdmin]);

    return (
        <PageWrapper isLoading={tasksLoading} error={error}>
            {/* Welcome Section */}
            <section className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight mb-1">
                            {t('dashboard.welcomeBack', { name: user?.firstName })}
                        </h1>
                        <p className="text-surface-500">
                            {isAdmin ? t('dashboard.manageDomiciles') : t('dashboard.hereIsWhatsHappening')}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-3">
                            <Button onClick={() => navigate('/create-task')} className="bg-primary-600 hover:bg-primary-700 text-white">
                                + {t('dashboard.createTask')}
                            </Button>
                            <Button onClick={() => navigate('/domiciles')} className="bg-success-600 hover:bg-success-700 text-white">
                                <span className="inline-flex items-center gap-1"><IconMapPin className="w-4 h-4" /> {t('dashboard.manageDomiciles')}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Grid — uses shared StatsCard + StatsGrid components */}
            {!isAdmin && (
                <StatsGrid columns={4} className="mb-8">
                    <StatsCard
                        label={t('dashboard.totalTasks')}
                        value={stats?.totalTasks ?? 0}
                        icon={<IconCheckCircle />}
                        gradient="from-primary-500 to-primary-700"
                        subtitle={t('dashboard.acrossAllTasks')}
                    />
                    <StatsCard
                        label={t('dashboard.activeTasks')}
                        value={stats?.inProgressTasks || 0}
                        icon={<IconEdit />}
                        gradient="from-success-500 to-success-700"
                        subtitle={t('dashboard.inProgress')}
                    />
                    <StatsCard
                        label={t('dashboard.completed')}
                        value={stats?.completedTasks || 0}
                        icon={<IconCheckCircle className="w-6 h-6" />}
                        gradient="from-purple-500 to-purple-700"
                        subtitle={t('dashboard.tasksDone')}
                    />
                    <StatsCard
                        label={t('dashboard.pending')}
                        value={stats?.pendingTasks || 0}
                        icon={<IconClock />}
                        gradient="from-orange-500 to-orange-700"
                        subtitle={t('dashboard.awaitingAction')}
                    />
                </StatsGrid>
            )}

            {/* Recent Tasks */}
            <Card className="p-5 sm:p-6 mb-8">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">
                    {isAdmin ? t('dashboard.allTasks') : t('dashboard.recentTasks')}
                </h2>

                {tasks.length === 0 ? (
                    <EmptyState
                        icon={<IconClipboard className="w-14 h-14" />}
                        title={t('dashboard.noTasksYet')}
                        description={isAdmin ? t('dashboard.createFirstTask') : t('dashboard.noTasksAssigned')}
                    />
                ) : (
                    <div className="space-y-3">
                        {(isAdmin ? tasks : tasks.slice(0, 5)).map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all duration-150 cursor-pointer group"
                            >
                                <div className="flex items-center space-x-3">
                                    <StatusDot status={task.status} />
                                    <div>
                                        <h3 className="font-medium text-surface-900 group-hover:text-primary-600 transition-colors">{task.title}</h3>
                                        <p className="text-sm text-surface-500">{task.description.substring(0, 60)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-surface-500">
                                    <span>{task.status}</span>
                                    <span className="text-xs text-surface-400">
                                        {t('dashboard.executor')}: {getUserDisplayName(task.assignedTo ?? {}, t('tasks.notAssigned'))}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Domiciles Section (Admin Only) */}
            {isAdmin && (
                <Card className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2"><IconMapPin className="w-5 h-5 text-primary-600" /> {t('dashboard.recentDomiciles')}</h2>
                        <Button onClick={() => navigate('/domiciles')} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            {t('dashboard.viewAll')} →
                        </Button>
                    </div>

                    {domicilesLoading ? (
                        <div className="flex items-center justify-center py-8"><LoadingSpinner size="sm" /></div>
                    ) : domiciles.length === 0 ? (
                        <EmptyState
                            icon={<IconHome className="w-10 h-10 text-gray-400" />}
                            title={t('dashboard.noDomicilesYet')}
                            action={{ label: t('dashboard.createFirstDomicile'), onClick: () => navigate('/create-domicile') }}
                            className="bg-surface-50 rounded-xl"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {domiciles.slice(0, 3).map(domicile => (
                                <div key={domicile.id} className="p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all duration-150 border border-transparent hover:border-surface-200">
                                    <h3 className="font-semibold text-surface-900 mb-1">{domicile.name}</h3>
                                    <p className="text-sm text-surface-600 mb-1 flex items-center gap-1"><IconMapPin className="w-4 h-4" /> {domicile.address}</p>
                                    <p className="text-xs text-surface-400">{domicile.city}, {domicile.postalCode}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </PageWrapper>
    );
};
