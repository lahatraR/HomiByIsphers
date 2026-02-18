<?php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\TaskRepository;
use App\Repository\DomicileRepository;
use App\Repository\LogEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/stats')]
class StatsController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private TaskRepository $taskRepository,
        private DomicileRepository $domicileRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_admin_stats', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function stats(): JsonResponse
    {
        $totalUsers = $this->userRepository->count([]);
        $totalTasks = $this->taskRepository->count([]);
        $totalDomiciles = $this->domicileRepository->count([]);

        // Tasks by status
        $tasksByStatus = [];
        foreach (['TODO', 'IN_PROGRESS', 'COMPLETED'] as $status) {
            $tasksByStatus[$status] = $this->taskRepository->count(['status' => $status]);
        }

        // Users by role
        $adminCount = $this->userRepository->count(['role' => 'ROLE_ADMIN']);
        $userCount = $totalUsers - $adminCount;

        // Recent registrations (30 days)
        $thirtyDaysAgo = new \DateTimeImmutable('-30 days');
        $recentUsers = $this->userRepository->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->where('u.createdAt >= :date')
            ->setParameter('date', $thirtyDaysAgo)
            ->getQuery()->getSingleScalarResult();

        // Tasks completed this month
        $startOfMonth = new \DateTimeImmutable('first day of this month midnight');
        $completedThisMonth = $this->taskRepository->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->where('t.status = :status AND t.updatedAt >= :date')
            ->setParameter('status', 'COMPLETED')
            ->setParameter('date', $startOfMonth)
            ->getQuery()->getSingleScalarResult();

        // Time logs stats
        $timeLogStats = $this->em->createQuery(
            'SELECT COUNT(tl.id) as totalLogs, COALESCE(SUM(tl.hoursWorked), 0) as totalHours
             FROM App\Entity\TaskTimeLog tl WHERE tl.status = :status'
        )->setParameter('status', 'APPROVED')->getSingleResult();

        // Invoices stats
        $invoiceStats = $this->em->createQuery(
            'SELECT COUNT(i.id) as totalInvoices, COALESCE(SUM(i.total), 0) as totalRevenue
             FROM App\Entity\Invoice i WHERE i.status = :status'
        )->setParameter('status', 'PAID')->getSingleResult();

        // Completion rate
        $completionRate = $totalTasks > 0 
            ? round(($tasksByStatus['COMPLETED'] / $totalTasks) * 100, 1) 
            : 0;

        return $this->json([
            'overview' => [
                'totalUsers' => (int) $totalUsers,
                'totalTasks' => (int) $totalTasks,
                'totalDomiciles' => (int) $totalDomiciles,
                'completionRate' => $completionRate,
            ],
            'tasks' => [
                'byStatus' => $tasksByStatus,
                'completedThisMonth' => (int) $completedThisMonth,
            ],
            'users' => [
                'admins' => (int) $adminCount,
                'executors' => (int) $userCount,
                'recentRegistrations' => (int) $recentUsers,
            ],
            'timeLogs' => [
                'totalApprovedLogs' => (int) $timeLogStats['totalLogs'],
                'totalApprovedHours' => round((float) $timeLogStats['totalHours'], 1),
            ],
            'invoices' => [
                'totalPaid' => (int) $invoiceStats['totalInvoices'],
                'totalRevenue' => round((float) $invoiceStats['totalRevenue'], 2),
            ],
        ]);
    }
}
