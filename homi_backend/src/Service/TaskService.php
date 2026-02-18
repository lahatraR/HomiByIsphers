<?php
namespace App\Service;

use App\Entity\Task;
use App\Entity\User;
use App\Entity\Domicile;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;

class TaskService
{
    private EntityManagerInterface $em;
    private TaskRepository $taskRepository;

    public function __construct(EntityManagerInterface $em, TaskRepository $taskRepository)
    {
        $this->em = $em;
        $this->taskRepository = $taskRepository;
    }

    public function createTask(string $title, string $description, Domicile $domicile, User $assignedTo, \DateTimeImmutable $startTime,\DateTimeImmutable $endTime): Task
    {
        $task = new Task();
        $task->setTitle($title);
        $task->setDescription($description);
        $task->setDomicile($domicile);
        $task->setAssignedTo($assignedTo);
        $task->setStatus('TODO');
        $task->setStartTime($startTime);
        $task->setEndTime($endTime);
        $task->setCreatedAt(new \DateTimeImmutable());
        $task->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($task);
        $this->em->flush();

        return $task;
    }

    public function updateTask(Task $task, array $data): Task
    {
        if (isset($data['title'])) $task->setTitle($data['title']);
        if (isset($data['description'])) $task->setDescription($data['description']);
        if (isset($data['status'])) $task->setStatus($data['status']);
        if (isset($data['assignedTo'])) $task->setAssignedTo($data['assignedTo']);
        if (isset($data['end_time'])) $task->setEndTime($data['end_time']);
        $task->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();
        return $task;
    }

    public function finishTask(Task $task): Task
    {
        $task->setStatus('COMPLETED');
        $task->setEndTime(new \DateTimeImmutable());
        $task->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();
        return $task;
    }

    public function postponeTask(Task $task, \DateTimeImmutable $newStartTime): Task
    {
        $task->setStartTime($newStartTime);
        $task->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();
        return $task;
    }

    public function reassignTask(Task $task, User $newExecutor): Task
    {
        $task->setAssignedTo($newExecutor);
        $task->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();
        return $task;
    }

    public function getTask(int $id): ?Task
    {
        return $this->taskRepository->find($id);
    }

    public function deleteTask(Task $task): void
    {
        $this->em->remove($task);
        $this->em->flush();
    }
    public function listTasks(User $user, int $page = 1, int $limit = 10, ?int $domicileId = null, ?string $status = null): array
    {
        $queryBuilder = $this->taskRepository->createQueryBuilder('t');

        // Filtrer selon les permissions
        if (!in_array('ROLE_ADMIN', $user->getRoles())) {
            // Les utilisateurs non-admin voient seulement les tâches qui leur sont assignées ou de leurs domiciles
            $queryBuilder->leftJoin('t.domicile', 'd')
                ->where('t.assignedTo = :user OR d.owner = :user')
                ->setParameter('user', $user);
        }

        // Filtrer par domicile si spécifié
        if ($domicileId) {
            $queryBuilder->andWhere('t.domicile = :domicileId')
                ->setParameter('domicileId', $domicileId);
        }

        // Filtrer par statut si spécifié
        if ($status !== null) {
            $statusBool = $status === 'true' || $status === '1' || $status === 'DONE';
            $queryBuilder->andWhere('t.status = :status')
                ->setParameter('status', $statusBool);
        }

        // Pagination
        $offset = ($page - 1) * $limit;
        $queryBuilder->setFirstResult($offset)
            ->setMaxResults($limit)
            ->orderBy('t.start_time', 'DESC');

        return $queryBuilder->getQuery()->getResult();
    }
}
