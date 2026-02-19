<?php
namespace App\Controller;

use App\Entity\Task;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\Persistence\ManagerRegistry;
#[Route('/api/task-history')]
#[IsGranted('ROLE_USER')]
class TaskHistoryController extends AbstractController
{
    private $doctrine;


    public function __construct(ManagerRegistry $doctrine)
    {
        $this->doctrine = $doctrine;
    }
    // Récupérer l'historique d'une tâche
    #[Route('/{task_id}', name: 'task_history', methods: ['GET'])]
    public function getHistory(int $task_id): JsonResponse
    {
        $task = $this->doctrine->getRepository(Task::class)->find($task_id);
        if (!$task)
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);

        // Vérifier que l'utilisateur est admin ou assigné à la tâche
        /** @var User $user */
        $user = $this->getUser();
        if (!$this->isGranted('ROLE_ADMIN') && $task->getAssignedTo() !== $user) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $histories = $task->getTaskHistories();
        $data = array_map(fn($h) => [
            'id' => $h->getId(),
            'action' => $h->getAction(),
            'timestamp' => $h->getTimestamp()?->format('c'),
            'executorId' => $h->getExecutor()?->getId(),
        ], $histories->toArray());

        return $this->json($data);
    }
}
