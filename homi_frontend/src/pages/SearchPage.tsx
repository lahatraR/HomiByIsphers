import React, { useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  id: number;
  type: string;
  title: string;
  snippet: string;
  status?: string;
  url?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { t } = useTranslation();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (typeFilter) params.append('type', typeFilter);
      const res = await api.get<SearchResponse>(`/search/?${params.toString()}`);
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.message || t('search.error'));
    } finally {
      setIsLoading(false);
    }
  }, [query, typeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'task': return { icon: '📋', color: 'bg-blue-100 text-blue-700' };
      case 'user': return { icon: '👤', color: 'bg-purple-100 text-purple-700' };
      case 'domicile': return { icon: '🏠', color: 'bg-orange-100 text-orange-700' };
      case 'invoice': return { icon: '💰', color: 'bg-green-100 text-green-700' };
      default: return { icon: '🔍', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const typeOptions = [
    { value: '', label: t('search.filterAll') },
    { value: 'task', label: t('search.filterTasks') },
    { value: 'user', label: t('search.filterUsers') },
    { value: 'domicile', label: t('search.filterDomiciles') },
    { value: 'invoice', label: t('search.filterInvoices') },
  ];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('search.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('search.subtitle')}</p>
        </div>

        {/* Search bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={t('search.placeholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
              {isLoading ? t('common.searching') : t('common.search')}
            </Button>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : hasSearched && results.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">{t('search.noResults', { query })}</p>
            <p className="text-sm text-gray-400 mt-1">{t('search.noResultsHint')}</p>
          </Card>
        ) : hasSearched ? (
          <>
            <div className="text-sm text-gray-500">{t('search.results', { count: total, query })}</div>
            <div className="space-y-2">
              {results.map(result => {
                const style = getTypeIcon(result.type);
                return (
                  <div key={`${result.type}-${result.id}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${style.color} flex items-center justify-center text-lg flex-shrink-0`}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${style.color}`}>{result.type}</span>
                          {result.status && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{result.status}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                        {result.url && (
                          <Link to={result.url} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                            {t('search.viewDetail')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">{t('search.startSearch')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('search.startSearchHint')}</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
