import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button, Input, PasswordInput } from '../components/common';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      // Error is handled by the store
      console.error('Login failed:', error);
      
      // Afficher un message spécifique si email non vérifié
      if (error?.response?.status === 403 || error?.message?.includes('vérifier')) {
        // Le message d'erreur sera affiché par le store
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-success-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo Section */}
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
                  <linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#15803d', stopOpacity: 1 }} />
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
                <circle cx="140" cy="60" r="32" fill="url(#check-gradient)" />
                <circle cx="140" cy="60" r="32" stroke="#15803d" strokeWidth="2.5" fill="none" />
                <path 
                  d="M128 60L136 68L154 52" 
                  stroke="white" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Homi</h1>
            <p className="text-gray-600 mt-2">Welcome back! Please sign in to continue.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes('vérifier') && (
                <p className="text-red-600 text-sm mt-2">
                  Pas reçu l'email?{' '}
                  <Link to="/resend-verification" className="font-medium underline">
                    Renvoyer le lien
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Loading Info Message */}
          {isLoading && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-blue-700 text-sm">
                ⏳ Connexion en cours... Le serveur peut prendre 30-60 secondes lors de la première connexion.
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-4 text-sm text-gray-600">
          Homi © 2026 - All rights reserved
        </div>
      </div>
    </div>
  );
};
