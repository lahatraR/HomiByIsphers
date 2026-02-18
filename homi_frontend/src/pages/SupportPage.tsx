import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner, Button } from '../components/common';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useTranslation();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Ticket[]>('/support/');
      setTickets(res.data);
    } catch (err: any) {
      setError(err.message || t('support.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post<Ticket>('/support/', { subject: form.subject, message: form.message });
      setTickets(prev => [res.data, ...prev]);
      setForm({ subject: '', message: '' });
      setShowForm(false);
      setSuccess(t('support.sent'));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || t('support.errorSending'));
    } finally {
      setSending(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return { bg: 'bg-blue-100 text-blue-800', label: t('support.statusOpen') };
      case 'in_progress': return { bg: 'bg-yellow-100 text-yellow-800', label: t('support.statusInProgress') };
      case 'resolved': return { bg: 'bg-green-100 text-green-800', label: t('support.statusResolved') };
      case 'closed': return { bg: 'bg-gray-100 text-gray-800', label: t('support.statusClosed') };
      default: return { bg: 'bg-gray-100 text-gray-700', label: status || t('support.statusUnknown') };
    }
  };

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('support.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {openCount > 0 ? t('support.openTickets', { count: openCount }) : t('support.noOpenTickets')}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? t('support.cancelNewTicket') : t('support.newTicket')}</Button>
        </div>

        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {showForm && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('support.newTicketTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('support.subject')}</label>
                <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={t('support.subjectPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('support.message')}</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} placeholder={t('support.messagePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button onClick={handleSubmit} disabled={sending || !form.subject.trim() || !form.message.trim()}>
                {sending ? t('support.sending') : t('support.send')}
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-500 font-medium">{t('support.noTickets')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('support.noTicketsDesc')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => {
              const statusStyle = getStatusStyle(ticket.status);
              return (
                <Card key={ticket.id} className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.subject || t('support.noSubject')}</h3>
                      <span className="text-xs text-gray-400">
                        #{ticket.id} - {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle.bg}`}>
                      {statusStyle.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
