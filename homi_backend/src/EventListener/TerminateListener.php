<?php

namespace App\EventListener;

use App\Service\EmailQueue;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Messenger\MessageBusInterface;
use Psr\Log\LoggerInterface;

/**
 * Envoie les emails APRÈS avoir retourné la réponse HTTP au client
 * Cela évite les timeouts et permet une expérience utilisateur rapide
 * 
 * Les emails sont envoyés de manière synchrone mais n'impactent pas le temps de réponse
 */
#[AsEventListener(event: KernelEvents::TERMINATE)]
class TerminateListener
{
    public function __construct(
        private EmailQueue $emailQueue,
        private MessageBusInterface $messageBus,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Envoyer tous les emails en attente après la réponse HTTP
     * Cette méthode est appelée automatiquement par Symfony via l'événement kernel.terminate
     */
    public function __invoke(TerminateEvent $event): void
    {
        $pendingEmails = $this->emailQueue->getPending();
        
        if (empty($pendingEmails)) {
            return;
        }

        // Continuer même si des erreurs se produisent
        try {
            foreach ($pendingEmails as $message) {
                try {
                    $this->messageBus->dispatch($message);
                    $this->logger->info('Email dispatched after response', [
                        'userId' => $message->getUserId(),
                        'email' => $message->getEmail(),
                    ]);
                } catch (\Throwable $e) {
                    // Enregistrer l'erreur mais continuer
                    $this->logger->error('Failed to dispatch email', [
                        'email' => $message->getEmail(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            // Réinitialiser la queue pour la prochaine requête
            $this->emailQueue->flush();
        }
    }
}
