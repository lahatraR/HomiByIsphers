<?php

namespace App\Controller;

use App\Entity\Invoice;
use App\Entity\User;
use App\Repository\InvoiceRepository;
use App\Repository\DomicileRepository;
use App\Repository\UserRepository;
use App\Service\InvoiceService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/invoices')]
class InvoiceController extends AbstractController
{
    public function __construct(
        private InvoiceService $invoiceService,
        private InvoiceRepository $invoiceRepository,
        private DomicileRepository $domicileRepository,
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Générer une nouvelle facture
     * POST /api/invoices
     */
    #[Route('', name: 'api_invoices_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            // Validation
            if (!isset($data['domicileId'], $data['executorId'], $data['periodStart'], $data['periodEnd'])) {
                return $this->json([
                    'error' => 'Missing required fields: domicileId, executorId, periodStart, periodEnd'
                ], Response::HTTP_BAD_REQUEST);
            }

            $domicile = $this->domicileRepository->find($data['domicileId']);
            if (!$domicile) {
                return $this->json(['error' => 'Domicile not found'], Response::HTTP_NOT_FOUND);
            }

            $executor = $this->userRepository->find($data['executorId']);
            if (!$executor) {
                return $this->json(['error' => 'Executor not found'], Response::HTTP_NOT_FOUND);
            }

            $periodStart = new \DateTimeImmutable($data['periodStart']);
            $periodEnd = new \DateTimeImmutable($data['periodEnd']);
            $taxRate = $data['taxRate'] ?? 20.0;
            $hourlyRate = $data['hourlyRate'] ?? null;

            $invoice = $this->invoiceService->generateInvoice(
                $domicile,
                $executor,
                $periodStart,
                $periodEnd,
                $taxRate,
                $hourlyRate
            );

            return $this->json([
                'id' => $invoice->getId(),
                'invoiceNumber' => $invoice->getInvoiceNumber(),
                'domicile' => [
                    'id' => $invoice->getDomicile()->getId(),
                    'name' => $invoice->getDomicile()->getName()
                ],
                'executor' => [
                    'id' => $invoice->getExecutor()->getId(),
                    'firstName' => $invoice->getExecutor()->getFirstName(),
                    'lastName' => $invoice->getExecutor()->getLastName()
                ],
                'totalHours' => $invoice->getTotalHours(),
                'hourlyRate' => $invoice->getHourlyRate(),
                'subtotal' => $invoice->getSubtotal(),
                'taxAmount' => $invoice->getTaxAmount(),
                'total' => $invoice->getTotal(),
                'status' => $invoice->getStatus(),
                'dueDate' => $invoice->getDueDate()?->format('Y-m-d'),
                'createdAt' => $invoice->getCreatedAt()->format('Y-m-d H:i:s')
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Récupérer toutes les factures (avec filtres)
     * GET /api/invoices
     */
    #[Route('', name: 'api_invoices_index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $status = $request->query->get('status');

        // Admin voit toutes les factures
        if (in_array('ROLE_ADMIN', $user->getRoles())) {
            $invoices = $status 
                ? $this->invoiceRepository->findByStatus($status)
                : $this->invoiceRepository->findAll();
        } 
        // Executor voit ses propres factures
        else {
            $invoices = $this->invoiceService->getExecutorInvoices($user, $status);
        }

        $response = [];
        foreach ($invoices as $invoice) {
            $response[] = $this->formatInvoice($invoice);
        }

        return $this->json($response);
    }

    /**
     * Récupérer une facture spécifique
     * GET /api/invoices/{id}
     */
    #[Route('/{id}', name: 'api_invoices_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_USER')]
    public function show(Invoice $invoice): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$this->invoiceService->canView($invoice, $user)) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($this->formatInvoice($invoice));
    }

    /**
     * Mettre à jour une facture
     * PATCH /api/invoices/{id}
     */
    #[Route('/{id}', name: 'api_invoices_update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(Invoice $invoice, Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();

            if (!$this->invoiceService->canModify($invoice, $user)) {
                return $this->json([
                    'error' => 'Cannot modify this invoice'
                ], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);

            if (isset($data['notes'])) {
                $invoice->setNotes($data['notes']);
            }

            if (isset($data['dueDate'])) {
                $invoice->setDueDate(new \DateTimeImmutable($data['dueDate']));
            }

            if (isset($data['taxRate'])) {
                $invoice->setTaxRate((float) $data['taxRate']);
            }

            $this->entityManager->flush();

            return $this->json([
                'message' => 'Invoice updated successfully',
                'invoice' => $this->formatInvoice($invoice)
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Envoyer une facture
     * PATCH /api/invoices/{id}/send
     */
    #[Route('/{id}/send', name: 'api_invoices_send', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function send(Invoice $invoice): JsonResponse
    {
        try {
            $this->invoiceService->sendInvoice($invoice);

            return $this->json([
                'message' => 'Invoice sent successfully',
                'status' => $invoice->getStatus()
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Marquer comme payée
     * PATCH /api/invoices/{id}/pay
     */
    #[Route('/{id}/pay', name: 'api_invoices_pay', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function pay(Invoice $invoice, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $paidDate = isset($data['paidDate']) 
                ? new \DateTimeImmutable($data['paidDate']) 
                : null;

            $this->invoiceService->markAsPaid($invoice, $paidDate);

            return $this->json([
                'message' => 'Invoice marked as paid',
                'status' => $invoice->getStatus(),
                'paidDate' => $invoice->getPaidDate()?->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Annuler une facture
     * PATCH /api/invoices/{id}/cancel
     */
    #[Route('/{id}/cancel', name: 'api_invoices_cancel', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function cancel(Invoice $invoice, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $reason = $data['reason'] ?? null;

            $this->invoiceService->cancelInvoice($invoice, $reason);

            return $this->json([
                'message' => 'Invoice cancelled',
                'status' => $invoice->getStatus()
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Supprimer une facture
     * DELETE /api/invoices/{id}
     */
    #[Route('/{id}', name: 'api_invoices_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Invoice $invoice): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            $this->invoiceService->deleteInvoice($invoice, $user);

            return $this->json([
                'message' => 'Invoice deleted successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Statistiques des factures
     * GET /api/invoices/stats/all
     */
    #[Route('/stats/all', name: 'api_invoices_stats', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function stats(): JsonResponse
    {
        $totals = $this->invoiceService->getTotalsByStatus();

        return $this->json([
            'byStatus' => $totals,
            'overallTotal' => array_sum(array_column($totals, 'total')),
            'overallCount' => array_sum(array_column($totals, 'count'))
        ]);
    }

    /**
     * Statistiques globales (totaux) pour le dashboard
     * GET /api/invoices/stats/totals
     */
    #[Route('/stats/totals', name: 'api_invoices_stats_totals', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function statsTotals(): JsonResponse
    {
        $summary = $this->invoiceService->getTotalsSummary();

        return $this->json($summary);
    }

    /**
     * Récupérer les factures en retard
     * GET /api/invoices/overdue
     */
    #[Route('/overdue', name: 'api_invoices_overdue', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function overdue(): JsonResponse
    {
        // Mettre à jour les statuts d'abord
        $this->invoiceService->updateOverdueInvoices();

        $invoices = $this->invoiceRepository->findOverdue();

        $response = [];
        foreach ($invoices as $invoice) {
            $response[] = $this->formatInvoice($invoice);
        }

        return $this->json($response);
    }

    /**
     * Formater une facture pour la réponse JSON
     */
    private function formatInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->getId(),
            'invoiceNumber' => $invoice->getInvoiceNumber(),
            'domicile' => [
                'id' => $invoice->getDomicile()?->getId(),
                'name' => $invoice->getDomicile()?->getName(),
                'address' => $invoice->getDomicile()?->getAddress()
            ],
            'executor' => [
                'id' => $invoice->getExecutor()?->getId(),
                'firstName' => $invoice->getExecutor()?->getFirstName(),
                'lastName' => $invoice->getExecutor()?->getLastName(),
                'email' => $invoice->getExecutor()?->getEmail()
            ],
            'periodStart' => $invoice->getPeriodStart()?->format('Y-m-d'),
            'periodEnd' => $invoice->getPeriodEnd()?->format('Y-m-d'),
            'totalHours' => $invoice->getTotalHours(),
            'hourlyRate' => $invoice->getHourlyRate(),
            'subtotal' => $invoice->getSubtotal(),
            'taxRate' => $invoice->getTaxRate(),
            'taxAmount' => $invoice->getTaxAmount(),
            'total' => $invoice->getTotal(),
            'status' => $invoice->getStatus(),
            'dueDate' => $invoice->getDueDate()?->format('Y-m-d'),
            'paidDate' => $invoice->getPaidDate()?->format('Y-m-d'),
            'notes' => $invoice->getNotes(),
            'isOverdue' => $invoice->isOverdue(),
            'createdAt' => $invoice->getCreatedAt()?->format('Y-m-d H:i:s')
        ];
    }
}
