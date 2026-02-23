import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, PasswordInput } from '../components/common';
import { api } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    lastName: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!formData.email || !formData.lastName || !formData.newPassword || !formData.confirmPassword) {
      setError(t('invoices.validationError'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    if (formData.newPassword.length < 8) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', {
        email: formData.email,
        lastName: formData.lastName,
        newPassword: formData.newPassword,
      });
      setSuccess(response.data.message || t('auth.resetSuccess'));
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('auth.resetError');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 dark:from-[#111113] dark:via-[#111113] dark:to-[#111113] p-4 overflow-y-auto">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-surface-200/60 dark:border-[#3a3a3c] p-8 sm:p-10 shadow-float">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className="text-surface-500 mt-2 text-sm">
              {t('auth.forgotPasswordSubtitle')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200/80">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200/80">
              <p className="text-green-700 text-sm font-medium">{success}</p>
              <p className="text-green-600 text-xs mt-1">
                {t('auth.redirecting', { seconds: 3 })}
              </p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.email')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <div>
                <Input
                  label={t('auth.lastNameVerification')}
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('auth.securityQuestionHint')}
                  required
                  autoComplete="family-name"
                />
                <p className="text-xs text-surface-400 mt-1">
                  {t('auth.securityQuestionHint')}
                </p>
              </div>

              <PasswordInput
                label={t('auth.newPassword')}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                helperText="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
              />

              <PasswordInput
                label={t('auth.confirmNewPassword')}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                {isLoading ? t('auth.resetting') : t('auth.resetPassword')}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-surface-500">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-surface-400">
          {t('auth.allRightsReserved')}
        </div>
      </div>
    </div>
  );
};
