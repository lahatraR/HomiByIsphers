<?php

namespace App\Entity;

use App\Repository\MonthlyBudgetRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MonthlyBudgetRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'unique_budget_month', columns: ['domicile_id', 'year', 'month'])]
class MonthlyBudget
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Domicile::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Domicile $domicile = null;

    #[ORM\Column(type: 'integer')]
    #[Assert\Range(min: 2020, max: 2040)]
    private int $year;

    #[ORM\Column(type: 'integer')]
    #[Assert\Range(min: 1, max: 12)]
    private int $month;

    /** Budget maximum en euros */
    #[ORM\Column(type: 'float')]
    #[Assert\Positive(message: 'Le budget doit être positif')]
    private float $budgetAmount = 0;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

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

    public function getDomicile(): ?Domicile { return $this->domicile; }
    public function setDomicile(?Domicile $domicile): static { $this->domicile = $domicile; return $this; }

    public function getYear(): int { return $this->year; }
    public function setYear(int $year): static { $this->year = $year; return $this; }

    public function getMonth(): int { return $this->month; }
    public function setMonth(int $month): static { $this->month = $month; return $this; }

    public function getBudgetAmount(): float { return $this->budgetAmount; }
    public function setBudgetAmount(float $amount): static { $this->budgetAmount = $amount; return $this; }

    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $user): static { $this->createdBy = $user; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updatedAt; }
}
