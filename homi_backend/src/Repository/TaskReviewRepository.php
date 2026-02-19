<?php

namespace App\Repository;

use App\Entity\TaskReview;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TaskReview>
 */
class TaskReviewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TaskReview::class);
    }

    /**
     * Note moyenne et nombre d'avis pour un exécuteur.
     * @return array{averageRating: float, totalReviews: int}
     */
    public function getExecutorStats(int $executorId): array
    {
        $result = $this->createQueryBuilder('r')
            ->select('AVG(r.rating) as averageRating, COUNT(r.id) as totalReviews')
            ->andWhere('r.executor = :executorId')
            ->setParameter('executorId', $executorId)
            ->getQuery()
            ->getSingleResult();

        return [
            'averageRating' => $result['averageRating'] ? round((float) $result['averageRating'], 1) : 0,
            'totalReviews' => (int) $result['totalReviews'],
        ];
    }

    /**
     * Derniers avis pour un exécuteur.
     * @return TaskReview[]
     */
    public function findByExecutor(int $executorId, int $limit = 20): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.executor = :executorId')
            ->setParameter('executorId', $executorId)
            ->orderBy('r.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
