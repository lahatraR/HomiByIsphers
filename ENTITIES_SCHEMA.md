# 🗄️ Entités à Créer/Modifier

## 📊 Modèle de Données Complet

```
User (existe)
├── ROLE_ADMIN → crée Domicile, assigne Task
├── ROLE_EXECUTOR → exécute Task, soumet TimeLog
└── ROLE_USER → rôle générique

Domicile (existe)
├── createdBy → User (ADMIN)
├── tasks → Task[]
├── domicileExecutors → DomicileExecutor[]  [exist mais sous-utilisé]
└── invoiceReports → InvoiceReport[] [NEW]

DomicileExecutor (existe - À MODIFIER)
├── domicile → Domicile
├── executor → User
├── createdAt → DateTime
└── hourlyRate: decimal(10,2)  [À AJOUTER] ← Important!

Task (existe)
├── title, description
├── status → TODO | IN_PROGRESS | COMPLETED
├── assignedTo → User (EXECUTOR)
├── domicile → Domicile
├── actualStartTime, actualEndTime
├── timeLogs → TaskTimeLog[]  [NEW relationship]
└── invoiceLineItems → InvoiceLineItem[] [NEW relationship]

TaskTimeLog (À CRÉER) ⭐ CRITICAL
├── task → Task
├── executor → User
├── startTime → DateTime
├── endTime → DateTime (nullable)
├── hoursWorked → decimal(5,2) (calculé)
├── status → DRAFT | SUBMITTED | VALIDATED | REJECTED
├── notes → text (optional)
├── rejectionReason → text (optional)
├── createdAt → DateTime
├── submittedAt → DateTime (nullable)
├── validatedAt → DateTime (nullable)
└── validatedBy → User (nullable)

InvoiceReport (À CRÉER) ⭐ IMPORTANT
├── domicile → Domicile
├── period → YYYY-MM
├── totalHours → decimal(8,2)
├── totalCost → decimal(12,2)
├── status → DRAFT | SENT | PAID
├── lineItems → InvoiceLineItem[]
└── createdAt → DateTime

InvoiceLineItem (À CRÉER) ⭐ IMPORTANT
├── invoiceReport → InvoiceReport
├── task → Task
├── executor → User
├── hoursWorked → decimal(5,2)
├── hourlyRate → decimal(10,2)
├── totalCost → decimal(12,2) (calculé)
└── createdAt → DateTime

Notification (À CRÉER - optionnel)
├── user → User
├── type → TASK_ASSIGNED | TIME_SUBMITTED | TIME_VALIDATED
├── message → string
├── relatedEntity → string (json ou FK polymorphe)
├── isRead → boolean
└── createdAt → DateTime

Analytics (À CRÉER - optionnel, peut être sur-le-vol)
├── executor → User
├── domicile → Domicile
├── period → YYYY-MM
├── totalHours → decimal(8,2)
├── averageHourlyRate → decimal(10,2)
├── tasksCompleted → int
└── createdAt → DateTime
```

---

## 🛠️ Entités Détaillées en Code PHP

### 1. TaskTimeLog (PRIORITÉ 1)

```php
<?php
namespace App\Entity;

use App\Repository\TaskTimeLogRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TaskTimeLogRepository::class)]
#[ORM\Table(name: 'task_time_log')]
#[ORM\HasLifecycleCallbacks]
class TaskTimeLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['time-log:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class, inversedBy: 'timeLogs')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['time-log:read'])]
    private ?Task $task = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['time-log:read'])]
    private ?User $executor = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['time-log:read', 'time-log:write'])]
    #[Assert\NotNull(message: 'Start time is required')]
    private ?\DateTimeImmutable $startTime = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read', 'time-log:write'])]
    private ?\DateTimeImmutable $endTime = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Groups(['time-log:read'])]
    private ?string $hoursWorked = null;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['time-log:read'])]
    #[Assert\Choice(
        choices: ['DRAFT', 'SUBMITTED', 'VALIDATED', 'REJECTED'],
        message: 'Invalid status'
    )]
    private string $status = 'DRAFT';

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['time-log:read', 'time-log:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?string $rejectionReason = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['time-log:read'])]
    private ?User $validatedBy = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $submittedAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $validatedAt = null;

    #[ORM\PrePersist]
    public function onCreated(): void
    {
        if (!$this->createdAt) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getTask(): ?Task { return $this->task; }
    public function setTask(?Task $task): static { $this->task = $task; return $this; }
    public function getExecutor(): ?User { return $this->executor; }
    public function setExecutor(?User $executor): static { $this->executor = $executor; return $this; }
    public function getStartTime(): ?\DateTimeImmutable { return $this->startTime; }
    public function setStartTime(\DateTimeImmutable $startTime): static { $this->startTime = $startTime; return $this; }
    public function getEndTime(): ?\DateTimeImmutable { return $this->endTime; }
    public function setEndTime(?\DateTimeImmutable $endTime): static { $this->endTime = $endTime; return $this; }
    public function getHoursWorked(): ?string { return $this->hoursWorked; }
    public function setHoursWorked(?string $hoursWorked): static { $this->hoursWorked = $hoursWorked; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }
    public function getRejectionReason(): ?string { return $this->rejectionReason; }
    public function setRejectionReason(?string $reason): static { $this->rejectionReason = $reason; return $this; }
    public function getValidatedBy(): ?User { return $this->validatedBy; }
    public function setValidatedBy(?User $user): static { $this->validatedBy = $user; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getSubmittedAt(): ?\DateTimeImmutable { return $this->submittedAt; }
    public function setSubmittedAt(?\DateTimeImmutable $date): static { $this->submittedAt = $date; return $this; }
    public function getValidatedAt(): ?\DateTimeImmutable { return $this->validatedAt; }
    public function setValidatedAt(?\DateTimeImmutable $date): static { $this->validatedAt = $date; return $this; }
}
```

### 2. Modification de Task

Ajouter cette relation:
```php
#[ORM\OneToMany(mappedBy: 'task', targetEntity: TaskTimeLog::class, cascade: ['remove'])]
private Collection $timeLogs;

public function __construct()
{
    $this->timeLogs = new ArrayCollection();
}

public function getTimeLogs(): Collection
{
    return $this->timeLogs;
}
```

### 3. Modification de DomicileExecutor

Ajouter ce champ:
```php
#[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
#[Groups(['domicile:read'])]
private ?string $hourlyRate = null;

public function getHourlyRate(): ?string { return $this->hourlyRate; }
public function setHourlyRate(?string $rate): static { $this->hourlyRate = $rate; return $this; }
```

### 4. InvoiceReport (PRIORITÉ 2)

```php
<?php
namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'invoice_report')]
class InvoiceReport
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Domicile::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['invoice:read'])]
    private ?Domicile $domicile = null;

    #[ORM\Column(type: 'string', length: 7)] // YYYY-MM format
    #[Groups(['invoice:read'])]
    private ?string $period = null;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2)]
    #[Groups(['invoice:read'])]
    private ?string $totalHours = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    #[Groups(['invoice:read'])]
    private ?string $totalCost = null;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['invoice:read'])]
    private string $status = 'DRAFT'; // DRAFT, SENT, PAID

    #[ORM\OneToMany(mappedBy: 'invoiceReport', targetEntity: InvoiceLineItem::class, cascade: ['remove'])]
    private Collection $lineItems;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['invoice:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->lineItems = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    // Getters & Setters...
    public function getId(): ?int { return $this->id; }
    public function getDomicile(): ?Domicile { return $this->domicile; }
    public function setDomicile(?Domicile $d): static { $this->domicile = $d; return $this; }
    public function getPeriod(): ?string { return $this->period; }
    public function setPeriod(string $p): static { $this->period = $p; return $this; }
    public function getTotalHours(): ?string { return $this->totalHours; }
    public function setTotalHours(string $h): static { $this->totalHours = $h; return $this; }
    public function getTotalCost(): ?string { return $this->totalCost; }
    public function setTotalCost(string $c): static { $this->totalCost = $c; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $s): static { $this->status = $s; return $this; }
    public function getLineItems(): Collection { return $this->lineItems; }
    public function addLineItem(InvoiceLineItem $item): static { $this->lineItems[] = $item; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}
```

### 5. InvoiceLineItem (PRIORITÉ 2)

```php
<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'invoice_line_item')]
class InvoiceLineItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: InvoiceReport::class, inversedBy: 'lineItems')]
    #[ORM\JoinColumn(nullable: false)]
    private ?InvoiceReport $invoiceReport = null;

    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['invoice:read'])]
    private ?Task $task = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['invoice:read'])]
    private ?User $executor = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2)]
    #[Groups(['invoice:read'])]
    private ?string $hoursWorked = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    #[Groups(['invoice:read'])]
    private ?string $hourlyRate = null;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    #[Groups(['invoice:read'])]
    private ?string $totalCost = null;

    // Getters & Setters...
}
```

### 6. Notification (PRIORITÉ 3 - Optional)

```php
<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'notification')]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 50)]
    private ?string $type = null; // TASK_ASSIGNED, TIME_SUBMITTED, TIME_VALIDATED

    #[ORM\Column(type: 'text')]
    private ?string $message = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $data = null; // Store related IDs

    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // Getters & Setters...
}
```

---

## 🔧 Commandes à Exécuter

```bash
cd homi_backend

# 1. Créer les entités
php bin/console make:entity TaskTimeLog
php bin/console make:entity InvoiceReport
php bin/console make:entity InvoiceLineItem
php bin/console make:entity Notification

# 2. Créer la migration
php bin/console make:migration

# 3. Exécuter la migration
php bin/console doctrine:migrations:migrate

# 4. Créer les repositories (automagique)
php bin/console make:repository TaskTimeLog
php bin/console make:repository InvoiceReport
php bin/console make:repository InvoiceLineItem
php bin/console make:repository Notification
```

---

## ✅ Checklist Entités

- [ ] TaskTimeLog créée + migration
- [ ] Task.timeLogs relation ajoutée
- [ ] DomicileExecutor.hourlyRate ajouté
- [ ] InvoiceReport créée
- [ ] InvoiceLineItem créée
- [ ] Repositories générés
- [ ] Migrations exécutées
- [ ] Tests Postman pour vérifier DB

---

**Tout cela = la fondation pour Time Tracking + Facturation!**
