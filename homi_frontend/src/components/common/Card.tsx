import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  gradient = false,
  hover = false,
  padding = 'none',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl border border-surface-200/60 overflow-hidden
        shadow-card
        ${gradient ? 'bg-gradient-to-br from-white to-surface-50' : ''}
        ${hover ? 'hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-250 ease-smooth cursor-pointer active:translate-y-0 active:shadow-card' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
