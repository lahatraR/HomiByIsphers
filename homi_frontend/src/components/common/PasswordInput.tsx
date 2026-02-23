import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { IconEye, IconEyeOff, IconAlertTriangle } from './Icons';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        
        <div className="relative group">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`
              w-full px-3.5 py-2.5 pr-10 border rounded-lg bg-white dark:bg-[#1c1c1e]
              text-surface-900 dark:text-[#f5f5f5] placeholder:text-surface-400 dark:placeholder:text-[#71717a]
              transition-all duration-200 ease-smooth
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
              disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed
              ${error 
                ? 'border-red-400 ring-2 ring-red-500/10 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-surface-300 dark:border-[#48484a] hover:border-surface-400 dark:hover:border-[#636366]'
              }
              ${className}
            `}
            {...props}
          />
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors duration-150 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <IconEyeOff className="w-5 h-5" />
            ) : (
              <IconEye className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <IconAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500">{helperText}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
