import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import { useDomicileStore } from '../stores/domicileStore';
import { useTranslation } from 'react-i18next';

export const DomicilesPage: React.FC = () => {
    const navigate = useNavigate();
    const { domiciles, isLoading, error, fetchDomiciles, deleteDomicile } = useDomicileStore();
    const { t } = useTranslation();

    useEffect(() => {
        fetchDomiciles();
    }, [fetchDomiciles]);

    const handleDelete = async (id: number) => {
        if (window.confirm(t('domiciles.confirmDeleteDomicile'))) {
            try {
                await deleteDomicile(id);
            } catch (err) {
                console.error('Failed to delete domicile', err);
            }
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
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('domiciles.title')}</h1>
                        <p className="text-gray-600">{t('domiciles.subtitle')}</p>
                    </div>
                    <Button
                        onClick={() => navigate('/create-domicile')}
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                        {t('domiciles.createNew')}
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="p-4 mb-6 bg-red-50 border border-red-200">
                    <p className="text-red-800">{error}</p>
                </Card>
            )}

            {domiciles.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2.423 3.482A6.967 6.967 0 0012 18.75c5.523 0 10-4.477 10-10S17.523 2 12 2c-3.97 0-7.431 2.325-9.127 5.672M9 9h.008v.008H9V9m4 0h.008v.008H13V9m4 0h.008v.008H17V9" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('domiciles.noDomiciles')}</h3>
                    <p className="text-gray-600 mb-6">{t('domiciles.noDomicilesDesc')}</p>
                    <Button
                        onClick={() => navigate('/create-domicile')}
                        className="bg-primary-600 hover:bg-primary-700 text-white mx-auto"
                    >
                        {t('domiciles.createNew')}
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {domiciles.map(domicile => (
                        <Card key={domicile.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{domicile.name}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>📍 {domicile.address}</p>
                                    <p>🏙️ {domicile.city}, {domicile.postalCode}</p>
                                </div>
                            </div>

                            {domicile.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{domicile.description}</p>
                            )}

                            <div className="pt-4 border-t border-gray-200 mt-4">
                                <p className="text-xs text-gray-500 mb-4">
                                    Created by {domicile.createdBy.firstName} {domicile.createdBy.lastName}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => navigate(`/domiciles/${domicile.id}`)}
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm"
                                    >
                                        View
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(domicile.id)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};