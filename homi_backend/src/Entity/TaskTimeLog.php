<?php

namespace App\Entity;

use App\Repository\TaskTimeLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TaskTimeLogRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Table(name: 'task_time_log')]
class TaskTimeLog
{
    // Constantes de statut
    public const STATUS_PENDING = 'PENDING';      // En attente de validation
    public const STATUS_APPROVED = 'APPROVED';    // Approuvé par l'admin
    public const STATUS_REJECTED = 'REJECTED';    // Rejeté par l'admin

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['time_log:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['time_log:read', 'time_log:write'])]
    #[Assert\NotNull(message: 'La tâche est requise')]
    private ?Task $task = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['time_log:read'])]
    private ?User $executor = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['time_log:read', 'time_log:write'])]
    #[Assert\NotNull(message: 'L\'heure de début est requise')]
    private ?\DateTimeInterface $startTime = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['time_log:read', 'time_log:write'])]
    #[Assert\NotNull(message: 'L\'heure de fin est requise')]
    private ?\DateTimeInterface $endTime = null;

    // Heures travaillées en décimal (ex: 2.5 pour 2h30)
    #[ORM\Column(type: 'float')]
    #[Groups(['time_log:read'])]
    private float $hoursWorked = 0;

    #[ORM\Column(length: 50)]
    #[Groups(['time_log:read', 'time_log:write'])]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['time_log:read', 'time_log:write'])]
    private ?string $notes = null;

    // Admin qui a validé/rejeté
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['time_log:read'])]
    private ?User $validatedBy = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['time_log:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['time_log:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateHoursWorked();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateHoursWorked();
    }

    /**
     * Calcule les heures travaillées basé sur startTime et endTime
     */
    private function calculateHoursWorked(): void
    {
        if ($this->startTime && $this->endTime) {
            $interval = $this->startTime->diff($this->endTime);
            // Convertir en heures décimales
            $this->hoursWorked = (float) ($interval->days * 24 + $interval->h + ($interval->i / 60) + ($interval->s / 3600));
        }
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTask(): ?Task
    {
        return $this->task;
    }

    public function setTask(?Task $task): static
    {
        $this->task = $task;
        return $this;
    }

    public function getExecutor(): ?User
    {
        return $this->executor;
    }

    public function setExecutor(?User $executor): static
    {
        $this->executor = $executor;
        return $this;
    }

    public function getStartTime(): ?\DateTimeInterface
    {
        return $this->startTime;
    }

    public function setStartTime(\DateTimeInterface $startTime): static
    {
        $this->startTime = $startTime;
        return $this;
    }

    public function getEndTime(): ?\DateTimeInterface
    {
        return $this->endTime;
    }

    public function setEndTime(\DateTimeInterface $endTime): static
    {
        $this->endTime = $endTime;
        return $this;
    }

    public function getHoursWorked(): float
    {
        return $this->hoursWorked;
    }

    public function setHoursWorked(float $hoursWorked): static
    {
        $this->hoursWorked = $hoursWorked;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, [self::STATUS_PENDING, self::STATUS_APPROVED, self::STATUS_REJECTED])) {
            throw new \InvalidArgumentException('Invalid status');
        }
        $this->status = $status;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;
        return $this;
    }

    public function getValidatedBy(): ?User
    {
        return $this->validatedBy;
    }

    public function setValidatedBy(?User $validatedBy): static
    {
        $this->validatedBy = $validatedBy;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }
}
