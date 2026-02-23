import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, PasswordInput } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { UserRoles } from '../types';
import { useTranslation } from 'react-i18next';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const { t } = useTranslation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRoles.USER,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Submit registration form:', {
      ...formData,
      password: '***hidden***'
    });

    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.role,
        formData.firstName,
        formData.lastName
      ) as unknown as { message: string; email: string };
      
      console.log('✅ Registration response received:', response);
      // Afficher le message de succès
      setSuccessMessage(response?.message || 'Inscription réussie ! Vérifiez votre email.');
    } catch (err) {
      console.error('❌ Registration failed in component:', err);
    }
  };

  // Gérer le countdown séparément
  useEffect(() => {
    if (successMessage && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (successMessage && countdown === 0) {
      navigate('/login', { replace: true });
    }
  }, [successMessage, countdown, navigate]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary-50 to-success-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.register')}</h1>
            <p className="text-gray-600 mt-2">{t('auth.registerSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-success-50 border border-success-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-success-800 font-medium text-sm">{successMessage}</p>
                  <p className="text-success-600 text-xs mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Redirection vers la connexion dans {countdown} secondes...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.firstName')}
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
                autoComplete="given-name"
              />

              <Input
                label={t('auth.lastName')}
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
                autoComplete="family-name"
              />
            </div>

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

            <PasswordInput
              label={t('auth.password')}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.role')}
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value={UserRoles.USER}>{t('auth.roleAgent')}</option>
                <option value={UserRoles.ADMIN}>{t('auth.roleOwner')}</option>
              </select>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              fullWidth 
              isLoading={isLoading}
              disabled={isLoading || !!successMessage}
            >
              {successMessage ? t('auth.registrationSuccess') : t('auth.signUp')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('auth.signInLink')}
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
