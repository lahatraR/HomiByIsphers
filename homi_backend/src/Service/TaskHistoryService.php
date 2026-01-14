<?php

namespace App\Service;

use App\Entity\Task;
use App\Entity\TaskHistory;
use App\Entity\TaskActionType;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class TaskHistoryService
{
    public function __construct(private EntityManagerInterface $em)
    {
    }

    /**
     * Enregistrer une action dans l'historique d'une tâche
     */
    public function log(Task $task, User $executor, int|TaskActionType $action): TaskHistory
    {
        $history = new TaskHistory();
        $history->setTask($task);
        $history->setExecutor($executor);

        if ($action instanceof TaskActionType) {
            $history->setAction($action->value);
        } else {
            $history->setAction($action);
        }

        $history->setTimestamp(new \DateTimeImmutable());

        $this->em->persist($history);
        $this->em->flush();

        return $history;
    }

    /**
     * Récupérer l'historique d'une tâche
     */
    public function getTaskHistory(Task $task): array
    {
        return $this->em
            ->getRepository(TaskHistory::class)
            ->findBy(['task' => $task], ['timestamp' => 'DESC']);
    }
}

