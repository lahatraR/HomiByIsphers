<?php

namespace App\Controller;

use App\Entity\TaskTimeLog;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\TaskTimeLogRepository;
use App\Repository\TaskRepository;
use App\Service\TimeTrackingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/time-logs')]
class TimeTrackingController extends AbstractController
{
    public function __construct(
        private TimeTrackingService $timeTrackingService,
        private TaskTimeLogRepository $timeLogRepository,
        private TaskRepository $taskRepository,
        private EntityManagerInterface $entityManager,
        private ValidatorInterface $validator
    ) {
    }

    /**
     * Créer un nouveau log de temps
     * POST /api/time-logs
     */
    #[Route('', name: 'api_time_logs_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            /** @var User $user */
            $user = $this->getUser();

            // Validation des données
            if (!isset($data['taskId'], $data['startTime'], $data['endTime'])) {
                return $this->json([
                    'error' => 'Missing required fields: taskId, startTime, endTime'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Récupérer la tâche
            $task = $this->taskRepository->find($data['taskId']);
            if (!$task) {
                return $this->json([
                    'error' => 'Task not found'
                ], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur est assigné à cette tâche
            if ($task->getAssignedTo()->getId() !== $user->getId()) {
                return $this->json([
                    'error' => 'You are not assigned to this task'
                ], Response::HTTP_FORBIDDEN);
            }

            // Convertir les timestamps en DateTimeImmutable
            try {
                $startTime = new \DateTimeImmutable($data['startTime']);
                $endTime = new \DateTimeImmutable($data['endTime']);
            } catch (\Exception $e) {
                return $this->json([
                    'error' => 'Invalid date format. Use ISO 8601 format.'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Créer le log
            $timeLog = $this->timeTrackingService->createTimeLog(
                $task,
                $user,
                $startTime,
                $endTime,
                $data['notes'] ?? null
            );

            return $this->json([
                'id' => $timeLog->getId(),
                'taskId' => $timeLog->getTask()->getId(),
                'hoursWorked' => $timeLog->getHoursWorked(),
                'status' => $timeLog->getStatus(),
                'startTime' => $timeLog->getStartTime()->format('c'),
                'endTime' => $timeLog->getEndTime()->format('c'),
                'createdAt' => $timeLog->getCreatedAt()->format('c')
            ], Response::HTTP_CREATED);

        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            // Auto-fix sequence if it's out of sync, then retry once
            try {
                $conn = $this->entityManager->getConnection();
                $conn->executeStatement("SELECT setval('task_time_log_id_seq', (SELECT COALESCE(MAX(id), 0) FROM task_time_log) + 1, false)");

                // Reset EntityManager and retry
                if (!$this->entityManager->isOpen()) {
                    $this->entityManager = $this->entityManager->create(
                        $this->entityManager->getConnection(),
                        $this->entityManager->getConfiguration()
                    );
                }

                $task = $this->taskRepository->find($data['taskId']);
                $user = $this->getUser();
                $timeLog = $this->timeTrackingService->createTimeLog(
                    $task, $user, $startTime, $endTime, $data['notes'] ?? null
                );

                return $this->json([
                    'id' => $timeLog->getId(),
                    'taskId' => $timeLog->getTask()->getId(),
                    'hoursWorked' => $timeLog->getHoursWorked(),
                    'status' => $timeLog->getStatus(),
                    'startTime' => $timeLog->getStartTime()->format('c'),
                    'endTime' => $timeLog->getEndTime()->format('c'),
                    'createdAt' => $timeLog->getCreatedAt()->format('c')
                ], Response::HTTP_CREATED);
            } catch (\Exception $retryError) {
                return $this->json([
                    'error' => 'Database sequence error. Please try again.'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Récupérer tous les logs de l'utilisateur courant
     * GET /api/time-logs
     */
    #[Route('', name: 'api_time_logs_index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $status = $request->query->get('status'); // PENDING, APPROVED, REJECTED

        $logs = $this->timeTrackingService->getExecutorLogs($user, $status);

        $response = [];
        foreach ($logs as $log) {
            $response[] = [
                'id' => $log->getId(),
                'taskId' => $log->getTask()->getId(),
                'taskTitle' => $log->getTask()->getTitle(),
                'hoursWorked' => $log->getHoursWorked(),
                'status' => $log->getStatus(),
                'notes' => $log->getNotes(),
                'startTime' => $log->getStartTime()->format('c'),
                'endTime' => $log->getEndTime()->format('c'),
                'createdAt' => $log->getCreatedAt()->format('c')
            ];
        }

        return $this->json($response);
    }

    /**
     * Récupérer un log spécifique
     * GET /api/time-logs/{id}
     */
    #[Route('/{id}', name: 'api_time_logs_show', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function show(TaskTimeLog $timeLog): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        // Vérifier les permissions
        if (!$this->timeTrackingService->canView($timeLog, $user)) {
            return $this->json([
                'error' => 'Access denied'
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'id' => $timeLog->getId(),
            'taskId' => $timeLog->getTask()->getId(),
            'taskTitle' => $timeLog->getTask()->getTitle(),
            'executor' => [
                'id' => $timeLog->getExecutor()->getId(),
                'firstName' => $timeLog->getExecutor()->getFirstName(),
                'lastName' => $timeLog->getExecutor()->getLastName()
            ],
            'hoursWorked' => $timeLog->getHoursWorked(),
            'status' => $timeLog->getStatus(),
            'notes' => $timeLog->getNotes(),
            'startTime' => $timeLog->getStartTime()->format('c'),
            'endTime' => $timeLog->getEndTime()->format('c'),
            'createdAt' => $timeLog->getCreatedAt()->format('c'),
            'validatedBy' => $timeLog->getValidatedBy() ? [
                'id' => $timeLog->getValidatedBy()->getId(),
                'firstName' => $timeLog->getValidatedBy()->getFirstName(),
                'lastName' => $timeLog->getValidatedBy()->getLastName()
            ] : null
        ]);
    }

    /**
     * Mettre à jour un log de temps
     * PATCH /api/time-logs/{id}
     */
    #[Route('/{id}', name: 'api_time_logs_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function update(TaskTimeLog $timeLog, Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();

            // Vérifier les permissions
            if (!$this->timeTrackingService->canModify($timeLog, $user)) {
                return $this->json([
                    'error' => 'You cannot modify this time log'
                ], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);

            // Vérifier qu'on ne met à jour que les champs autorisés
            if (isset($data['status']) && in_array('ROLE_USER', $user->getRoles())) {
                return $this->json([
                    'error' => 'Executors cannot change status'
                ], Response::HTTP_FORBIDDEN);
            }

            // Mettre à jour startTime et endTime si fournis
            if (isset($data['startTime']) && isset($data['endTime'])) {
                try {
                    $startTime = new \DateTimeImmutable($data['startTime']);
                    $endTime = new \DateTimeImmutable($data['endTime']);
                    $this->timeTrackingService->updateTimeLog($timeLog, $startTime, $endTime, $data['notes'] ?? null);
                } catch (\Exception $e) {
                    return $this->json([
                        'error' => 'Invalid date format. Use ISO 8601 format.'
                    ], Response::HTTP_BAD_REQUEST);
                }
            } elseif (isset($data['notes'])) {
                $timeLog->setNotes($data['notes']);
                $this->entityManager->flush();
            }

            return $this->json([
                'id' => $timeLog->getId(),
                'hoursWorked' => $timeLog->getHoursWorked(),
                'status' => $timeLog->getStatus(),
                'message' => 'Time log updated successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Valider un log (Admin only)
     * PATCH /api/time-logs/{id}/approve
     */
    #[Route('/{id}/approve', name: 'api_time_logs_approve', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function approve(TaskTimeLog $timeLog): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            $this->timeTrackingService->approveTimeLog($timeLog, $user);

            return $this->json([
                'id' => $timeLog->getId(),
                'status' => $timeLog->getStatus(),
                'message' => 'Time log approved successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Rejeter un log (Admin only)
     * PATCH /api/time-logs/{id}/reject
     */
    #[Route('/{id}/reject', name: 'api_time_logs_reject', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function reject(TaskTimeLog $timeLog, Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            $data = json_decode($request->getContent(), true);
            $reason = $data['reason'] ?? null;

            $this->timeTrackingService->rejectTimeLog($timeLog, $user, $reason);

            return $this->json([
                'id' => $timeLog->getId(),
                'status' => $timeLog->getStatus(),
                'message' => 'Time log rejected'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Supprimer un log (seulement logs en attente)
     * DELETE /api/time-logs/{id}
     */
    #[Route('/{id}', name: 'api_time_logs_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(TaskTimeLog $timeLog): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            $this->timeTrackingService->deleteTimeLog($timeLog, $user);

            return $this->json([
                'message' => 'Time log deleted successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Récupérer les statistiques totales des heures
     * GET /api/time-logs/stats/executor
     */
    #[Route('/stats/executor', name: 'api_time_logs_stats', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function stats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');

        $start = $startDate ? new \DateTime($startDate) : null;
        $end = $endDate ? new \DateTime($endDate) : null;

        $totalHours = $this->timeTrackingService->calculateTotalHours($user, $start, $end);
        $logs = $this->timeTrackingService->getExecutorLogs($user, TaskTimeLog::STATUS_APPROVED);

        return $this->json([
            'executor' => [
                'id' => $user->getId(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName()
            ],
            'totalHours' => $totalHours,
            'logsCount' => count($logs),
            'period' => [
                'startDate' => $start?->format('Y-m-d'),
                'endDate' => $end?->format('Y-m-d')
            ]
        ]);
    }

    /**
     * Récupérer tous les logs en attente (Admin only)
     * GET /api/time-logs/admin/pending
     */
    #[Route('/admin/pending', name: 'api_time_logs_admin_pending', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminPending(): JsonResponse
    {
        $logs = $this->timeLogRepository->findPending();

        $response = [];
        foreach ($logs as $log) {
            $response[] = [
                'id' => $log->getId(),
                'taskId' => $log->getTask()->getId(),
                'taskTitle' => $log->getTask()->getTitle(),
                'executor' => [
                    'id' => $log->getExecutor()->getId(),
                    'firstName' => $log->getExecutor()->getFirstName(),
                    'lastName' => $log->getExecutor()->getLastName()
                ],
                'hoursWorked' => $log->getHoursWorked(),
                'notes' => $log->getNotes(),
                'startTime' => $log->getStartTime()->format('c'),
                'endTime' => $log->getEndTime()->format('c'),
                'createdAt' => $log->getCreatedAt()->format('c')
            ];
        }

        return $this->json($response);
    }

    /**
     * Statistiques globales (Admin only)
     * GET /api/time-logs/admin/stats
     */
    #[Route('/admin/stats', name: 'api_time_logs_admin_stats', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminStats(): JsonResponse
    {
        $stats = $this->timeTrackingService->getAdminStats();

        return $this->json($stats);
    }
}
