<?php

namespace App\Entity;

use App\Repository\TaskReviewRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TaskReviewRepository::class)]
#[ORM\HasLifecycleCallbacks]
class TaskReview
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Task $task = null;

    #[ORM\Column(type: 'integer')]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: 'La note doit être entre 1 et 5')]
    private int $rating = 5;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    /** L'admin qui a laissé l'avis */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $reviewedBy = null;

    /** L'exécuteur évalué (dénormalisé pour faciliter les requêtes) */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $executor = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // ─── Getters & Setters ──────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getTask(): ?Task { return $this->task; }
    public function setTask(?Task $task): static { $this->task = $task; return $this; }

    public function getRating(): int { return $this->rating; }
    public function setRating(int $rating): static { $this->rating = $rating; return $this; }

    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }

    public function getReviewedBy(): ?User { return $this->reviewedBy; }
    public function setReviewedBy(?User $user): static { $this->reviewedBy = $user; return $this; }

    public function getExecutor(): ?User { return $this->executor; }
    public function setExecutor(?User $user): static { $this->executor = $user; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
}
