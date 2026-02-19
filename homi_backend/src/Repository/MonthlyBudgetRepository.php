<?php

namespace App\Repository;

use App\Entity\MonthlyBudget;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MonthlyBudget>
 */
class MonthlyBudgetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MonthlyBudget::class);
    }

    public function findForDomicileMonth(int $domicileId, int $year, int $month): ?MonthlyBudget
    {
        return $this->createQueryBuilder('b')
            ->andWhere('b.domicile = :domicileId')
            ->andWhere('b.year = :year')
            ->andWhere('b.month = :month')
            ->setParameter('domicileId', $domicileId)
            ->setParameter('year', $year)
            ->setParameter('month', $month)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Tous les budgets d'un admin (via domiciles qu'il possède).
     * @return MonthlyBudget[]
     */
    public function findByAdmin(int $adminId): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.domicile', 'd')
            ->andWhere('d.createdBy = :adminId')
            ->setParameter('adminId', $adminId)
            ->orderBy('b.year', 'DESC')
            ->addOrderBy('b.month', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
