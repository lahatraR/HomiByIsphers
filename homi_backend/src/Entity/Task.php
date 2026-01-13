<?php

namespace App\Entity;

use App\Repository\TaskRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TaskRepository::class)]
class Task
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column]
    private ?bool $status = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $start_time = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $end_time = null;

    #[ORM\ManyToOne(inversedBy: 'tasks')]
    private ?User $assignedTo = null;

    #[ORM\ManyToOne(inversedBy: 'tasks')]
    private ?Domicile $domicile = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updated_at = null;

    /**
     * @var Collection<int, TaskHistory>
     */
    #[ORM\OneToMany(targetEntity: TaskHistory::class, mappedBy: 'task')]
    private Collection $taskHistories;

    public function __construct()
    {
        $this->taskHistories = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function isStatus(): ?bool
    {
        return $this->status;
    }

    public function setStatus(bool $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getStartTime(): ?\DateTimeImmutable
    {
        return $this->start_time;
    }

    public function setStartTime(\DateTimeImmutable $start_time): static
    {
        $this->start_time = $start_time;

        return $this;
    }

    public function getEndTime(): ?\DateTimeImmutable
    {
        return $this->end_time;
    }

    public function setEndTime(\DateTimeImmutable $end_time): static
    {
        $this->end_time = $end_time;

        return $this;
    }

    public function getAssignedTo(): ?User
    {
        return $this->assignedTo;
    }

    public function setAssignedTo(?User $assignedTo): static
    {
        $this->assignedTo = $assignedTo;

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
            $taskHistory->setTask($this);
        }

        return $this;
    }

    public function removeTaskHistory(TaskHistory $taskHistory): static
    {
        if ($this->taskHistories->removeElement($taskHistory)) {
            // set the owning side to null (unless already changed)
            if ($taskHistory->getTask() === $this) {
                $taskHistory->setTask(null);
            }
        }

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }


}
