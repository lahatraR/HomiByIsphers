<?php

namespace App\Controller;

use App\Repository\TaskRepository;
use App\Repository\TaskTimeLogRepository;
use App\Repository\TaskReviewRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Score de performance & analytics pour les exécuteurs.
 */
#[Route('/api/performance')]
#[IsGranted('ROLE_USER')]
class PerformanceController extends AbstractController
{
    public function __construct(
        private TaskRepository $taskRepo,
        private TaskTimeLogRepository $timeLogRepo,
        private TaskReviewRepository $reviewRepo,
    ) {}

    /**
     * Dashboard de performance pour l'utilisateur connecté (ou un exécuteur spécifique si admin).
     */
    #[Route('', name: 'performance_dashboard', methods: ['GET'])]
    public function dashboard(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $isAdmin = in_array('ROLE_ADMIN', $user->getRoles());
        $targetUserId = $request->query->getInt('executorId', 0);

        // Un exécuteur ne peut voir que ses propres stats
        if (!$isAdmin || $targetUserId === 0) {
            $targetUserId = $user->getId();
        }

        $conn = $this->taskRepo->getEntityManager()->getConnection();

        // 1. Statistiques de tâches
        $taskStats = $conn->fetchAssociative("
            SELECT
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks,
                COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tasks,
                COUNT(*) FILTER (WHERE status = 'TODO') as todo_tasks
            FROM task
            WHERE assigned_to_id = :userId
        ", ['userId' => $targetUserId]);

        // 2. Vitesse moyenne (heures par tâche complétée)
        $speedStats = $conn->fetchAssociative("
            SELECT
                AVG(tl.hours_worked) as avg_hours_per_task,
                MIN(tl.hours_worked) as fastest_task,
                MAX(tl.hours_worked) as slowest_task,
                SUM(tl.hours_worked) as total_hours
            FROM task_time_log tl
            WHERE tl.executor_id = :userId
            AND tl.status = 'APPROVED'
        ", ['userId' => $targetUserId]);

        // 3. Activité par semaine (4 dernières semaines) — sparkline data
        $weeklyActivity = $conn->fetchAllAssociative("
            SELECT
                DATE_TRUNC('week', t.actual_end_time) as week_start,
                COUNT(*) as tasks_completed,
                COALESCE(SUM(tl.hours_worked), 0) as hours_worked
            FROM task t
            LEFT JOIN task_time_log tl ON tl.task_id = t.id AND tl.status = 'APPROVED'
            WHERE t.assigned_to_id = :userId
            AND t.status = 'COMPLETED'
            AND t.actual_end_time >= NOW() - INTERVAL '8 weeks'
            GROUP BY DATE_TRUNC('week', t.actual_end_time)
            ORDER BY week_start ASC
        ", ['userId' => $targetUserId]);

        // 4. Taux de respect des estimations (tâches terminées dans le temps prévu)
        $onTimeRate = $conn->fetchAssociative("
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (
                    WHERE actual_end_time IS NOT NULL
                    AND end_time IS NOT NULL
                    AND actual_end_time <= end_time
                ) as on_time
            FROM task
            WHERE assigned_to_id = :userId
            AND status = 'COMPLETED'
            AND end_time IS NOT NULL
        ", ['userId' => $targetUserId]);

        $onTimePercent = ($onTimeRate['total'] ?? 0) > 0
            ? round(($onTimeRate['on_time'] / $onTimeRate['total']) * 100)
            : 0;

        // 5. Note moyenne depuis les reviews
        $reviewStats = $this->reviewRepo->getExecutorStats($targetUserId);

        // 6. Streak (jours consécutifs avec au moins une tâche complétée)
        $streakDays = $conn->fetchAllAssociative("
            SELECT DISTINCT DATE(actual_end_time) as work_date
            FROM task
            WHERE assigned_to_id = :userId
            AND status = 'COMPLETED'
            AND actual_end_time IS NOT NULL
            ORDER BY work_date DESC
            LIMIT 60
        ", ['userId' => $targetUserId]);

        $streak = 0;
        $today = new \DateTimeImmutable('today');
        foreach ($streakDays as $i => $row) {
            $expectedDate = $today->modify("-{$i} days")->format('Y-m-d');
            if ($row['work_date'] === $expectedDate) {
                $streak++;
            } else {
                break;
            }
        }

        // 7. Répartition par domicile
        $domicileBreakdown = $conn->fetchAllAssociative("
            SELECT
                d.name as domicile_name,
                COUNT(*) as task_count,
                COALESCE(SUM(tl.hours_worked), 0) as total_hours
            FROM task t
            JOIN domicile d ON d.id = t.domicile_id
            LEFT JOIN task_time_log tl ON tl.task_id = t.id AND tl.status = 'APPROVED'
            WHERE t.assigned_to_id = :userId
            AND t.status = 'COMPLETED'
            GROUP BY d.id, d.name
            ORDER BY task_count DESC
            LIMIT 10
        ", ['userId' => $targetUserId]);

        return $this->json([
            'tasks' => [
                'total' => (int) ($taskStats['total_tasks'] ?? 0),
                'completed' => (int) ($taskStats['completed_tasks'] ?? 0),
                'inProgress' => (int) ($taskStats['in_progress_tasks'] ?? 0),
                'todo' => (int) ($taskStats['todo_tasks'] ?? 0),
                'completionRate' => ($taskStats['total_tasks'] ?? 0) > 0
                    ? round(($taskStats['completed_tasks'] / $taskStats['total_tasks']) * 100)
                    : 0,
            ],
            'speed' => [
                'avgHoursPerTask' => round((float) ($speedStats['avg_hours_per_task'] ?? 0), 2),
                'fastestTask' => round((float) ($speedStats['fastest_task'] ?? 0), 2),
                'slowestTask' => round((float) ($speedStats['slowest_task'] ?? 0), 2),
                'totalHours' => round((float) ($speedStats['total_hours'] ?? 0), 1),
            ],
            'onTimeRate' => $onTimePercent,
            'rating' => $reviewStats,
            'streak' => $streak,
            'weeklyActivity' => array_map(fn($w) => [
                'weekStart' => $w['week_start'],
                'tasksCompleted' => (int) $w['tasks_completed'],
                'hoursWorked' => round((float) $w['hours_worked'], 1),
            ], $weeklyActivity),
            'domicileBreakdown' => array_map(fn($d) => [
                'domicileName' => $d['domicile_name'],
                'taskCount' => (int) $d['task_count'],
                'totalHours' => round((float) $d['total_hours'], 1),
            ], $domicileBreakdown),
        ]);
    }
}
