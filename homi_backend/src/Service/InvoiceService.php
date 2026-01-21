<?php

namespace App\Service;

use App\Entity\Invoice;
use App\Entity\Domicile;
use App\Entity\User;
use App\Entity\TaskTimeLog;
use App\Repository\InvoiceRepository;
use App\Repository\TaskTimeLogRepository;
use App\Repository\DomicileExecutorRepository;
use Doctrine\ORM\EntityManagerInterface;

class InvoiceService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private InvoiceRepository $invoiceRepository,
        private TaskTimeLogRepository $timeLogRepository,
        private DomicileExecutorRepository $domicileExecutorRepository
    ) {
    }

    /**
     * Générer une facture pour un exécuteur sur une période
     */
    public function generateInvoice(
        Domicile $domicile,
        User $executor,
        \DateTimeInterface $periodStart,
        \DateTimeInterface $periodEnd,
        ?float $taxRate = 20.0,
        ?float $hourlyRate = null
    ): Invoice {
        // Si hourlyRate n'est pas fourni, le récupérer de la relation domicile-exécutant
        if ($hourlyRate === null) {
            $domicileExecutor = $this->domicileExecutorRepository->createQueryBuilder('de')
                ->andWhere('de.domicile = :domicile')
                ->andWhere('de.executor = :executor')
                ->setParameter('domicile', $domicile)
                ->setParameter('executor', $executor)
                ->getQuery()
                ->getOneOrNullResult();

            if (!$domicileExecutor) {
                throw new \RuntimeException('Executor not assigned to this domicile');
            }

            $hourlyRate = $domicileExecutor->getHourlyRate();
            if ($hourlyRate === null || $hourlyRate <= 0) {
                throw new \RuntimeException('Hourly rate not set for this executor');
            }
        }

        // Valider que le hourlyRate fourni est valide
        if ($hourlyRate <= 0) {
            throw new \RuntimeException('Hourly rate must be positive');
        }

        // Étendre la période de fin jusqu'à la fin de la journée pour inclure tout le travail du dernier jour
        $periodEndExtended = \DateTimeImmutable::createFromInterface($periodEnd)->setTime(23, 59, 59);

        // Récupérer tous les logs approuvés de la période
        $timeLogs = $this->timeLogRepository->createQueryBuilder('t')
            ->join('t.task', 'task')
            ->andWhere('task.domicile = :domicile')
            ->andWhere('t.executor = :executor')
            ->andWhere('t.status = :status')
            ->andWhere('t.startTime >= :startDate')
            ->andWhere('t.endTime <= :endDate')
            ->setParameter('domicile', $domicile)
            ->setParameter('executor', $executor)
            ->setParameter('status', TaskTimeLog::STATUS_APPROVED)
            ->setParameter('startDate', $periodStart)
            ->setParameter('endDate', $periodEndExtended)
            ->getQuery()
            ->getResult();

        // Calculer le total des heures
        $totalHours = 0;
        foreach ($timeLogs as $log) {
            $totalHours += $log->getHoursWorked();
        }

        // Créer la facture
        $invoice = new Invoice();
        $invoice->setInvoiceNumber($this->generateInvoiceNumber());
        $invoice->setDomicile($domicile);
        $invoice->setExecutor($executor);
        $invoice->setPeriodStart($periodStart);
        $invoice->setPeriodEnd($periodEnd);
        $invoice->setTotalHours($totalHours);
        $invoice->setHourlyRate($hourlyRate);
        $invoice->setTaxRate($taxRate);
        $invoice->setStatus(Invoice::STATUS_DRAFT);

        // Définir la date d'échéance (30 jours après la création)
        $dueDate = (new \DateTimeImmutable())->modify('+30 days');
        $invoice->setDueDate($dueDate);

        $this->entityManager->persist($invoice);
        $this->entityManager->flush();

        return $invoice;
    }

    /**
     * Générer un numéro de facture unique
     */
    private function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        
        // Trouver le dernier numéro de facture du mois
        $lastInvoice = $this->invoiceRepository->createQueryBuilder('i')
            ->where('i.invoiceNumber LIKE :pattern')
            ->setParameter('pattern', "INV-{$year}{$month}-%")
            ->orderBy('i.invoiceNumber', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if ($lastInvoice) {
            // Extraire le numéro et incrémenter
            $parts = explode('-', $lastInvoice->getInvoiceNumber());
            $number = (int) end($parts) + 1;
        } else {
            $number = 1;
        }

        return sprintf('INV-%s%s-%04d', $year, $month, $number);
    }

    /**
     * Marquer une facture comme envoyée
     */
    public function sendInvoice(Invoice $invoice): Invoice
    {
        if ($invoice->getStatus() === Invoice::STATUS_PAID) {
            throw new \RuntimeException('Cannot send a paid invoice');
        }

        $invoice->setStatus(Invoice::STATUS_SENT);
        $this->entityManager->flush();

        return $invoice;
    }

    /**
     * Marquer une facture comme payée
     */
    public function markAsPaid(Invoice $invoice, ?\DateTimeInterface $paidDate = null): Invoice
    {
        if ($invoice->getStatus() === Invoice::STATUS_CANCELLED) {
            throw new \RuntimeException('Cannot mark a cancelled invoice as paid');
        }

        $invoice->markAsPaid();
        if ($paidDate) {
            $invoice->setPaidDate($paidDate);
        }

        $this->entityManager->flush();

        return $invoice;
    }

    /**
     * Annuler une facture
     */
    public function cancelInvoice(Invoice $invoice, ?string $reason = null): Invoice
    {
        if ($invoice->getStatus() === Invoice::STATUS_PAID) {
            throw new \RuntimeException('Cannot cancel a paid invoice');
        }

        $invoice->setStatus(Invoice::STATUS_CANCELLED);
        if ($reason) {
            $invoice->setNotes($reason);
        }

        $this->entityManager->flush();

        return $invoice;
    }

    /**
     * Mettre à jour le statut des factures en retard
     */
    public function updateOverdueInvoices(): int
    {
        $invoices = $this->invoiceRepository->findByStatus(Invoice::STATUS_SENT);
        $count = 0;

        foreach ($invoices as $invoice) {
            if ($invoice->isOverdue()) {
                $invoice->setStatus(Invoice::STATUS_OVERDUE);
                $count++;
            }
        }

        if ($count > 0) {
            $this->entityManager->flush();
        }

        return $count;
    }

    /**
     * Calculer le total des factures par statut
     */
    public function getTotalsByStatus(): array
    {
        $statuses = [
            Invoice::STATUS_DRAFT,
            Invoice::STATUS_SENT,
            Invoice::STATUS_PAID,
            Invoice::STATUS_OVERDUE,
            Invoice::STATUS_CANCELLED
        ];

        $totals = [];
        foreach ($statuses as $status) {
            $result = $this->invoiceRepository->createQueryBuilder('i')
                ->select('COUNT(i.id) as count', 'SUM(i.total) as total')
                ->andWhere('i.status = :status')
                ->setParameter('status', $status)
                ->getQuery()
                ->getOneOrNullResult();

            $totals[$status] = [
                'count' => (int) ($result['count'] ?? 0),
                'total' => (float) ($result['total'] ?? 0)
            ];
        }

        return $totals;
    }

    /**
     * Statistiques globales pour les factures (montants)
     */
    public function getTotalsSummary(): array
    {
        $qb = $this->invoiceRepository->createQueryBuilder('i');

        $totalResult = $qb
            ->select('COUNT(i.id) as totalCount', 'COALESCE(SUM(i.total), 0) as totalAmount')
            ->getQuery()
            ->getOneOrNullResult();

        $paidResult = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.total), 0) as paidAmount')
            ->andWhere('i.status = :status')
            ->setParameter('status', Invoice::STATUS_PAID)
            ->getQuery()
            ->getOneOrNullResult();

        $overdueResult = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.total), 0) as overdueAmount')
            ->andWhere('i.status = :status')
            ->setParameter('status', Invoice::STATUS_OVERDUE)
            ->getQuery()
            ->getOneOrNullResult();

        $totalAmount = (float) ($totalResult['totalAmount'] ?? 0);
        $paidAmount = (float) ($paidResult['paidAmount'] ?? 0);
        $overdueAmount = (float) ($overdueResult['overdueAmount'] ?? 0);
        $unpaidAmount = $totalAmount - $paidAmount;

        return [
            'totalInvoices' => (int) ($totalResult['totalCount'] ?? 0),
            'totalAmount' => $totalAmount,
            'paidAmount' => $paidAmount,
            'unpaidAmount' => $unpaidAmount,
            'overdueAmount' => $overdueAmount,
        ];
    }

    /**
     * Récupérer les factures d'un exécuteur
     */
    public function getExecutorInvoices(User $executor, ?string $status = null): array
    {
        $qb = $this->invoiceRepository->createQueryBuilder('i')
            ->andWhere('i.executor = :executor')
            ->setParameter('executor', $executor)
            ->orderBy('i.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('i.status = :status')
               ->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Vérifier si un utilisateur peut voir cette facture
     */
    public function canView(Invoice $invoice, User $user): bool
    {
        // Admin peut tout voir
        if (in_array('ROLE_ADMIN', $user->getRoles())) {
            return true;
        }

        // L'exécuteur peut voir ses propres factures
        if ($invoice->getExecutor()->getId() === $user->getId()) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si un utilisateur peut modifier cette facture
     */
    public function canModify(Invoice $invoice, User $user): bool
    {
        // Seul l'admin peut modifier
        if (!in_array('ROLE_ADMIN', $user->getRoles())) {
            return false;
        }

        // Ne peut pas modifier une facture payée
        if ($invoice->getStatus() === Invoice::STATUS_PAID) {
            return false;
        }

        return true;
    }

    /**
     * Supprimer une facture (seulement DRAFT)
     */
    public function deleteInvoice(Invoice $invoice, User $user): void
    {
        if (!in_array('ROLE_ADMIN', $user->getRoles())) {
            throw new \RuntimeException('Only admins can delete invoices');
        }

        if ($invoice->getStatus() !== Invoice::STATUS_DRAFT) {
            throw new \RuntimeException('Only draft invoices can be deleted');
        }

        $this->entityManager->remove($invoice);
        $this->entityManager->flush();
    }
}
