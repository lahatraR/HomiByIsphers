import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common';
import { api } from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant. Veuillez utiliser le lien de vérification envoyé par email.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get<{ message: string; email: string }>(`/auth/verify-email/${token}`);
        
        if (response.data?.email) {
          setEmail(response.data.email);
        }
        
        setStatus('success');
        setMessage(response.data?.message || 'Email vérifié avec succès !');
      } catch (error: any) {
        console.error('Email verification error:', error);
        
        const errorMsg = error?.response?.data?.error || 'Une erreur est survenue lors de la vérification.';
        
        // Déterminer s'il s'agit d'une expiration
        if (errorMsg.toLowerCase().includes('expiré') || errorMsg.toLowerCase().includes('invalide')) {
          setStatus('expired');
          setMessage(errorMsg);
        } else {
          setStatus('error');
          setMessage(errorMsg);
        }
      }
    };

    verifyEmail();
  }, [token]);

  // Gérer le countdown et la redirection séparément
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/login', { replace: true });
    }
  }, [status, countdown, navigate]);

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
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-4">Vérification de votre email...</p>
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Veuillez patienter pendant que nous vérifions votre adresse email.</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h2>
              <p className="text-gray-600 mb-6">
                Votre adresse email <span className="font-semibold">{email}</span> a été vérifiée avec succès.
              </p>
              <div className="mb-4 p-4 rounded-lg bg-success-50 border border-success-200">
                <p className="text-success-800 text-sm">
                  Vous pouvez maintenant vous connecter avec vos identifiants.
                </p>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Redirection vers la connexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </p>
              <Button 
                onClick={() => navigate('/login', { replace: true })} 
                variant="primary" 
                size="lg" 
                fullWidth
              >
                Aller à la connexion maintenant
              </Button>
            </div>
          )}

          {/* Error State - Expired */}
          {status === 'expired' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien expiré</h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="mb-4 p-4 rounded-lg bg-warning-50 border border-warning-200">
                <p className="text-warning-800 text-sm mb-3">
                  Les liens de vérification sont valides pendant 24 heures.
                </p>
                <p className="text-warning-800 text-sm">
                  Veuillez demander un nouvel email de vérification pour continuer.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/resend-verification" className="block">
                  <Button variant="primary" size="lg" fullWidth>
                    Renvoyer l'email de vérification
                  </Button>
                </Link>
                <Link to="/login" className="block">
                  <Button variant="secondary" size="lg" fullWidth>
                    Revenir à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Error State - Generic */}
          {status === 'error' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de vérification</h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800 text-sm">
                  Si le problème persiste, veuillez nous contacter ou réessayer plus tard.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/register" className="block">
                  <Button variant="primary" size="lg" fullWidth>
                    Revenir à l'inscription
                  </Button>
                </Link>
                <Link to="/login" className="block">
                  <Button variant="secondary" size="lg" fullWidth>
                    Aller à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Version Info */}
        <div className="text-center mt-4 text-sm text-gray-600">
          Homi © 2026 - All rights reserved
        </div>
      </div>
    </div>
  );
};
