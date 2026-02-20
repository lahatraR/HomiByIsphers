<?php

namespace App\Service;

use App\Entity\TaskTimeLog;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\TaskTimeLogRepository;
use Doctrine\ORM\EntityManagerInterface;

class TimeTrackingService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TaskTimeLogRepository $timeLogRepository
    ) {
    }

    /**
     * Créer un nouveau log de temps
     */
    public function createTimeLog(
        Task $task,
        User $executor,
        \DateTimeInterface $startTime,
        \DateTimeInterface $endTime,
        ?string $notes = null
    ): TaskTimeLog {
        // Vérifier que endTime > startTime
        if ($endTime <= $startTime) {
            throw new \InvalidArgumentException('End time must be after start time');
        }

        $timeLog = new TaskTimeLog();
        $timeLog->setTask($task);
        $timeLog->setExecutor($executor);
        $timeLog->setStartTime($startTime);
        $timeLog->setEndTime($endTime);
        $timeLog->setNotes($notes);
        $timeLog->setStatus(TaskTimeLog::STATUS_PENDING);

        $this->entityManager->persist($timeLog);
        $this->entityManager->flush();

        return $timeLog;
    }

    /**
     * Mettre à jour un log de temps
     */
    public function updateTimeLog(
        TaskTimeLog $timeLog,
        \DateTimeInterface $startTime,
        \DateTimeInterface $endTime,
        ?string $notes = null
    ): TaskTimeLog {
        // Vérifier que endTime > startTime
        if ($endTime <= $startTime) {
            throw new \InvalidArgumentException('End time must be after start time');
        }

        $timeLog->setStartTime($startTime);
        $timeLog->setEndTime($endTime);
        
        if ($notes !== null) {
            $timeLog->setNotes($notes);
        }

        $this->entityManager->flush();

        return $timeLog;
    }

    /**
     * Valider un log de temps (Admin only)
     */
    public function approveTimeLog(TaskTimeLog $timeLog, User $admin): TaskTimeLog
    {
        if (!in_array('ROLE_ADMIN', $admin->getRoles())) {
            throw new \RuntimeException('Only admins can approve time logs');
        }

        $timeLog->setStatus(TaskTimeLog::STATUS_APPROVED);
        $timeLog->setValidatedBy($admin);

        // Marquer la tâche associée comme terminée
        $task = $timeLog->getTask();
        if ($task && $task->getStatus() !== Task::STATUS_COMPLETED) {
            $task->setStatus(Task::STATUS_COMPLETED);

            // Remplir les timestamps réels à partir du time log
            $startTime = $timeLog->getStartTime();
            $endTime = $timeLog->getEndTime();

            if (!$task->getActualStartTime() && $startTime) {
                $task->setActualStartTime(
                    $startTime instanceof \DateTimeImmutable
                        ? $startTime
                        : \DateTimeImmutable::createFromInterface($startTime)
                );
            }
            if ($endTime) {
                $task->setActualEndTime(
                    $endTime instanceof \DateTimeImmutable
                        ? $endTime
                        : \DateTimeImmutable::createFromInterface($endTime)
                );
            }
        }

        $this->entityManager->flush();

        return $timeLog;
    }

    /**
     * Rejeter un log de temps (Admin only)
     */
    public function rejectTimeLog(TaskTimeLog $timeLog, User $admin, ?string $reason = null): TaskTimeLog
    {
        if (!in_array('ROLE_ADMIN', $admin->getRoles())) {
            throw new \RuntimeException('Only admins can reject time logs');
        }

        $timeLog->setStatus(TaskTimeLog::STATUS_REJECTED);
        $timeLog->setValidatedBy($admin);
        
        if ($reason !== null) {
            $timeLog->setNotes($reason);
        }

        $this->entityManager->flush();

        return $timeLog;
    }

    /**
     * Vérifier si un utilisateur peut modifier ce log (propriétaire ou admin)
     */
    public function canModify(TaskTimeLog $timeLog, User $user): bool
    {
        // Admin peut toujours modifier
        if (in_array('ROLE_ADMIN', $user->getRoles())) {
            return true;
        }

        // L'exécuteur ne peut modifier que ses propres logs en attente
        if ($timeLog->getExecutor()->getId() === $user->getId() 
            && $timeLog->getStatus() === TaskTimeLog::STATUS_PENDING) {
            return true;
        }

        return false;
    }

    /**
     * Vérifier si un utilisateur peut voir ce log
     */
    public function canView(TaskTimeLog $timeLog, User $user): bool
    {
        // Admin voit tous les logs
        if (in_array('ROLE_ADMIN', $user->getRoles())) {
            return true;
        }

        // L'exécuteur voit ses propres logs
        if ($timeLog->getExecutor()->getId() === $user->getId()) {
            return true;
        }

        return false;
    }

    /**
     * Calculer les heures totales par exécuteur sur une période
     */
    public function calculateTotalHours(User $executor, ?\DateTime $startDate = null, ?\DateTime $endDate = null): float
    {
        $query = $this->timeLogRepository->createQueryBuilder('t')
            ->select('SUM(t.hoursWorked) as totalHours')
            ->andWhere('t.executor = :executor')
            ->andWhere('t.status = :status')
            ->setParameter('executor', $executor)
            ->setParameter('status', TaskTimeLog::STATUS_APPROVED);

        if ($startDate) {
            $query->andWhere('t.createdAt >= :startDate')
                ->setParameter('startDate', $startDate);
        }

        if ($endDate) {
            $query->andWhere('t.createdAt <= :endDate')
                ->setParameter('endDate', $endDate);
        }

        $result = $query->getQuery()->getOneOrNullResult();
        return (float) ($result['totalHours'] ?? 0);
    }

    /**
     * Obtenir les logs d'un exécuteur avec un statut optionnel
     */
    public function getExecutorLogs(User $executor, ?string $status = null): array
    {
        $query = $this->timeLogRepository->createQueryBuilder('t')
            ->andWhere('t.executor = :executor')
            ->setParameter('executor', $executor)
            ->orderBy('t.createdAt', 'DESC');

        if ($status) {
            $query->andWhere('t.status = :status')
                ->setParameter('status', $status);
        }

        return $query->getQuery()->getResult();
    }

    /**
     * Supprimer un log (seulement si en attente et appartient à l'utilisateur)
     */
    public function deleteTimeLog(TaskTimeLog $timeLog, User $user): void
    {
        if (!$this->canModify($timeLog, $user)) {
            throw new \RuntimeException('You cannot delete this time log');
        }

        $this->entityManager->remove($timeLog);
        $this->entityManager->flush();
    }

    /**
     * Statistiques globales pour l'admin (heures et statuts)
     */
    public function getAdminStats(): array
    {
        // Totaux par statut
        $totals = $this->timeLogRepository->createQueryBuilder('t')
            ->select('t.status', 'COUNT(t.id) AS count', 'COALESCE(SUM(t.hoursWorked), 0) AS hours')
            ->groupBy('t.status')
            ->getQuery()
            ->getArrayResult();

        $statusMap = [
            TaskTimeLog::STATUS_PENDING => ['count' => 0, 'hours' => 0.0],
            TaskTimeLog::STATUS_APPROVED => ['count' => 0, 'hours' => 0.0],
            TaskTimeLog::STATUS_REJECTED => ['count' => 0, 'hours' => 0.0],
        ];

        foreach ($totals as $row) {
            $status = $row['status'];
            if (isset($statusMap[$status])) {
                $statusMap[$status]['count'] = (int) ($row['count'] ?? 0);
                $statusMap[$status]['hours'] = (float) ($row['hours'] ?? 0);
            }
        }

        // Heures approuvées par exécuteur
        $hoursByExecutor = $this->timeLogRepository->createQueryBuilder('t')
            ->select('IDENTITY(t.executor) AS executorId', 'u.firstName', 'u.lastName', 'COALESCE(SUM(t.hoursWorked), 0) AS totalHours')
            ->leftJoin('t.executor', 'u')
            ->andWhere('t.status = :status')
            ->setParameter('status', TaskTimeLog::STATUS_APPROVED)
            ->groupBy('t.executor', 'u.firstName', 'u.lastName')
            ->orderBy('totalHours', 'DESC')
            ->getQuery()
            ->getArrayResult();

        // Logs en attente par exécuteur
        $pendingByExecutor = $this->timeLogRepository->createQueryBuilder('t')
            ->select('IDENTITY(t.executor) AS executorId', 'u.firstName', 'u.lastName', 'COUNT(t.id) AS pendingCount')
            ->leftJoin('t.executor', 'u')
            ->andWhere('t.status = :status')
            ->setParameter('status', TaskTimeLog::STATUS_PENDING)
            ->groupBy('t.executor', 'u.firstName', 'u.lastName')
            ->orderBy('pendingCount', 'DESC')
            ->getQuery()
            ->getArrayResult();

        return [
            'statuses' => $statusMap,
            'hoursByExecutor' => $hoursByExecutor,
            'pendingByExecutor' => $pendingByExecutor,
            'totalApprovedHours' => $statusMap[TaskTimeLog::STATUS_APPROVED]['hours'],
            'totalPendingCount' => $statusMap[TaskTimeLog::STATUS_PENDING]['count'],
        ];
    }
}
