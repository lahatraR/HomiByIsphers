import React, { type InputHTMLAttributes, useCallback, useEffect, useId, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpellCheck } from '../../hooks/useSpellCheck';
import type { SpellCorrection } from '../../utils/spellcheck';

interface SpellCheckInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Current value (controlled) */
  value: string;
  /** Change handler — receives the new value */
  onValueChange?: (value: string) => void;
  /** Disable spell-check feature */
  disableSpellCheck?: boolean;
}

/** Category badge colors */
const categoryColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  spelling: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Orth.' },
  grammar: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Gram.' },
  style: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Style' },
  typographical: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Typo' },
};

export const SpellCheckInput: React.FC<SpellCheckInputProps> = ({
  label,
  error,
  helperText,
  value,
  onValueChange,
  onChange,
  disableSpellCheck = false,
  className = '',
  type = 'text',
  ...props
}) => {
  const { t } = useTranslation();
  const id = useId();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Only enable spellcheck for text-type inputs
  const isTextType = ['text', 'search', undefined].includes(type as string);
  const {
    corrections,
    errorCount,
    check,
    correctAll,
    correctOne,
    dismiss,
    currentLang,
    isPending,
  } = useSpellCheck({ disabled: disableSpellCheck || !isTextType });

  useEffect(() => {
    if (isTextType) check(value);
  }, [value, check, isTextType]);

  // Auto-show suggestions when a new correction appears
  useEffect(() => {
    if (errorCount > 0) setShowSuggestions(true);
  }, [errorCount]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    },
    [onChange, onValueChange]
  );

  const handleCorrectAll = useCallback(() => {
    const corrected = correctAll(value);
    onValueChange?.(corrected);
    setShowSuggestions(false);
  }, [correctAll, value, onValueChange]);

  const handleCorrectOne = useCallback(
    (correction: SpellCorrection) => {
      const corrected = correctOne(value, correction);
      onValueChange?.(corrected);
      setTimeout(() => check(corrected), 300);
    },
    [correctOne, value, onValueChange, check]
  );

  /** Apply a specific alternative suggestion */
  const handleApplyAlternative = useCallback(
    (correction: SpellCorrection, alternative: string) => {
      const modified = { ...correction, suggestion: alternative };
      const corrected = correctOne(value, modified);
      onValueChange?.(corrected);
      setTimeout(() => check(corrected), 300);
    },
    [correctOne, value, onValueChange, check]
  );

  return (
    <div className="w-full relative" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => errorCount > 0 && setShowSuggestions(true)}
          spellCheck={isTextType}
          lang={currentLang}
          autoCorrect="on"
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : errorCount > 0 ? 'border-amber-400' : 'border-gray-300'}
            ${errorCount > 0 ? 'pr-16' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Inline indicator badge or spinner */}
        {isPending && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isPending && errorCount > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorCount}
          </button>
        )}
      </div>

      {/* Dropdown suggestions with educational messages */}
      {showSuggestions && errorCount > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-amber-200 rounded-lg shadow-lg p-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-800">
              {t('spellcheck.errorsFound', { count: errorCount })}
            </span>
            <button
              type="button"
              onClick={handleCorrectAll}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors"
            >
              ✨ {t('spellcheck.correctAll')}
            </button>
          </div>
          <div className="space-y-1.5">
            {corrections.slice(0, 5).map((correction, idx) => {
              const cat = correction.category || 'spelling';
              const colors = categoryColors[cat] || categoryColors.spelling;
              return (
                <div
                  key={`${correction.position}-${idx}`}
                  className={`${colors.bg} border ${colors.border} rounded-lg px-2.5 py-1.5 group`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`${colors.text} text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${colors.bg} border ${colors.border}`}>
                      {t(`spellcheck.category.${cat}`, colors.label)}
                    </span>
                    <span className="text-red-500 line-through text-xs">{correction.original}</span>
                    <span className="text-gray-400 text-xs">→</span>
                    <button
                      type="button"
                      onClick={() => handleCorrectOne(correction)}
                      className="text-green-700 font-semibold hover:underline text-xs"
                    >
                      {correction.suggestion}
                    </button>
                    {/* Alternative suggestions inline */}
                    {correction.allSuggestions && correction.allSuggestions.length > 1 && (
                      correction.allSuggestions.slice(1, 3).map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplyAlternative(correction, alt)}
                          className="text-gray-500 hover:text-green-700 hover:underline text-xs"
                        >
                          {alt}
                        </button>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => dismiss(correction)}
                      className="text-gray-400 hover:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {correction.message && (
                    <p className="text-[10px] text-gray-600 mt-0.5 leading-snug italic">
                      💡 {correction.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {helperText && !error && errorCount === 0 && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

SpellCheckInput.displayName = 'SpellCheckInput';
