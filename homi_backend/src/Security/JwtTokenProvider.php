<?php

namespace App\Security;

use App\Entity\User;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Token\Plain;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\ValidAt;
use Lcobucci\Clock\SystemClock;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class JwtTokenProvider
{
    private Configuration $config;
    private int $expirationTime;

    public function __construct(
        #[Autowire(param: 'kernel.secret')] string $secret,
        #[Autowire(param: 'app.jwt.expiration')] int $expirationTime = 3600,
    ) {
        $this->expirationTime = $expirationTime;
        $this->config = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($secret)
        );
        
        // Configurer les contraintes de validation
        $this->config->setValidationConstraints(
            new SignedWith($this->config->signer(), $this->config->signingKey()),
            new ValidAt(SystemClock::fromSystemTimezone())
        );
    }

    /**
     * Générer un token JWT pour un utilisateur
     */
    public function generateToken(User $user): Plain
    {
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify("+{$this->expirationTime} seconds");

        return $this->config
            ->builder()
            ->issuedAt($now)
            ->expiresAt($expiresAt)
            ->withClaim('user_id', $user->getId())
            ->withClaim('email', $user->getEmail())
            ->withClaim('role', $user->getRole())
            ->getToken($this->config->signer(), $this->config->signingKey());
    }

    /**
     * Valider et parser un token JWT
     */
    public function validateToken(string $token): ?Plain
    {
        try {
            $parsedToken = $this->config->parser()->parse($token);

            if (!($parsedToken instanceof Plain)) {
                return null;
            }

            if (!$this->config->validator()->validate($parsedToken, ...$this->config->validationConstraints())) {
                return null;
            }

            $claims = $parsedToken->claims();
            if (!$claims->has('user_id') || !$claims->has('email') || !$claims->has('role')) {
                return null;
            }

            return $parsedToken;
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Extraire l'ID utilisateur du token
     */
    public function getUserIdFromToken(Plain $token): ?int
    {
        try {
            return (int) $token->claims()->get('user_id');
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Extraire le rôle du token
     */
    public function getRoleFromToken(Plain $token): ?string
    {
        try {
            return $token->claims()->get('role');
        } catch (\Exception) {
            return null;
        }
    }

    public function getExpirationTime(): int
    {
        return $this->expirationTime;
    }
}
