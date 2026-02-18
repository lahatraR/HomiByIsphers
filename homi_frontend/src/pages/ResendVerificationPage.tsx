import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/common';
import { api } from '../services/api';

export const ResendVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
      setMessage(response.data?.message || 'Email de vérification envoyé !');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-success-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-20 h-20" 
                viewBox="0 0 200 200" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  d="M100 30L40 80V170H80V130H120V170H160V80L100 30Z" 
                  fill="url(#logo-gradient)" 
                  stroke="#1e40af" 
                  strokeWidth="3" 
                  strokeLinejoin="round" 
                />
                <rect x="85" y="95" width="30" height="25" rx="3" fill="#60a5fa" opacity="0.8" />
                <rect x="90" y="145" width="20" height="25" rx="3" fill="#1e40af" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.resendTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('auth.resendSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 rounded-lg bg-success-50 border border-success-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-success-800 font-medium text-sm">{message}</p>
                  <p className="text-success-700 text-sm mt-1">{t('auth.checkInbox')}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || !!message}
            >
              {message ? t('auth.emailSent') : t('auth.send')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.backToLoginLink')}
            </Link>
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-600">
          {t('auth.allRightsReserved')}
        </div>
      </div>
    </div>
  );
};
