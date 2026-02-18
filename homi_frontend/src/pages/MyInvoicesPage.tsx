import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card, LoadingSpinner } from '../components/common';
import { getInvoices, type Invoice } from '../services/invoice.service';
import { useTranslation } from 'react-i18next';

export const MyInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await getInvoices(status);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || t('invoices.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-600'
    };

    const labels: Record<string, string> = {
      DRAFT: t('invoices.draft'),
      SENT: t('invoices.unpaid'),
      PAID: t('invoices.paid'),
      OVERDUE: t('invoices.overdue'),
      CANCELLED: t('invoices.cancelled')
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalPaid = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPending = invoices
    .filter(inv => inv.status === 'SENT')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invoices.title')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('invoices.subtitle')}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm font-medium text-gray-600">{t('invoices.totalInvoices')}</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {invoices.length}
            </div>
          </Card>
          <Card>
            <div className="text-sm font-medium text-gray-600">{t('invoices.amountPaid')}</div>
            <div className="mt-2 text-2xl font-semibold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </Card>
          <Card>
            <div className="text-sm font-medium text-gray-600">{t('invoices.pendingAmount')}</div>
            <div className="mt-2 text-2xl font-semibold text-orange-600">
              {formatCurrency(totalPending)}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => setFilterStatus('SENT')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'SENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('invoices.unpaid')}
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'PAID'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('invoices.paid')}
            </button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">{t('invoices.noInvoices')}</p>
            </div>
          </Card>
        ) : (
          /* Invoices List */
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">{t('common.domicile')}:</span>
                        <span className="ml-2 font-medium">{invoice.domicile.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('invoices.period')}:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('invoices.hoursWorked')}:</span>
                        <span className="ml-2 font-medium">{invoice.totalHours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('invoices.hourlyRate')}:</span>
                        <span className="ml-2 font-medium">{formatCurrency(invoice.hourlyRate)}/h</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-8">
                            <span className="text-gray-600">{t('invoices.subtotal')}:</span>
                            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-gray-600">{t('invoices.tax')} ({invoice.taxRate}%):</span>
                            <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                          </div>
                          <div className="flex justify-between gap-8 text-lg font-bold">
                            <span className="text-gray-900">{t('invoices.total')}:</span>
                            <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {invoice.paidDate && (
                      <div className="mt-3 text-sm text-green-600">
                        ✓ {t('invoices.paidOn')} {formatDate(invoice.paidDate)}
                      </div>
                    )}

                    {invoice.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <span className="font-medium">{t('timeLogs.notes')}:</span> {invoice.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
