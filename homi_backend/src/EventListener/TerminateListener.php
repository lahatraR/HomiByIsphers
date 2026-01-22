<?php

namespace App\EventListener;

use App\Message\SendVerificationEmailMessage;
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
    private array $pendingEmails = [];

    public function __construct(
        private MessageBusInterface $messageBus,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Enqueuer un email à envoyer après la réponse
     */
    public function enqueueEmail(SendVerificationEmailMessage $message): void
    {
        $this->pendingEmails[] = $message;
        $this->logger->debug('Email enqueued for post-response sending', [
            'userId' => $message->userId ?? null,
            'email' => $message->email ?? null,
        ]);
    }

    /**
     * Envoyer tous les emails en attente après la réponse HTTP
     */
    public function onKernelTerminate(TerminateEvent $event): void
    {
        if (empty($this->pendingEmails)) {
            return;
        }

        // Continuer même si des erreurs se produisent
        try {
            foreach ($this->pendingEmails as $message) {
                try {
                    $this->messageBus->dispatch($message);
                    $this->logger->info('Email dispatched after response', [
                        'userId' => $message->userId ?? null,
                        'email' => $message->email ?? null,
                    ]);
                } catch (\Throwable $e) {
                    // Enregistrer l'erreur mais continuer
                    $this->logger->error('Failed to dispatch email', [
                        'email' => $message->email ?? null,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            // Réinitialiser pour la prochaine requête
            $this->pendingEmails = [];
        }
    }
}
