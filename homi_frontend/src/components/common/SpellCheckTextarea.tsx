import React, { type TextareaHTMLAttributes, useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpellCheck } from '../../hooks/useSpellCheck';
import type { SpellCorrection } from '../../utils/spellcheck';

interface SpellCheckTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Current value (controlled) */
  value: string;
  /** Change handler — receives the updated value */
  onValueChange?: (value: string) => void;
  /** Disable spell-check feature */
  disableSpellCheck?: boolean;
}

/** Category badge colors */
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  spelling: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  grammar: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  style: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  typographical: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export const SpellCheckTextarea: React.FC<SpellCheckTextareaProps> = ({
  label,
  error,
  helperText,
  value,
  onValueChange,
  onChange,
  disableSpellCheck = false,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const id = useId();
  const {
    corrections,
    errorCount,
    check,
    correctAll,
    correctOne,
    dismiss,
    currentLang,
    isPending,
  } = useSpellCheck({ disabled: disableSpellCheck });

  // Re-check when value changes
  useEffect(() => {
    check(value);
  }, [value, check]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    },
    [onChange, onValueChange]
  );

  const handleCorrectAll = useCallback(() => {
    const corrected = correctAll(value);
    onValueChange?.(corrected);
  }, [correctAll, value, onValueChange]);

  const handleCorrectOne = useCallback(
    (correction: SpellCorrection) => {
      const corrected = correctOne(value, correction);
      onValueChange?.(corrected);
      // Re-check after a short delay to recalculate positions
      setTimeout(() => check(corrected), 300);
    },
    [correctOne, value, onValueChange, check]
  );

  /** Apply a specific alternative suggestion instead of the primary one */
  const handleApplyAlternative = useCallback(
    (correction: SpellCorrection, alternative: string) => {
      const modified = { ...correction, suggestion: alternative };
      const corrected = correctOne(value, modified);
      onValueChange?.(corrected);
      setTimeout(() => check(corrected), 300);
    },
    [correctOne, value, onValueChange, check]
  );

  const handleDismiss = useCallback(
    (correction: SpellCorrection) => {
      dismiss(correction);
    },
    [dismiss]
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          spellCheck={true}
          lang={currentLang}
          autoCorrect="on"
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : errorCount > 0 ? 'border-amber-400' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {/* Checking indicator */}
        {isPending && (
          <div className="absolute right-2 top-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Spell-check / grammar suggestions panel */}
      {errorCount > 0 && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('spellcheck.errorsFound', { count: errorCount })}
            </span>
            <button
              type="button"
              onClick={handleCorrectAll}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors"
            >
              ✨ {t('spellcheck.correctAll')}
            </button>
          </div>

          <div className="space-y-2">
            {corrections.slice(0, 8).map((correction, index) => (
              <CorrectionCard
                key={`${correction.position}-${index}`}
                correction={correction}
                onApply={() => handleCorrectOne(correction)}
                onApplyAlt={(alt) => handleApplyAlternative(correction, alt)}
                onDismiss={() => handleDismiss(correction)}
              />
            ))}
            {corrections.length > 8 && (
              <span className="text-xs text-amber-600 ml-1">
                +{corrections.length - 8} {t('spellcheck.more')}
              </span>
            )}
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

// ─── CorrectionCard sub-component (enhanced with message & category) ─────────

interface CorrectionCardProps {
  correction: SpellCorrection;
  onApply: () => void;
  onApplyAlt: (alt: string) => void;
  onDismiss: () => void;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction, onApply, onApplyAlt, onDismiss }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const cat = correction.category || 'spelling';
  const colors = categoryColors[cat] || categoryColors.spelling;

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg px-3 py-2 group`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category badge */}
        <span className={`${colors.text} text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} border ${colors.border}`}>
          {t(`spellcheck.category.${cat}`, cat)}
        </span>

        {/* Original → Suggestion */}
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="text-red-500 line-through font-medium">{correction.original}</span>
          <span className="text-gray-400">→</span>
          <button
            type="button"
            onClick={onApply}
            className="text-green-700 font-semibold hover:text-green-900 hover:underline cursor-pointer"
            title={t('spellcheck.applySuggestion')}
          >
            {correction.suggestion}
          </button>
        </span>

        {/* Alternative suggestions */}
        {correction.allSuggestions && correction.allSuggestions.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-gray-500 hover:text-gray-700"
          >
            +{correction.allSuggestions.length - 1}
          </button>
        )}

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          title={t('spellcheck.dismiss')}
        >
          ✕
        </button>
      </div>

      {/* Educational message from LanguageTool */}
      {correction.message && (
        <p className="text-[11px] text-gray-600 mt-1 leading-snug italic">
          💡 {correction.message}
        </p>
      )}

      {/* Expanded alternative suggestions */}
      {expanded && correction.allSuggestions && correction.allSuggestions.length > 1 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {correction.allSuggestions.slice(1).map((alt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApplyAlt(alt)}
              className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              {alt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SpellCheckTextarea.displayName = 'SpellCheckTextarea';
