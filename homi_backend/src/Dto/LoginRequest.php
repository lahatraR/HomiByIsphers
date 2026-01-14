<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class LoginRequest
{
    #[Assert\NotBlank(message: 'L\'email ne doit pas être vide')]
    #[Assert\Email(message: 'L\'email doit être une adresse email valide')]
    public string $email = '';

    #[Assert\NotBlank(message: 'Le mot de passe ne doit pas être vide')]
    #[Assert\Length(
        min: 1,
        minMessage: 'Le mot de passe doit avoir au moins 1 caractère'
    )]
    public string $password = '';
}
