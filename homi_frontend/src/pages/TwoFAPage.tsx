import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface TwoFAStatus {
  enabled: boolean;
  method?: string;
}

export const TwoFAPage: React.FC = () => {
  const [status, setStatus] = useState<TwoFAStatus>({ enabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<TwoFAStatus>('/2fa/');
        setStatus(res.data);
      } catch (err: any) {
        // Default to disabled
        setStatus({ enabled: false });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleEnable = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await api.post<{ qrCode?: string; secret?: string }>('/2fa/enable');
      if (res.data.qrCode) {
        setQrCode(res.data.qrCode);
      } else {
        setStatus({ enabled: true, method: 'totp' });
        setSuccess(t('twofa.enabledSuccess'));
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || t('twofa.enableError'));
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      await api.post('/2fa/verify', { code: verificationCode });
      setStatus({ enabled: true, method: 'totp' });
      setQrCode(null);
      setVerificationCode('');
      setSuccess(t('twofa.enabledSuccess'));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || t('twofa.invalidCode'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm(t('twofa.confirmDisable'))) return;
    setProcessing(true);
    setError(null);
    try {
      await api.post('/2fa/disable');
      setStatus({ enabled: false });
      setSuccess(t('twofa.disabledSuccess'));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || t('twofa.disableError'));
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <MainLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('twofa.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('twofa.subtitle')}</p>
        </div>

        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Status Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${status.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <svg width="28" height="28" fill="none" stroke={status.enabled ? '#16a34a' : '#9ca3af'} strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {status.enabled ? t('twofa.enabled') : t('twofa.disabled')}
              </h2>
              <p className="text-sm text-gray-500">
                {status.enabled
                  ? t('twofa.enabledDesc')
                  : t('twofa.disabledDesc')}
              </p>
            </div>
            <div className={`ml-auto w-4 h-4 rounded-full ${status.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>

          {!qrCode && (
            <Button onClick={status.enabled ? handleDisable : handleEnable} disabled={processing}>
              {processing ? t('twofa.processing') : status.enabled ? t('twofa.disable') : t('twofa.enable')}
            </Button>
          )}
        </Card>

        {/* QR Code Step */}
        {qrCode && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('twofa.setupApp')}</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  {t('twofa.scanQrCode')}
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('twofa.verificationCode')}</label>
                <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
                  placeholder={t('twofa.verificationPlaceholder')}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest" />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleVerify} disabled={processing || verificationCode.length < 6}>
                  {processing ? t('twofa.verifying') : t('twofa.verifyAndEnable')}
                </Button>
                <button onClick={() => { setQrCode(null); setVerificationCode(''); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
              </div>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">{t('twofa.howItWorks')}</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              {t('twofa.step1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              {t('twofa.step2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              {t('twofa.step3')}
            </li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
};
