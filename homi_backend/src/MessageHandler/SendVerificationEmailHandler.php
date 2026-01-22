<?php

namespace App\MessageHandler;

use App\Message\SendVerificationEmailMessage;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Psr\Log\LoggerInterface;

/**
 * DEPRECATED - Emails are now sent directly in TerminateListener
 * This handler is kept only for backwards compatibility
 */
#[AsMessageHandler]
class SendVerificationEmailHandler
{
    public function __construct(
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(SendVerificationEmailMessage $message): void
    {
        // Les emails sont maintenant envoyés directement par TerminateListener.sendVerificationEmail()
        // Ce handler n'existe que pour compatibilité
        $this->logger->info('SendVerificationEmailHandler deprecated - emails sent by TerminateListener', [
            'email' => $message->getEmail(),
        ]);
    }
}
