import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button, IconPackage, IconInfo, IconCheck, IconCheckCircle } from '../components/common';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface ExportResult {
  url?: string;
  stats?: {
    tasks: number;
    timeLogs: number;
    favorites: number;
    notifications: number;
    activities: number;
  };
}

export const ExportDataPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<ExportResult>('/export/');
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || t('export.errorExporting'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('export.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('export.subtitle')}</p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><IconPackage className="w-7 h-7 text-blue-600" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{t('export.fullExport')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('export.fullExportDesc')}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-600" /> {t('export.includes.profile')}</li>
                <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-600" /> {t('export.includes.tasks')}</li>
                <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-600" /> {t('export.includes.timeLogs')}</li>
                <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-600" /> {t('export.includes.favorites')}</li>
                <li className="flex items-center gap-2"><IconCheck className="w-4 h-4 text-green-600" /> {t('export.includes.activity')}</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            {!result ? (
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" /> {t('export.exporting')}
                  </span>
                ) : t('export.startExport')}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <IconCheckCircle className="w-5 h-5" />
                  {t('export.exportDone')}
                </div>

                {result.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(result.stats).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        tasks: t('export.stats.tasks'),
                        timeLogs: t('export.stats.timeLogs'),
                        favorites: t('export.stats.favorites'),
                        notifications: t('export.stats.notifications'),
                        activities: t('export.stats.activities'),
                      };
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-500">{labels[key] || key}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {result.url && (
                  <Button onClick={handleDownload}>
                    {t('export.download')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <IconInfo className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>{t('export.gdprNotice')} :</strong> {t('export.gdprText')}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
