<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\Email(message: 'L\'email doit être valide')]
    #[Assert\NotBlank]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $password = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_EXECUTOR'])]
    private ?string $role = 'ROLE_USER';

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    /**
     * @var Collection<int, Domicile>
     */
    #[ORM\OneToMany(targetEntity: Domicile::class, mappedBy: 'owner')]
    private Collection $owned;

    /**
     * @var Collection<int, DomicileExecutor>
     */
    #[ORM\OneToMany(targetEntity: DomicileExecutor::class, mappedBy: 'executor')]
    private Collection $domicileExecutors;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\OneToMany(targetEntity: Task::class, mappedBy: 'assignedTo')]
    private Collection $tasks;

    /**
     * @var Collection<int, TaskHistory>
     */
    #[ORM\OneToMany(targetEntity: TaskHistory::class, mappedBy: 'executor')]
    private Collection $taskHistories;

    public function __construct()
    {
        $this->owned = new ArrayCollection();
        $this->domicileExecutors = new ArrayCollection();
        $this->tasks = new ArrayCollection();
        $this->taskHistories = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }



    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }

    /**
     * @return Collection<int, Domicile>
     */
    public function getOwned(): Collection
    {
        return $this->owned;
    }

    public function addOwned(Domicile $owned): static
    {
        if (!$this->owned->contains($owned)) {
            $this->owned->add($owned);
            $owned->setOwner($this);
        }

        return $this;
    }

    public function removeOwned(Domicile $owned): static
    {
        if ($this->owned->removeElement($owned)) {
            // set the owning side to null (unless already changed)
            if ($owned->getOwner() === $this) {
                $owned->setOwner(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, DomicileExecutor>
     */
    public function getDomicileExecutors(): Collection
    {
        return $this->domicileExecutors;
    }

    public function addDomicileExecutor(DomicileExecutor $domicileExecutor): static
    {
        if (!$this->domicileExecutors->contains($domicileExecutor)) {
            $this->domicileExecutors->add($domicileExecutor);
            $domicileExecutor->setExecutor($this);
        }

        return $this;
    }

    public function removeDomicileExecutor(DomicileExecutor $domicileExecutor): static
    {
        if ($this->domicileExecutors->removeElement($domicileExecutor)) {
            // set the owning side to null (unless already changed)
            if ($domicileExecutor->getExecutor() === $this) {
                $domicileExecutor->setExecutor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Task>
     */
    public function getTasks(): Collection
    {
        return $this->tasks;
    }

    public function addTask(Task $task): static
    {
        if (!$this->tasks->contains($task)) {
            $this->tasks->add($task);
            $task->setAssignedTo($this);
        }

        return $this;
    }

    public function removeTask(Task $task): static
    {
        if ($this->tasks->removeElement($task)) {
            // set the owning side to null (unless already changed)
            if ($task->getAssignedTo() === $this) {
                $task->setAssignedTo(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TaskHistory>
     */
    public function getTaskHistories(): Collection
    {
        return $this->taskHistories;
    }

    public function addTaskHistory(TaskHistory $taskHistory): static
    {
        if (!$this->taskHistories->contains($taskHistory)) {
            $this->taskHistories->add($taskHistory);
            $taskHistory->setExecutor($this);
        }

        return $this;
    }

    public function removeTaskHistory(TaskHistory $taskHistory): static
    {
        if ($this->taskHistories->removeElement($taskHistory)) {
            // set the owning side to null (unless already changed)
            if ($taskHistory->getExecutor() === $this) {
                $taskHistory->setExecutor(null);
            }
        }

        return $this;
    }

    /**
     * Implémentation UserInterface
     */
    public function getRoles(): array
    {
        return [$this->role ?? 'ROLE_USER'];
    }

    public function eraseCredentials(): void
    {
        // Si vous stockez des données temporaires sensibles, nettoyez-les ici
    }

    public function getUserIdentifier(): string
    {
        return $this->email ?? '';
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }
}

