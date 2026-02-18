import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button } from '../components/common';
import { useTranslation } from 'react-i18next';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  action?: string;
  link?: string;
}

export const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const steps: OnboardingStep[] = [
    {
      title: t('onboarding.steps.welcome.title'),
      description: t('onboarding.steps.welcome.description'),
      icon: '🏠',
    },
    {
      title: t('onboarding.steps.domicile.title'),
      description: t('onboarding.steps.domicile.description'),
      icon: '🏗️',
      action: t('onboarding.steps.domicile.action'),
      link: '/create-domicile',
    },
    {
      title: t('onboarding.steps.tasks.title'),
      description: t('onboarding.steps.tasks.description'),
      icon: '📋',
      action: t('onboarding.steps.tasks.action'),
      link: '/create-task',
    },
    {
      title: t('onboarding.steps.time.title'),
      description: t('onboarding.steps.time.description'),
      icon: '⏱️',
      action: t('onboarding.steps.time.action'),
      link: '/my-time-logs',
    },
    {
      title: t('onboarding.steps.profile.title'),
      description: t('onboarding.steps.profile.description'),
      icon: '👤',
      action: t('onboarding.steps.profile.action'),
      link: '/profile',
    },
    {
      title: t('onboarding.steps.ready.title'),
      description: t('onboarding.steps.ready.description'),
      icon: '🚀',
      action: t('onboarding.steps.ready.action'),
      link: '/dashboard',
    },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('onboardingCompleted', 'true');
      navigate('/dashboard');
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    navigate('/dashboard');
  };

  const handleAction = () => {
    if (step.link) navigate(step.link);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-2 rounded-full transition-all ${idx <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mb-6">
          {t('onboarding.step', { current: currentStep + 1, total: steps.length })}
        </div>

        {/* Step Content */}
        <Card className="p-8 text-center">
          <div className="text-6xl mb-6">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">{step.description}</p>

          {step.action && step.link && !isLast && (
            <button onClick={handleAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium mb-6">
              {step.action} →
            </button>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {!isFirst && (
                <button onClick={() => setCurrentStep(s => s - 1)}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  ← {t('common.previous')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isLast && (
                <button onClick={handleSkip}
                  className="text-sm text-gray-400 hover:text-gray-600">
                  {t('onboarding.skip')}
                </button>
              )}
              <Button onClick={handleNext}>
                {isLast ? t('onboarding.start') : `${t('common.next')} →`}
              </Button>
            </div>
          </div>
        </Card>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentStep(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}`} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};
