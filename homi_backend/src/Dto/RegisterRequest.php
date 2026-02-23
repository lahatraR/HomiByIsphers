<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    #[Assert\NotBlank(message: "L'adresse email est obligatoire.")]
    #[Assert\Email(message: "Le format de l'adresse email est invalide.")]
    public string $email = '';

    #[Assert\NotBlank(message: 'Le mot de passe est obligatoire.')]
    #[Assert\Length(
        min: 8,
        max: 128,
        minMessage: 'Le mot de passe doit contenir au moins 8 caractères.',
        maxMessage: 'Le mot de passe ne peut pas dépasser 128 caractères.',
    )]
    #[Assert\Regex(
        pattern: '/[A-Z]/',
        message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
    )]
    #[Assert\Regex(
        pattern: '/[a-z]/',
        message: 'Le mot de passe doit contenir au moins une lettre minuscule.',
    )]
    #[Assert\Regex(
        pattern: '/\d/',
        message: 'Le mot de passe doit contenir au moins un chiffre.',
    )]
    public string $password = '';

    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    #[Assert\Length(max: 100, maxMessage: 'Le prénom ne peut pas dépasser 100 caractères.')]
    public string $firstName = '';

    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(max: 100, maxMessage: 'Le nom ne peut pas dépasser 100 caractères.')]
    public string $lastName = '';

    // Role is always set server-side, never from client input
    public string $role = 'ROLE_USER';
}
