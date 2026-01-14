import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  gradient = false,
  hover = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-md overflow-hidden
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
        ${hover ? 'hover:shadow-xl transition-shadow duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
