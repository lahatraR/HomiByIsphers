<?php

namespace App\Service;

use App\Message\SendVerificationEmailMessage;

/**
 * Queue temporaire d'emails à envoyer après la réponse HTTP
 * Simple service pour stocker les emails en mémoire pendant la requête
 */
class EmailQueue
{
    private array $pendingEmails = [];

    /**
     * Ajouter un email à la queue
     */
    public function enqueue(SendVerificationEmailMessage $message): void
    {
        $this->pendingEmails[] = $message;
    }

    /**
     * Récupérer tous les emails en attente
     */
    public function getPending(): array
    {
        return $this->pendingEmails;
    }

    /**
     * Vider la queue
     */
    public function flush(): void
    {
        $this->pendingEmails = [];
    }
}
