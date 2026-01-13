<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    #[Assert\NotBlank(message: 'L\'email ne doit pas être vide')]
    #[Assert\Email(message: 'L\'email doit être une adresse email valide')]
    public string $email = '';

    #[Assert\NotBlank(message: 'Le mot de passe ne doit pas être vide')]
    #[Assert\Length(
        min: 8,
        max: 255,
        minMessage: 'Le mot de passe doit avoir au moins 8 caractères',
        maxMessage: 'Le mot de passe ne doit pas dépasser 255 caractères'
    )]
    #[Assert\Regex(
        pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    )]
    public string $password = '';

    #[Assert\NotBlank(message: 'Le rôle ne doit pas être vide')]
    #[Assert\Choice(
        choices: ['ROLE_USER', 'ROLE_ADMIN'],
        message: 'Le rôle doit être ROLE_USER ou ROLE_ADMIN'
    )]
    public string $role = 'ROLE_USER';
}
