<?php

namespace App\Repository;

use App\Entity\PendingEmail;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PendingEmailRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PendingEmail::class);
    }

    /**
     * Trouver tous les emails en attente d'envoi
     */
    public function findPending()
    {
        return $this->createQueryBuilder('p')
            ->where('p.sentAt IS NULL')
            ->andWhere('p.failureReason IS NULL')
            ->orderBy('p.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouver les emails en échec
     */
    public function findFailed()
    {
        return $this->createQueryBuilder('p')
            ->where('p.failureReason IS NOT NULL')
            ->orderBy('p.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function save(PendingEmail $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PendingEmail $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
