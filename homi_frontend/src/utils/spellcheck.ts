/**
 * Multi-language spell-check & grammar service
 * Uses the free LanguageTool API for comprehensive checking:
 * - Spelling mistakes (all words, not just a dictionary)
 * - Grammar errors (sentence structure, agreement, conjugation)
 * - Style suggestions (redundancies, clarity)
 * Supports: fr, en, es, de, pt, nl, it, pl, zh, and more
 *
 * Context-aware: waits for enough text to give accurate suggestions.
 * Uses edit-distance ranking so "Netoyer" → "Nettoyer" (not "n'étayer").
 *
 * API: https://api.languagetool.org/v2/check (free, no key required)
 */

export interface SpellCorrection {
  /** The misspelled or incorrect text */
  original: string;
  /** The suggested replacement */
  suggestion: string;
  /** Start index in the text */
  position: number;
  /** Human-readable explanation of the error */
  message?: string;
  /** Category: 'spelling' | 'grammar' | 'style' | 'typographical' */
  category?: string;
  /** Rule ID from LanguageTool (e.g. "MORFOLOGIK_RULE_FR") */
  ruleId?: string;
  /** All replacement suggestions (first one is primary, re-ranked by similarity) */
  allSuggestions?: string[];
}

// ─── Edit distance for smart ranking ─────────────────────────────────────────

/**
 * Normalize accented characters for distance comparison.
 * "à" → "a", "é" → "e", "ç" → "c", etc.
 * This way "aranger" vs "arranger" is pure letter distance,
 * not penalized by accent differences.
 */
function normalizeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compute Levenshtein distance between two strings.
 * Compares on accent-normalized lowercase so that
 * accent-only differences (a/à, e/é) cost 0.
 * e.g. distance("aranger", "arranger") = 1
 *      distance("aranger", "à ranger") = 2 (space + extra char)
 */
function levenshtein(a: string, b: string): number {
  // Normalize: remove accents, lowercase
  const na = normalizeAccents(a.toLowerCase());
  const nb = normalizeAccents(b.toLowerCase());
  const la = na.length;
  const lb = nb.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = na[i - 1] === nb[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/**
 * Count how many words a string contains.
 */
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Compute a smart relevance score for a suggestion.
 * Lower score = better match. Considers:
 *
 * 1. **Edit distance** (accent-normalized) — "aranger"→"arranger" = 1
 * 2. **Word-count penalty** — if original is 1 word but suggestion is 2+,
 *    add a heavy penalty. "aranger" is clearly one word, so "arranger" (1 word)
 *    beats "à ranger" (2 words). This prevents the API from splitting words.
 * 3. **Starts-with bonus** — if the suggestion starts with the same letters
 *    as the original, it's more likely the intended word.
 *
 * Examples with original = "aranger":
 *   "arranger"  → dist=1, same word count → score ≈ 1
 *   "à ranger"  → dist=2, word count 2≠1 → score ≈ 2 + 5 = 7
 *   "déranger"  → dist=2, same word count → score ≈ 2
 */
function suggestionScore(original: string, suggestion: string): number {
  let score = levenshtein(original, suggestion);

  const origWords = wordCount(original);
  const suggWords = wordCount(suggestion);

  // Heavy penalty when word count changes (splitting / merging words)
  // "aranger" (1 word) → "à ranger" (2 words) = unnatural split
  if (origWords !== suggWords) {
    score += 5 * Math.abs(origWords - suggWords);
  }

  // Bonus if suggestion starts with same normalized prefix (at least 2 chars)
  const normOrig = normalizeAccents(original.toLowerCase());
  const normSugg = normalizeAccents(suggestion.toLowerCase());
  const prefixLen = Math.min(3, normOrig.length);
  if (prefixLen >= 2 && normSugg.startsWith(normOrig.substring(0, prefixLen))) {
    score -= 0.5; // slight bonus
  }

  return score;
}

/**
 * Re-rank suggestions by contextual relevance score.
 * Applied to ALL categories (not just spelling) because even grammar
 * suggestions like "à ranger" vs "arranger" need smart ranking.
 *
 * "aranger" → ["arranger"(score=0.5), "déranger"(score=2), "à ranger"(score=7)]
 */
function rankSuggestions(original: string, suggestions: string[]): string[] {
  if (suggestions.length <= 1) return suggestions;

  return [...suggestions].sort((a, b) => {
    return suggestionScore(original, a) - suggestionScore(original, b);
  });
}

/**
 * Count the number of words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// â”€â”€â”€ LanguageTool API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';

/**
 * Map i18n language codes to LanguageTool language codes
 */
function mapLanguage(lang: string): string {
  const base = lang.split('-')[0].toLowerCase();
  const langMap: Record<string, string> = {
    fr: 'fr',
    en: 'en-US',
    es: 'es',
    de: 'de-DE',
    pt: 'pt-BR',
    nl: 'nl',
    it: 'it',
    pl: 'pl',
    zh: 'zh-CN',
  };
  return langMap[base] || 'auto';
}

/**
 * Categorize a LanguageTool issue type into a simpler category
 */
function categorizeIssue(categoryId: string): string {
  const id = categoryId.toUpperCase();
  if (id.includes('TYPO') || id.includes('SPELL') || id.includes('MORFOLOGIK')) return 'spelling';
  if (id.includes('GRAMMAR') || id.includes('AGREEMENT') || id.includes('VERB')) return 'grammar';
  if (id.includes('STYLE') || id.includes('REDUNDANCY') || id.includes('CLARITY')) return 'style';
  if (id.includes('TYPOGRAPHICAL') || id.includes('PUNCTUATION') || id.includes('WHITESPACE')) return 'typographical';
  return 'grammar';
}

/** Cache to avoid re-checking identical texts */
const checkCache = new Map<string, { corrections: SpellCorrection[]; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

/** Rate limiter */
let lastRequestTime = 0;
const MIN_INTERVAL = 1500; // 1.5s between requests

/**
 * Main async spell & grammar check via LanguageTool API
 * @param text - The text to check
 * @param lang - Language code (fr, en, es, de, etc.)
 * @returns Promise<SpellCorrection[]>
 */
export async function spellCheckAsync(text: string, lang: string): Promise<SpellCorrection[]> {
  if (!text || text.trim().length < 3) return [];

  // Need at least 2 words for context-aware checking.
  // With 1 word, LanguageTool can't distinguish "Netoyer" → "Nettoyer" vs "n'étayer".
  const wordCount = countWords(text);
  if (wordCount < 2) return [];

  const ltLang = mapLanguage(lang);
  const cacheKey = `${ltLang}:${text}`;

  // Check cache
  const cached = checkCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.corrections;
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastReq = now - lastRequestTime;
  if (timeSinceLastReq < MIN_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL - timeSinceLastReq));
  }
  lastRequestTime = Date.now();

  try {
    const body = new URLSearchParams({
      text,
      language: ltLang,
      enabledOnly: 'false',
      level: 'picky',  // More thorough analysis for better context matching
    });

    const response = await fetch(LANGUAGETOOL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      console.warn('[SpellCheck] LanguageTool API error:', response.status);
      return [];
    }

    const data = await response.json();
    const corrections: SpellCorrection[] = [];

    for (const match of data.matches || []) {
      // Skip matches with no replacements
      if (!match.replacements || match.replacements.length === 0) continue;

      const original = text.substring(match.offset, match.offset + match.length);
      const rawSuggestions = match.replacements.slice(0, 8).map((r: { value: string }) => r.value);
      const category = categorizeIssue(match.rule?.category?.id || '');

      // Re-rank suggestions by smart relevance score (edit distance + word-count penalty)
      // This ensures "aranger" → "arranger" (score≈1) instead of "à ranger" (score≈7)
      const ranked = rankSuggestions(original, rawSuggestions);
      const primarySuggestion = ranked[0];

      // Skip if the suggestion is the same as the original
      if (!primarySuggestion || primarySuggestion === original) continue;

      corrections.push({
        original,
        suggestion: primarySuggestion,
        position: match.offset,
        message: match.message || '',
        category,
        ruleId: match.rule?.id || '',
        allSuggestions: ranked.slice(0, 5),
      });
    }

    // Cache results
    checkCache.set(cacheKey, { corrections, timestamp: Date.now() });

    // Limit cache size
    if (checkCache.size > 100) {
      const oldestKey = checkCache.keys().next().value;
      if (oldestKey) checkCache.delete(oldestKey);
    }

    return corrections;
  } catch (error) {
    console.warn('[SpellCheck] Network error, spell-check unavailable:', error);
    return [];
  }
}

// â”€â”€â”€ Correction application (unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Apply all corrections to the text
 */
export function applyCorrections(text: string, corrections: SpellCorrection[]): string {
  if (corrections.length === 0) return text;

  // Apply from end to start to preserve positions
  const sorted = [...corrections].sort((a, b) => b.position - a.position);
  let result = text;

  for (const correction of sorted) {
    const before = result.substring(0, correction.position);
    const after = result.substring(correction.position + correction.original.length);
    result = before + correction.suggestion + after;
  }

  return result;
}

/**
 * Apply a single correction to the text
 */
export function applySingleCorrection(text: string, correction: SpellCorrection): string {
  const before = text.substring(0, correction.position);
  const after = text.substring(correction.position + correction.original.length);
  return before + correction.suggestion + after;
}
