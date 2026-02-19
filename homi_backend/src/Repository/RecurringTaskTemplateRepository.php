<?php

namespace App\Repository;

use App\Entity\RecurringTaskTemplate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RecurringTaskTemplate>
 */
class RecurringTaskTemplateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RecurringTaskTemplate::class);
    }

    /**
     * Retourne les templates actifs d'un admin.
     * @return RecurringTaskTemplate[]
     */
    public function findActiveByAdmin(int $adminId): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.createdBy = :adminId')
            ->andWhere('r.isActive = true')
            ->setParameter('adminId', $adminId)
            ->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne tous les templates actifs qui doivent être générés.
     * @return RecurringTaskTemplate[]
     */
    public function findAllActive(): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.isActive = true')
            ->andWhere('r.endDate IS NULL OR r.endDate >= :today')
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->getQuery()
            ->getResult();
    }
}
