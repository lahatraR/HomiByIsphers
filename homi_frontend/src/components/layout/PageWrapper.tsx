import React from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { LoadingSpinner } from '../common';

// ─── PageWrapper ───────────────────────────────────────────────────
// Encapsulates the MainLayout + loading state + error banner pattern
// that was duplicated across every single page.
//
// Usage:
//   <PageWrapper isLoading={isLoading} error={error}>
//     <h1>My Page Content</h1>
//   </PageWrapper>

interface PageWrapperProps {
  children: React.ReactNode;
  /** Show a centered spinner instead of children */
  isLoading?: boolean;
  /** Error message to display as a banner above children */
  error?: string | null;
  /** Optional: hide the error banner (e.g. if page handles it differently) */
  hideError?: boolean;
  /** Optional: custom class on the content container */
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  isLoading = false,
  error = null,
  hideError = false,
  className = '',
}) => {
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
      <div className={className}>
        {error && !hideError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {children}
      </div>
    </MainLayout>
  );
};
