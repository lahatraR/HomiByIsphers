<?php

namespace App\Entity;

use App\Repository\DomicileRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DomicileRepository::class)]
class Domicile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\ManyToOne(inversedBy: 'owned')]
    private ?User $owner = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    /**
     * @var Collection<int, DomicileExecutor>
     */
    #[ORM\OneToMany(targetEntity: DomicileExecutor::class, mappedBy: 'domicile', orphanRemoval: true)]
    private Collection $domicileExecutors;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $description = null;

    public function __construct()
    {
        $this->domicileExecutors = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
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
            $domicileExecutor->setDomicile($this);
        }
        return $this;
    }

    public function removeDomicileExecutor(DomicileExecutor $domicileExecutor): static
    {
        if ($this->domicileExecutors->removeElement($domicileExecutor)) {
            if ($domicileExecutor->getDomicile() === $this) {
                $domicileExecutor->setDomicile(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getExecutors(): Collection
    {
        return $this->domicileExecutors->map(fn(DomicileExecutor $de) => $de->getExecutor());
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }
}
