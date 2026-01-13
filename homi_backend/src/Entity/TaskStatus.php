<?php

namespace App\Entity;

enum TaskStatus: string
{
    case CREATED = 'created';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case POSTPONED = 'postponed';

    public function label(): string
    {
        return match ($this) {
            self::CREATED => 'Créée',
            self::IN_PROGRESS => 'En cours',
            self::COMPLETED => 'Terminée',
            self::POSTPONED => 'Reportée',
        };
    }
}
