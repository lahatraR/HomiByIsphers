import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  spellCheckAsync,
  applyCorrections,
  applySingleCorrection,
  countWords,
  type SpellCorrection,
} from '../utils/spellcheck';

interface UseSpellCheckOptions {
  /** Override language (defaults to i18n current language) */
  lang?: string;
  /** Debounce delay in ms for fallback timer (default: 1200) */
  debounce?: number;
  /** Disable spell checking */
  disabled?: boolean;
}

interface UseSpellCheckReturn {
  /** Current list of detected corrections */
  corrections: SpellCorrection[];
  /** Number of errors found */
  errorCount: number;
  /** Check text — call on every change, triggers on word boundaries */
  check: (text: string) => void;
  /** Apply all corrections at once, returns corrected text */
  correctAll: (text: string) => string;
  /** Apply a single correction, returns corrected text */
  correctOne: (text: string, correction: SpellCorrection) => string;
  /** Dismiss a single correction (ignore it) */
  dismiss: (correction: SpellCorrection) => void;
  /** Current language being used for checking */
  currentLang: string;
  /** Whether a check is pending (API call in flight) */
  isPending: boolean;
}

/** Characters that signal a word just ended */
const WORD_BOUNDARY_CHARS = /[\s,;.!?:()[\]{}\-\n\r\t'"»«]/;

/** Minimum number of words before we send to the API */
const MIN_WORDS_FOR_CHECK = 2;

/**
 * React hook for real-time multi-language spell & grammar checking.
 * Uses the LanguageTool API for comprehensive checking.
 *
 * Context-aware: waits until the user has typed at least 2 words so the API
 * can understand sentence intent ("Netoyer la cuisine" → "Nettoyer", not "n'étayer").
 */
export function useSpellCheck(options: UseSpellCheckOptions = {}): UseSpellCheckReturn {
  const { i18n } = useTranslation();
  const lang = options.lang || i18n.language || 'fr';
  const debounceMs = options.debounce ?? 1200;
  const disabled = options.disabled ?? false;

  const [corrections, setCorrections] = useState<SpellCorrection[]>([]);
  const [isPending, setIsPending] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTextRef = useRef<string>('');
  /** Incremented on each check request so stale responses are ignored */
  const checkIdRef = useRef(0);

  // Clear corrections when language changes
  useEffect(() => {
    setCorrections([]);
    dismissedRef.current.clear();
  }, [lang]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** Run the async spell / grammar check via LanguageTool */
  const runCheck = useCallback(
    async (text: string) => {
      if (!text || text.trim().length < 2) {
        setCorrections([]);
        setIsPending(false);
        return;
      }

      const id = ++checkIdRef.current;
      setIsPending(true);

      try {
        const results = await spellCheckAsync(text, lang);

        // Only apply if this is still the latest request
        if (id !== checkIdRef.current) return;

        const filtered = results.filter(
          (c) => !dismissedRef.current.has(`${c.original}:${c.position}`)
        );
        setCorrections(filtered);
      } catch {
        // Silently ignore — network errors handled inside spellCheckAsync
      } finally {
        if (id === checkIdRef.current) setIsPending(false);
      }
    },
    [lang]
  );

  const check = useCallback(
    (text: string) => {
      if (disabled) {
        setCorrections([]);
        return;
      }

      // Clear any pending fallback timer
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!text || text.trim().length < 2) {
        setCorrections([]);
        setIsPending(false);
        prevTextRef.current = text;
        return;
      }

      // Detect if the user just typed a word boundary character
      const prev = prevTextRef.current;
      const isNewCharBoundary =
        text.length > prev.length &&
        text.length > 0 &&
        WORD_BOUNDARY_CHARS.test(text[text.length - 1]);

      prevTextRef.current = text;

      const words = countWords(text);

      if (words < MIN_WORDS_FOR_CHECK) {
        // Not enough context yet — wait for more words.
        // Still show pending so user knows we'll check later.
        setIsPending(true);
        timerRef.current = setTimeout(() => {
          // Re-check after debounce in case user stopped typing
          void runCheck(text);
        }, debounceMs * 1.5);
      } else if (isNewCharBoundary) {
        // Enough context + word just completed → check immediately (async)
        void runCheck(text);
      } else {
        // Still typing → set fallback debounce timer
        setIsPending(true);
        timerRef.current = setTimeout(() => {
          void runCheck(text);
        }, debounceMs);
      }
    },
    [lang, debounceMs, disabled, runCheck]
  );

  const correctAll = useCallback(
    (text: string): string => {
      const corrected = applyCorrections(text, corrections);
      setCorrections([]);
      dismissedRef.current.clear();
      return corrected;
    },
    [corrections]
  );

  const correctOne = useCallback(
    (text: string, correction: SpellCorrection): string => {
      const corrected = applySingleCorrection(text, correction);
      // Remove the applied correction; positions may shift so we re-check
      setCorrections((prev) => prev.filter((c) => c.position !== correction.position));
      return corrected;
    },
    []
  );

  const dismiss = useCallback((correction: SpellCorrection) => {
    dismissedRef.current.add(`${correction.original}:${correction.position}`);
    setCorrections((prev) =>
      prev.filter((c) => !(c.original === correction.original && c.position === correction.position))
    );
  }, []);

  return {
    corrections,
    errorCount: corrections.length,
    check,
    correctAll,
    correctOne,
    dismiss,
    currentLang: lang,
    isPending,
  };
}
