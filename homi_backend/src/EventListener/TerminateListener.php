<?php

namespace App\EventListener;

use App\Service\EmailQueue;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Psr\Log\LoggerInterface;

/**
 * Lance l'envoi des emails en background après la réponse HTTP
 * Utilise exec() pour lancer les commandes de manière asynchrone
 * 
 * Cela évite les timeouts: la réponse est envoyée immédiatement,
 * les emails sont traités en arrière-plan
 */
#[AsEventListener(event: KernelEvents::TERMINATE)]
class TerminateListener
{
    public function __construct(
        private EmailQueue $emailQueue,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Lancer l'envoi des emails en background après la réponse HTTP
     * Cette méthode est appelée automatiquement par Symfony après avoir envoyé la réponse
     */
    public function __invoke(TerminateEvent $event): void
    {
        $pendingEmails = $this->emailQueue->getPending();
        
        if (empty($pendingEmails)) {
            return;
        }

        try {
            foreach ($pendingEmails as $message) {
                try {
                    // Lancer la commande en background avec exec()
                    // > /dev/null 2>&1 & redirige la sortie et lance en background
                    $command = sprintf(
                        'php /app/bin/console app:send-verification-email %d %s %s %s > /dev/null 2>&1 &',
                        $message->getUserId(),
                        escapeshellarg($message->getEmail()),
                        escapeshellarg($message->getToken()),
                        escapeshellarg($message->getFirstName())
                    );

                    exec($command);

                    $this->logger->info('Email command launched in background', [
                        'userId' => $message->getUserId(),
                        'email' => $message->getEmail(),
                    ]);
                } catch (\Throwable $e) {
                    // Enregistrer l'erreur mais continuer
                    $this->logger->error('Failed to launch email command', [
                        'email' => $message->getEmail(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            // Réinitialiser la queue
            $this->emailQueue->flush();
        }
    }
}
