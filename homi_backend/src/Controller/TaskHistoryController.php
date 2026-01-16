<?php
namespace App\Controller;

use App\Entity\Task;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\Persistence\ManagerRegistry;
#[Route('/api/task-history')]
class TaskHistoryController extends AbstractController
{
    private $doctrine;


    public function __construct(ManagerRegistry $doctrine)
    {
        $this->doctrine = $doctrine;
    }
    // Récupérer l'historique d'une tâche
    #[Route('/{task_id}/', name: 'task_history', methods: ['GET'])]
    public function getHistory(int $task_id): JsonResponse
    {
        $task = $this->doctrine->getRepository(Task::class)->find($task_id);
        if (!$task)
            return $this->json(['error' => 'Task not found'], 404);

        $histories = $task->getTaskHistories(); // collection TaskHistory
        return $this->json($histories);
    }
}
