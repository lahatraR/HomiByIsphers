<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    #[Assert\NotBlank(message: 'Email is required')]
    #[Assert\Email(message: 'Invalid email format')]
    public string $email = '';

    #[Assert\NotBlank(message: 'Password is required')]
    #[Assert\Length(min: 8, minMessage: 'Password must be at least 8 characters')]
    public string $password = '';

    #[Assert\NotBlank(message: 'First name is required')]
    #[Assert\Length(max: 100, maxMessage: 'First name cannot exceed 100 characters')]
    public string $firstName = '';

    #[Assert\NotBlank(message: 'Last name is required')]
    #[Assert\Length(max: 100, maxMessage: 'Last name cannot exceed 100 characters')]
    public string $lastName = '';

    // Role is always set server-side, never from client input
    public string $role = 'ROLE_USER';
}
