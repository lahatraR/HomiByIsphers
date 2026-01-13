<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['task:read', 'user:read', 'domicile:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['task:read', 'user:read', 'domicile:read'])]
    #[Assert\NotBlank]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(length: 50)]
    private string $role = 'ROLE_USER';

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['task:read', 'user:read', 'domicile:read'])]
    private ?string $firstName = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['task:read', 'user:read', 'domicile:read'])]
    private ?string $lastName = null;

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(?string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(?string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    #[ORM\OneToMany(mappedBy: 'assignedTo', targetEntity: Task::class)]
    private Collection $tasks;

    #[ORM\OneToMany(mappedBy: 'createdBy', targetEntity: Domicile::class)]
    private Collection $domiciles;

    public function __construct()
    {
        $this->tasks = new ArrayCollection();
        $this->domiciles = new ArrayCollection();
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


    /**
     * @return Collection<int, Domicile>
     */
    public function getDomiciles(): Collection
    {
        return $this->domiciles;
    }

    public function addDomicile(Domicile $domicile): static
    {
        if (!$this->domiciles->contains($domicile)) {
            $this->domiciles->add($domicile);
            $domicile->setCreatedBy($this);
        }
        return $this;
    }

    public function removeDomicile(Domicile $domicile): static
    {
        if ($this->domiciles->removeElement($domicile)) {
            if ($domicile->getCreatedBy() === $this) {
                $domicile->setCreatedBy(null);
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
     * Implémentation UserInterface
     */
    public function getRoles(): array
    {
        return [$this->role ?? 'ROLE_USER'];
    }

    public function getRole(): string
    {
        return $this->role ?? 'ROLE_USER';
    }

    public function setRole(string $role): static
    {
        $this->role = $role ?: 'ROLE_USER';
        return $this;
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

