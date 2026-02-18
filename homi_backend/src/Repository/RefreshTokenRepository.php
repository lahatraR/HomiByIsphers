<?php

namespace App\Repository;

use App\Entity\RefreshToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class RefreshTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RefreshToken::class);
    }

    public function findValidToken(string $token): ?RefreshToken
    {
        $qb = $this->createQueryBuilder('r')
            ->andWhere('r.token = :token')
            ->andWhere('r.expiresAt > :now')
            ->setParameter('token', $token)
            ->setParameter('now', new \DateTimeImmutable());
        return $qb->getQuery()->getOneOrNullResult();
    }

    public function invalidateUserTokens(int $userId): void
    {
        $this->createQueryBuilder('r')
            ->delete()
            ->where('r.user = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()->execute();
    }
}
