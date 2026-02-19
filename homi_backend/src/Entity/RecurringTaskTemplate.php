<?php

namespace App\Entity;

use App\Repository\RecurringTaskTemplateRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: RecurringTaskTemplateRepository::class)]
#[ORM\HasLifecycleCallbacks]
class RecurringTaskTemplate
{
    public const FREQ_DAILY = 'daily';
    public const FREQ_WEEKLY = 'weekly';
    public const FREQ_BIWEEKLY = 'biweekly';
    public const FREQ_MONTHLY = 'monthly';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le titre est requis')]
    #[Assert\Length(min: 3, max: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: 'La description est requise')]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Domicile::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Domicile $domicile = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $assignedTo = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: [self::FREQ_DAILY, self::FREQ_WEEKLY, self::FREQ_BIWEEKLY, self::FREQ_MONTHLY])]
    private string $frequency = self::FREQ_WEEKLY;

    /** Jour(s) de la semaine (0=dim … 6=sam), séparés par virgule. Ex: "1,3,5" */
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $daysOfWeek = null;

    /** Heure de début prévue (stockée comme string "HH:MM") */
    #[ORM\Column(length: 5, nullable: true)]
    private ?string $preferredStartTime = null;

    /** Durée estimée en minutes */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $estimatedDurationMinutes = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column]
    private bool $isActive = true;

    /** Date de la dernière génération de tâche */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastGeneratedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ─── Getters & Setters ──────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getDomicile(): ?Domicile { return $this->domicile; }
    public function setDomicile(?Domicile $domicile): static { $this->domicile = $domicile; return $this; }

    public function getAssignedTo(): ?User { return $this->assignedTo; }
    public function setAssignedTo(?User $user): static { $this->assignedTo = $user; return $this; }

    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $user): static { $this->createdBy = $user; return $this; }

    public function getFrequency(): string { return $this->frequency; }
    public function setFrequency(string $frequency): static { $this->frequency = $frequency; return $this; }

    public function getDaysOfWeek(): ?string { return $this->daysOfWeek; }
    public function setDaysOfWeek(?string $days): static { $this->daysOfWeek = $days; return $this; }

    public function getPreferredStartTime(): ?string { return $this->preferredStartTime; }
    public function setPreferredStartTime(?string $time): static { $this->preferredStartTime = $time; return $this; }

    public function getEstimatedDurationMinutes(): ?int { return $this->estimatedDurationMinutes; }
    public function setEstimatedDurationMinutes(?int $minutes): static { $this->estimatedDurationMinutes = $minutes; return $this; }

    public function getStartDate(): ?\DateTimeInterface { return $this->startDate; }
    public function setStartDate(\DateTimeInterface $date): static { $this->startDate = $date; return $this; }

    public function getEndDate(): ?\DateTimeInterface { return $this->endDate; }
    public function setEndDate(?\DateTimeInterface $date): static { $this->endDate = $date; return $this; }

    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $active): static { $this->isActive = $active; return $this; }

    public function getLastGeneratedAt(): ?\DateTimeInterface { return $this->lastGeneratedAt; }
    public function setLastGeneratedAt(?\DateTimeInterface $dt): static { $this->lastGeneratedAt = $dt; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updatedAt; }

    /**
     * Retourne un tableau des jours de la semaine configurés.
     * @return int[]
     */
    public function getDaysOfWeekArray(): array
    {
        if (!$this->daysOfWeek) return [];
        return array_map('intval', explode(',', $this->daysOfWeek));
    }

    /**
     * Vérifie si une tâche doit être générée pour une date donnée.
     */
    public function shouldGenerateForDate(\DateTimeInterface $date): bool
    {
        if (!$this->isActive) return false;
        if ($date < $this->startDate) return false;
        if ($this->endDate && $date > $this->endDate) return false;

        $dayOfWeek = (int) $date->format('w'); // 0=dim, 6=sam

        return match ($this->frequency) {
            self::FREQ_DAILY => true,
            self::FREQ_WEEKLY => in_array($dayOfWeek, $this->getDaysOfWeekArray()),
            self::FREQ_BIWEEKLY => in_array($dayOfWeek, $this->getDaysOfWeekArray())
                && $this->isCorrectBiweeklyWeek($date),
            self::FREQ_MONTHLY => (int) $date->format('j') === (int) $this->startDate->format('j'),
            default => false,
        };
    }

    private function isCorrectBiweeklyWeek(\DateTimeInterface $date): bool
    {
        $startWeek = (int) $this->startDate->format('W');
        $currentWeek = (int) $date->format('W');
        return ($currentWeek - $startWeek) % 2 === 0;
    }
}
