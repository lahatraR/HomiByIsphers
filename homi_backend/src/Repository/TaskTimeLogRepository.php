<?php

namespace App\Repository;

use App\Entity\TaskTimeLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TaskTimeLog>
 */
class TaskTimeLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TaskTimeLog::class);
    }

    /**
     * Trouver tous les logs d'un executeur
     */
    public function findByExecutor($executor)
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.executor = :executor')
            ->setParameter('executor', $executor)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver tous les logs d'une tâche
     */
    public function findByTask($task)
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.task = :task')
            ->setParameter('task', $task)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les logs en attente de validation
     */
    public function findPending()
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.status = :status')
            ->setParameter('status', TaskTimeLog::STATUS_PENDING)
            ->orderBy('t.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les logs approuvés
     */
    public function findApproved()
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.status = :status')
            ->setParameter('status', TaskTimeLog::STATUS_APPROVED)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
