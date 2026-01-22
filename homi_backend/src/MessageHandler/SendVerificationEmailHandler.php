<?php

namespace App\MessageHandler;

use App\Message\SendVerificationEmailMessage;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Psr\Log\LoggerInterface;

/**
 * DEPRECATED - Emails are now sent via console command in background
 * This handler is kept for backwards compatibility but should not be used
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
        // Les emails ne sont plus envoyés par ce handler
        // Ils sont lancés en background via le command: app:send-verification-email
        // Ce handler n'est ici que pour compatibilité backwards
        
        $this->logger->warning('SendVerificationEmailHandler should not be called directly', [
            'email' => $message->getEmail(),
        ]);
    }
}
