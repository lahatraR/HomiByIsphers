import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';
import {
  getInvoices,
  deleteInvoice,
  markInvoiceAsPaid,
  getInvoiceStats,
  type Invoice,
  type InvoiceStats
} from '../services/invoice.service';

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const [invoicesData, statsData] = await Promise.all([
        getInvoices(status),
        getInvoiceStats()
      ]);
      setInvoices(invoicesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des factures');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    if (!confirm('Marquer cette facture comme payée ?')) return;

    setProcessingId(id);
    try {
      await markInvoiceAsPaid(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    setProcessingId(id);
    try {
      await deleteInvoice(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setProcessingId(null);
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
      DRAFT: 'Brouillon',
      SENT: 'Envoyée',
      PAID: 'Payée',
      OVERDUE: 'En retard',
      CANCELLED: 'Annulée'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Factures</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez toutes les factures de votre domicile
            </p>
          </div>
          <Link to="/admin/invoices/create">
            <Button>Créer une facture</Button>
          </Link>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-sm font-medium text-gray-600">Total Factures</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.totalInvoices}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">Montant Total</div>
              <div className="mt-2 text-2xl font-semibold text-blue-600">
                {formatCurrency(stats.totalAmount)}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">Montant Payé</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">
                {formatCurrency(stats.paidAmount)}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">En Attente</div>
              <div className="mt-2 text-2xl font-semibold text-orange-600">
                {formatCurrency(stats.unpaidAmount)}
              </div>
            </Card>
          </div>
        )}

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
              Toutes
            </button>
            <button
              onClick={() => setFilterStatus('DRAFT')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'DRAFT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Brouillons
            </button>
            <button
              onClick={() => setFilterStatus('SENT')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'SENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Envoyées
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'PAID'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payées
            </button>
            <button
              onClick={() => setFilterStatus('OVERDUE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'OVERDUE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En retard
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
              <p className="text-gray-500">Aucune facture trouvée</p>
            </div>
          </Card>
        ) : (
          /* Invoices List */
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Exécutant:</span>
                        <span className="ml-2 font-medium">
                          {invoice.executor.firstName} {invoice.executor.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Période:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Heures:</span>
                        <span className="ml-2 font-medium">{invoice.totalHours}h</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Sous-total:</span>
                        <span className="ml-2 font-medium">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">TVA ({invoice.taxRate}%):</span>
                        <span className="ml-2 font-medium">{formatCurrency(invoice.taxAmount)}</span>
                      </div>
                      <div className="text-lg">
                        <span className="text-gray-900 font-semibold">Total:</span>
                        <span className="ml-2 text-blue-600 font-bold">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>

                    {invoice.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {invoice.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {invoice.status === 'SENT' && (
                      <Button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        disabled={processingId === invoice.id}
                        variant="success"
                        size="sm"
                      >
                        Marquer Payée
                      </Button>
                    )}
                    {invoice.status === 'DRAFT' && (
                      <Button
                        onClick={() => handleDelete(invoice.id)}
                        disabled={processingId === invoice.id}
                        variant="danger"
                        size="sm"
                      >
                        Supprimer
                      </Button>
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
