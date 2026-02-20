<?php

namespace App\Controller;

use App\Entity\Task;
use App\Entity\User;
use App\Entity\Domicile;
use App\Entity\DomicileExecutor;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Repository\DomicileRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;


#[Route('/api/tasks')]
class TaskController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TaskRepository $taskRepository,
        private UserRepository $userRepository,
        private DomicileRepository $domicileRepository,
        private ValidatorInterface $validator
    ) {
    }

    /**
     * Get all tasks
     */
    #[Route('', name: 'api_tasks_index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function index(): JsonResponse
    {
        $user = $this->getUser();

        // Admin voit toutes les tâches
        if ($this->isGranted('ROLE_ADMIN')) {
            $tasks = $this->taskRepository->findAll();
        }
        // User voit ses tâches assignées
        elseif ($this->isGranted('ROLE_USER')) {
            $tasks = $this->taskRepository->findBy(['assignedTo' => $user]);
        }
        // User voit toutes les tâches (peut être modifié selon les besoins)
        else {
            $tasks = $this->taskRepository->findAll();
        }

        return $this->json($tasks, Response::HTTP_OK, [], [
            'groups' => ['task:read']
        ]);
    }

    /**
     * Get a specific task
     */
    #[Route('/{id}', name: 'api_tasks_show', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function show(int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json([
                'error' => 'Task not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérification des permissions
        $user = $this->getUser();
        if (
            !$this->isGranted('ROLE_ADMIN') &&
            $this->isGranted('ROLE_USER') &&
            $task->getAssignedTo() !== $user
        ) {
            return $this->json([
                'error' => 'Access denied'
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json($task, Response::HTTP_OK, [], [
            'groups' => ['task:read']
        ]);
    }

    /**
     * Create a new task
     */
    #[Route('', name: 'api_tasks_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'error' => 'Invalid JSON data'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation des champs requis
        $requiredFields = ['title', 'description'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'error' => "Field '{$field}' is required"
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $task = new Task();
        $task->setTitle($data['title']);
        $task->setDescription($data['description']);
        $task->setStatus($data['status'] ?? Task::STATUS_TODO);

        // Dates optionnelles
        if (!empty($data['startTime'])) {
            $task->setStartTime(new \DateTimeImmutable($data['startTime']));
        }
        if (!empty($data['endTime'])) {
            $task->setEndTime(new \DateTimeImmutable($data['endTime']));
        }

        // Récupérer l'executor et le domicile pour les associer
        $executor = null;
        $domicile = null;

        // Assignation de l'executor
        if (!empty($data['executorId'])) {
            $executor = $this->userRepository->find($data['executorId']);
            if (!$executor) {
                return $this->json([
                    'error' => 'Executor not found'
                ], Response::HTTP_NOT_FOUND);
            }
            if (!in_array('ROLE_USER', $executor->getRoles())) {
                return $this->json([
                    'error' => 'User is not an executor'
                ], Response::HTTP_BAD_REQUEST);
            }
            $task->setAssignedTo($executor);
        }

        // Assignation du domicile
        if (!empty($data['domicileId'])) {
            $domicile = $this->domicileRepository->find($data['domicileId']);
            if (!$domicile) {
                return $this->json([
                    'error' => 'Domicile not found'
                ], Response::HTTP_NOT_FOUND);
            }
            $task->setDomicile($domicile);
        }

        // AUTO-ASSIGNER l'exécuteur au domicile s'ils sont tous les deux définis
        if ($executor && $domicile) {
            // Vérifier si l'association existe déjà
            $existingAssociation = $this->entityManager
                ->getRepository(DomicileExecutor::class)
                ->findOneBy([
                    'domicile' => $domicile,
                    'executor' => $executor,
                ]);

            // Si l'association n'existe pas, la créer
            if (!$existingAssociation) {
                $domicileExecutor = new DomicileExecutor();
                $domicileExecutor->setDomicile($domicile);
                $domicileExecutor->setExecutor($executor);
                $domicileExecutor->setCreatedAt(new \DateTimeImmutable()); // Date de création de l'association
                $this->entityManager->persist($domicileExecutor);
            }
        }

        // Validation
        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $this->json($task, Response::HTTP_CREATED, [], [
            'groups' => ['task:read']
        ]);
    }

    /**
     * Update a task
     */
    #[Route('/{id}', name: 'api_tasks_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json([
                'error' => 'Task not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'error' => 'Invalid JSON data'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Mise à jour des champs
        if (isset($data['title'])) {
            $task->setTitle($data['title']);
        }
        if (isset($data['description'])) {
            $task->setDescription($data['description']);
        }
        if (isset($data['status'])) {
            try {
                $task->setStatus($data['status']);
            } catch (\InvalidArgumentException $e) {
                return $this->json([
                    'error' => $e->getMessage()
                ], Response::HTTP_BAD_REQUEST);
            }
        }
        if (isset($data['startTime'])) {
            $task->setStartTime($data['startTime'] ? new \DateTimeImmutable($data['startTime']) : null);
        }
        if (isset($data['endTime'])) {
            $task->setEndTime($data['endTime'] ? new \DateTimeImmutable($data['endTime']) : null);
        }

        // Mise à jour de l'executor
        if (isset($data['executorId'])) {
            if ($data['executorId']) {
                $executor = $this->userRepository->find($data['executorId']);
                if (!$executor) {
                    return $this->json([
                        'error' => 'Executor not found'
                    ], Response::HTTP_NOT_FOUND);
                }
                $task->setAssignedTo($executor);
            } else {
                $task->setAssignedTo(null);
            }
        }

        // Mise à jour du domicile
        if (isset($data['domicileId'])) {
            if ($data['domicileId']) {
                $domicile = $this->domicileRepository->find($data['domicileId']);
                if (!$domicile) {
                    return $this->json([
                        'error' => 'Domicile not found'
                    ], Response::HTTP_NOT_FOUND);
                }
                $task->setDomicile($domicile);
            } else {
                $task->setDomicile(null);
            }
        }

        // Validation
        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->flush();

        return $this->json($task, Response::HTTP_OK, [], [
            'groups' => ['task:read']
        ]);
    }

    /**
     * Delete a task
     */
    #[Route('/{id}', name: 'api_tasks_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json([
                'error' => 'Task not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($task);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Task deleted successfully'
        ], Response::HTTP_OK);
    }

    /**
     * Finish a task (mark as completed)
     */
    #[Route('/{id}/finish', name: 'api_tasks_finish', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function finish(int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json([
                'error' => 'Task not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();

        // Vérifier que l'executor est bien assigné à cette tâche
        if (!$this->isGranted('ROLE_ADMIN') && $task->getAssignedTo() !== $user) {
            return $this->json([
                'error' => 'You are not assigned to this task'
            ], Response::HTTP_FORBIDDEN);
        }

        // Vérifier que la tâche n'est pas déjà terminée
        if ($task->isCompleted()) {
            return $this->json([
                'error' => 'Task is already completed'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Marquer la tâche comme terminée
        $task->setStatus(Task::STATUS_COMPLETED);
        $task->setActualEndTime(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $this->json($task, Response::HTTP_OK, [], [
            'groups' => ['task:read']
        ]);
    }

    /**
     * Postpone a task (change start time)
     */
    #[Route('/{id}/postpone', name: 'api_tasks_postpone', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function postpone(int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json([
                'error' => 'Task not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();

        // Vérifier que l'executor est bien assigné à cette tâche
        if (!$this->isGranted('ROLE_ADMIN') && $task->getAssignedTo() !== $user) {
            return $this->json([
                'error' => 'You are not assigned to this task'
            ], Response::HTTP_FORBIDDEN);
        }

        // Vérifier que la tâche n'est pas déjà terminée
        if ($task->isCompleted()) {
            return $this->json([
                'error' => 'Cannot postpone a completed task'
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['newStartTime'])) {
            return $this->json([
                'error' => 'newStartTime is required'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $newStartTime = new \DateTimeImmutable($data['newStartTime']);
            $task->setStartTime($newStartTime);

            // Optionnel: mettre à jour le statut en TODO si la tâche était en cours
            if ($task->isInProgress()) {
                $task->setStatus(Task::STATUS_TODO);
            }

            $this->entityManager->flush();

            return $this->json($task, Response::HTTP_OK, [], [
                'groups' => ['task:read']
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Invalid date format'
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Démarrer une tâche (actualStartTime)
     */
    #[Route('/{id}/start', name: 'task_start', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function startTask(int $id): JsonResponse
    {
        try {
            $task = $this->taskRepository->find($id);
            
            if (!$task) {
                return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur est assigné à cette tâche
            $user = $this->getUser();
            if (!$this->isGranted('ROLE_ADMIN') && (!$task->getAssignedTo() || $task->getAssignedTo() !== $user)) {
                return $this->json(['error' => 'You are not assigned to this task'], Response::HTTP_FORBIDDEN);
            }

            if ($task->getStatus() !== Task::STATUS_TODO) {
                return $this->json(['error' => 'Task must be in TODO status'], Response::HTTP_BAD_REQUEST);
            }

            $task->setStatus(Task::STATUS_IN_PROGRESS);
            $task->setActualStartTime(new \DateTimeImmutable());
            $task->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->flush();

            return $this->json($task, Response::HTTP_OK, [], ['groups' => ['task:read']]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to start task', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Annuler une tâche en cours (retour à TODO)
     */
    #[Route('/{id}/cancel', name: 'task_cancel', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function cancelTask(int $id): JsonResponse
    {
        try {
            $task = $this->taskRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$this->isGranted('ROLE_ADMIN') && (!$task->getAssignedTo() || $task->getAssignedTo() !== $user)) {
                return $this->json(['error' => 'You are not assigned to this task'], Response::HTTP_FORBIDDEN);
            }

            if ($task->getStatus() !== Task::STATUS_IN_PROGRESS) {
                return $this->json(['error' => 'Task must be in progress to cancel'], Response::HTTP_BAD_REQUEST);
            }

            $task->setStatus(Task::STATUS_TODO);
            $task->setActualStartTime(null);
            $task->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->flush();

            return $this->json($task, Response::HTTP_OK, [], ['groups' => ['task:read']]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to cancel task', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Terminer une tâche (actualEndTime)
     */
    #[Route('/{id}/complete', name: 'task_complete', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function completeTask(int $id): JsonResponse
    {
        try {
            $task = $this->taskRepository->find($id);
            
            if (!$task) {
                return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur est assigné à cette tâche
            $user = $this->getUser();
            if (!$this->isGranted('ROLE_ADMIN') && (!$task->getAssignedTo() || $task->getAssignedTo() !== $user)) {
                return $this->json(['error' => 'You are not assigned to this task'], Response::HTTP_FORBIDDEN);
            }

            if ($task->getStatus() !== Task::STATUS_IN_PROGRESS) {
                return $this->json(['error' => 'Task must be in progress'], Response::HTTP_BAD_REQUEST);
            }

            $task->setStatus(Task::STATUS_COMPLETED);
            $task->setActualEndTime(new \DateTimeImmutable());
            $task->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->flush();

            return $this->json($task, Response::HTTP_OK, [], ['groups' => ['task:read']]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to complete task', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

