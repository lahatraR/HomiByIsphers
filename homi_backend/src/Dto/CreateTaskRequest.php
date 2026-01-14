<?php


namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class CreateTaskRequest
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 255)]
    public string $title;

    #[Assert\Length(max: 1000)]
    public ?string $description = null;

    #[Assert\Choice(choices: ['TODO', 'IN_PROGRESS', 'DONE'])]
    public string $status = 'TODO';

    #[Assert\NotBlank]
    public int $userId;
}