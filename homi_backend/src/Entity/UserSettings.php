<?php

namespace App\Entity;

use App\Repository\UserSettingsRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserSettingsRepository::class)]
class UserSettings
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $theme = 'light';

    #[ORM\Column(type: 'string', length: 5)]
    private string $lang = 'fr';

    #[ORM\Column(type: 'boolean')]
    private bool $notifications = true;

    #[ORM\Column(type: 'boolean')]
    private bool $twofa = false;

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getTheme(): string { return $this->theme; }
    public function setTheme(string $theme): static { $this->theme = $theme; return $this; }
    public function getLang(): string { return $this->lang; }
    public function setLang(string $lang): static { $this->lang = $lang; return $this; }
    public function getNotifications(): bool { return $this->notifications; }
    public function setNotifications(bool $notifications): static { $this->notifications = $notifications; return $this; }
    public function getTwofa(): bool { return $this->twofa; }
    public function setTwofa(bool $twofa): static { $this->twofa = $twofa; return $this; }
}
