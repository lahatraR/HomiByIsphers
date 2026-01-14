<?php

namespace App\Entity;

enum TaskActionType: int
{
    case CREATED = 1;
    case COMPLETED = 2;
    case POSTPONED = 3;
    case RESUMED = 4;
    case REASSIGNED = 5;

    public function label(): string
    {
        return match ($this) {
            self::CREATED => 'Créée',
            self::COMPLETED => 'Terminée',
            self::POSTPONED => 'Reportée',
            self::RESUMED => 'Reprise',
            self::REASSIGNED => 'Réassignée',
        };
    }
}
