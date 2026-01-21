<?php

namespace App\Repository;

use App\Entity\Invoice;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Invoice>
 */
class InvoiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invoice::class);
    }

    /**
     * Trouver les factures d'un exécuteur
     */
    public function findByExecutor($executor)
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.executor = :executor')
            ->setParameter('executor', $executor)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les factures d'un domicile
     */
    public function findByDomicile($domicile)
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.domicile = :domicile')
            ->setParameter('domicile', $domicile)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les factures par statut
     */
    public function findByStatus(string $status)
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.status = :status')
            ->setParameter('status', $status)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les factures en retard
     */
    public function findOverdue()
    {
        $now = new \DateTimeImmutable();
        
        return $this->createQueryBuilder('i')
            ->andWhere('i.status IN (:statuses)')
            ->andWhere('i.dueDate < :now')
            ->setParameter('statuses', [Invoice::STATUS_DRAFT, Invoice::STATUS_SENT])
            ->setParameter('now', $now)
            ->orderBy('i.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les factures non payées
     */
    public function findUnpaid()
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.status IN (:statuses)')
            ->setParameter('statuses', [Invoice::STATUS_DRAFT, Invoice::STATUS_SENT, Invoice::STATUS_OVERDUE])
            ->orderBy('i.dueDate', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
