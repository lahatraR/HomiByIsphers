<?php

namespace App\Controller;

use App\Entity\Task;
use App\Entity\User;
use App\Entity\Domicile;
use App\Service\TaskService;
use App\Service\TaskHistoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\Persistence\ManagerRegistry;

#[Route('/api/tasks')]
class TaskController extends AbstractController
{
    public function __construct(
        private TaskService $taskService,
        private TaskHistoryService $historyService,
        private ManagerRegistry $doctrine,
    ) {
    }

    /**
     * Créer une tâche
     */
    #[Route('', name: 'create_task', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if ($data === null) {
                return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
            }

            $domicile = $this->doctrine->getRepository(Domicile::class)->find($data['domicile_id']);
            $executor = $this->doctrine->getRepository(User::class)->find($data['executor_id']);

            if (!$domicile || !$executor) {
                return $this->json(['error' => 'Domicile ou exécutant non trouvé'], Response::HTTP_NOT_FOUND);
            }

            // Vérification permission
            $user = $this->getUser();
            if (!$user instanceof User || ($domicile->getOwner()->getId() !== $user->getId() && !\in_array('ROLE_ADMIN', $user->getRoles()))) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            try {
                $startTime = new \DateTimeImmutable();
                $endTime = isset($data['end_time']) ? new \DateTimeImmutable($data['end_time']) : null;
                
                if ($endTime && $endTime <= $startTime) {
                    return $this->json(['error' => 'La date de fin ne doit pas être antérieure ou égale à la date de début'], Response::HTTP_BAD_REQUEST);
                }
            } catch (\Exception) {
                return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }

            $task = $this->taskService->createTask(
                $data['title'],
                $data['description'],
                $domicile,
                $executor,
                $startTime,
                $endTime
            );

            $this->historyService->log($task, $executor, 1);

            return $this->json([
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'description' => $task->getDescription(),
                'domicile' => [
                    'id' => $task->getDomicile()->getId(),
                    'name' => $task->getDomicile()->getName(),
                ],
                'assignedTo' => [
                    'id' => $task->getAssignedTo()->getId(),
                    'email' => $task->getAssignedTo()->getEmail(),
                ],
                'startTime' => $task->getStartTime()?->format('c'),
                'status' => $task->getStatus(),
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer une tâche
     */
    #[Route('/{id}', name: 'get_task', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getTask(int $id): JsonResponse
    {
        try {
            $task = $this->taskService->getTask($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], Response::HTTP_NOT_FOUND);
            }

            return $this->json([
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'description' => $task->getDescription(),
                'domicile' => [
                    'id' => $task->getDomicile()->getId(),
                    'name' => $task->getDomicile()->getName(),
                ],
                'assignedTo' => [
                    'id' => $task->getAssignedTo()->getId(),
                    'email' => $task->getAssignedTo()->getEmail(),
                ],
                'startTime' => $task->getStartTime()?->format('c'),
                'status' => $task->getStatus(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Terminer une tâche
     */
    #[Route('/{id}/finish', name: 'finish_task', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function finish(int $id): JsonResponse
    {
        try {
            $task = $this->taskService->getTask($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], Response::HTTP_NOT_FOUND);
            }

            // Vérification permission
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($task->getAssignedTo()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $task = $this->taskService->finishTask($task);
            $this->historyService->log($task, $task->getAssignedTo(), 2);

            return $this->json($task, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reporter une tâche
     */
    #[Route('/{id}/postpone', name: 'postpone_task', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function postpone(int $id, Request $request): JsonResponse
    {
        try {
            $task = $this->taskService->getTask($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);

            if (!isset($data['new_start_time'])) {
                return $this->json(['error' => 'new_start_time est requis'], Response::HTTP_BAD_REQUEST);
            }

            try {
                $newStartTime = new \DateTimeImmutable($data['new_start_time']);
            } catch (\Exception) {
                return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }

            // Vérification permission
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($task->getAssignedTo()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $task = $this->taskService->postponeTask($task, $newStartTime);
            $this->historyService->log($task, $task->getAssignedTo(), 3);

            return $this->json($task, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Réassigner une tâche
     */
    #[Route('/{id}/reassign', name: 'reassign_task', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function reassign(int $id, Request $request): JsonResponse
    {
        try {
            $task = $this->taskService->getTask($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);

            if (!isset($data['new_executor_id'])) {
                return $this->json(['error' => 'new_executor_id est requis'], Response::HTTP_BAD_REQUEST);
            }

            $executor = $this->doctrine->getRepository(User::class)->find($data['new_executor_id']);

            if (!$executor) {
                return $this->json(['error' => 'Exécutant non trouvé'], Response::HTTP_NOT_FOUND);
            }

            // Vérification permission
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            $domicile = $task->getDomicile();
            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $task = $this->taskService->reassignTask($task, $executor);
            $this->historyService->log($task, $executor, 5);

            return $this->json($task, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer une tâche
     */
    #[Route('/{id}', name: 'delete_task', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id): JsonResponse
    {
        try {
            $task = $this->taskService->getTask($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], Response::HTTP_NOT_FOUND);
            }

            // Vérification permission
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            $domicile = $task->getDomicile();
            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $this->taskService->deleteTask($task);

            return $this->json(['message' => 'Tâche supprimée avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer toutes les tâches
     */
    #[Route('', name: 'list_tasks', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listTasks(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            // Récupérer les paramètres de pagination et filtrage
            $page = $request->query->getInt('page', 1);
            $limit = $request->query->getInt('limit', 10);
            $domicileId = $request->query->get('domicile_id') ? $request->query->getInt('domicile_id') : null;
            $status = $request->query->get('status', null);

            // Récupérer les tâches selon les permissions
            $tasks = $this->taskService->listTasks($user, $page, $limit, $domicileId, $status);

            return $this->json([
                'tasks' => array_map(function(Task $task) {
                    return [
                        'id' => $task->getId(),
                        'title' => $task->getTitle(),
                        'description' => $task->getDescription(),
                        'domicile' => [
                            'id' => $task->getDomicile()->getId(),
                            'name' => $task->getDomicile()->getName(),
                        ],
                        'assignedTo' => [
                            'id' => $task->getAssignedTo()->getId(),
                            'email' => $task->getAssignedTo()->getEmail(),
                        ],
                        'startTime' => $task->getStartTime()?->format('c'),
                        'status' => $task->getStatus(),
                    ];
                }, $tasks),
                'page' => $page,
                'limit' => $limit,
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

