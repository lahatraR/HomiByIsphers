<?php

namespace App\Message;

/**
 * Message asynchrone pour envoyer un email de vérification
 */
class SendVerificationEmailMessage
{
    public function __construct(
        private int $userId,
        private string $email,
        private string $token,
        private string $firstName = '',
    ) {
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }
}
