<?php

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;

class RefreshTokenService
{
    public function __construct(
        private RefreshTokenRepository $refreshTokenRepository,
        private EntityManagerInterface $em,
    ) {}

    public function generate(User $user, int $ttl = 604800): RefreshToken
    {
        $token = bin2hex(random_bytes(64));
        $expiresAt = new \DateTimeImmutable("+{$ttl} seconds");
        $refreshToken = (new RefreshToken())
            ->setToken($token)
            ->setUser($user)
            ->setExpiresAt($expiresAt);
        $this->em->persist($refreshToken);
        $this->em->flush();
        return $refreshToken;
    }

    public function validate(string $token): ?RefreshToken
    {
        return $this->refreshTokenRepository->findValidToken($token);
    }

    public function invalidateUserTokens(User $user): void
    {
        $this->refreshTokenRepository->invalidateUserTokens($user->getId());
    }
}
