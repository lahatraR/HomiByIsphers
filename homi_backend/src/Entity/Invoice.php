<?php

namespace App\Entity;

use App\Repository\InvoiceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: InvoiceRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Table(name: 'invoice')]
class Invoice
{
    // Statuts de facture
    public const STATUS_DRAFT = 'DRAFT';           // Brouillon
    public const STATUS_SENT = 'SENT';             // Envoyée
    public const STATUS_PAID = 'PAID';             // Payée
    public const STATUS_OVERDUE = 'OVERDUE';       // En retard
    public const STATUS_CANCELLED = 'CANCELLED';   // Annulée

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['invoice:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['invoice:read'])]
    private ?string $invoiceNumber = null;

    #[ORM\ManyToOne(targetEntity: Domicile::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['invoice:read'])]
    private ?Domicile $domicile = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['invoice:read'])]
    private ?User $executor = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    #[Groups(['invoice:read'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $periodStart = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    #[Groups(['invoice:read'])]
    #[Assert\NotNull]
    private ?\DateTimeInterface $periodEnd = null;

    // Total des heures travaillées (calculé depuis les TimeLogs)
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $totalHours = 0;

    // Tarif horaire appliqué
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $hourlyRate = 0;

    // Montant total HT
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $subtotal = 0;

    // TVA (%)
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $taxRate = 20.0;

    // Montant TVA
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $taxAmount = 0;

    // Montant total TTC
    #[ORM\Column(type: 'float')]
    #[Groups(['invoice:read'])]
    private float $total = 0;

    #[ORM\Column(length: 50)]
    #[Groups(['invoice:read'])]
    private string $status = self::STATUS_DRAFT;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['invoice:read'])]
    private ?\DateTimeInterface $dueDate = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['invoice:read'])]
    private ?\DateTimeInterface $paidDate = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['invoice:read'])]
    private ?string $notes = null;

    // Chemin du fichier PDF généré
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $pdfPath = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['invoice:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['invoice:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateAmounts();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->calculateAmounts();
    }

    /**
     * Calcule les montants (HT, TVA, TTC)
     */
    private function calculateAmounts(): void
    {
        // Sous-total HT
        $this->subtotal = $this->totalHours * $this->hourlyRate;
        
        // Montant TVA
        $this->taxAmount = $this->subtotal * ($this->taxRate / 100);
        
        // Total TTC
        $this->total = $this->subtotal + $this->taxAmount;
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getInvoiceNumber(): ?string
    {
        return $this->invoiceNumber;
    }

    public function setInvoiceNumber(string $invoiceNumber): static
    {
        $this->invoiceNumber = $invoiceNumber;
        return $this;
    }

    public function getDomicile(): ?Domicile
    {
        return $this->domicile;
    }

    public function setDomicile(?Domicile $domicile): static
    {
        $this->domicile = $domicile;
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

    public function getPeriodStart(): ?\DateTimeInterface
    {
        return $this->periodStart;
    }

    public function setPeriodStart(\DateTimeInterface $periodStart): static
    {
        $this->periodStart = $periodStart;
        return $this;
    }

    public function getPeriodEnd(): ?\DateTimeInterface
    {
        return $this->periodEnd;
    }

    public function setPeriodEnd(\DateTimeInterface $periodEnd): static
    {
        $this->periodEnd = $periodEnd;
        return $this;
    }

    public function getTotalHours(): float
    {
        return $this->totalHours;
    }

    public function setTotalHours(float $totalHours): static
    {
        $this->totalHours = $totalHours;
        return $this;
    }

    public function getHourlyRate(): float
    {
        return $this->hourlyRate;
    }

    public function setHourlyRate(float $hourlyRate): static
    {
        $this->hourlyRate = $hourlyRate;
        return $this;
    }

    public function getSubtotal(): float
    {
        return $this->subtotal;
    }

    public function getTaxRate(): float
    {
        return $this->taxRate;
    }

    public function setTaxRate(float $taxRate): static
    {
        $this->taxRate = $taxRate;
        return $this;
    }

    public function getTaxAmount(): float
    {
        return $this->taxAmount;
    }

    public function getTotal(): float
    {
        return $this->total;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, [
            self::STATUS_DRAFT,
            self::STATUS_SENT,
            self::STATUS_PAID,
            self::STATUS_OVERDUE,
            self::STATUS_CANCELLED
        ])) {
            throw new \InvalidArgumentException('Invalid status');
        }
        $this->status = $status;
        return $this;
    }

    public function getDueDate(): ?\DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeInterface $dueDate): static
    {
        $this->dueDate = $dueDate;
        return $this;
    }

    public function getPaidDate(): ?\DateTimeInterface
    {
        return $this->paidDate;
    }

    public function setPaidDate(?\DateTimeInterface $paidDate): static
    {
        $this->paidDate = $paidDate;
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

    public function getPdfPath(): ?string
    {
        return $this->pdfPath;
    }

    public function setPdfPath(?string $pdfPath): static
    {
        $this->pdfPath = $pdfPath;
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

    /**
     * Marquer comme payée
     */
    public function markAsPaid(): static
    {
        $this->status = self::STATUS_PAID;
        $this->paidDate = new \DateTimeImmutable();
        return $this;
    }

    /**
     * Vérifier si la facture est en retard
     */
    public function isOverdue(): bool
    {
        if ($this->status === self::STATUS_PAID || $this->status === self::STATUS_CANCELLED) {
            return false;
        }

        if ($this->dueDate === null) {
            return false;
        }

        $now = new \DateTimeImmutable();
        return $now > $this->dueDate;
    }
}
