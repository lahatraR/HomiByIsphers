<?php

namespace App\Dto;

class AuthResponse
{
    public function __construct(
        public string $token,
        public int $expiresIn,
        public int $userId,
        public string $email,
        public string $role,
        public ?string $firstName = null,
        public ?string $lastName = null,
    ) {
    }
}
