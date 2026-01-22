<?php

namespace App\EventListener;

use App\Entity\PendingEmail;
use App\Service\EmailQueue;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Psr\Log\LoggerInterface;

/**
 * Enqueuer les emails en base de données après la réponse HTTP
 * 
 * Les emails sont stockés en BD et envoyés par une commande Symfony (cron)
 * Cela garantit que les emails sont envoyés de manière asynchrone
 * sans bloquer la réponse HTTP
 */
#[AsEventListener(event: KernelEvents::TERMINATE)]
class TerminateListener
{
    public function __construct(
        private EmailQueue $emailQueue,
        private EntityManagerInterface $em,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Enqueuer les emails en BD après réponse HTTP
     */
    public function __invoke(TerminateEvent $event): void
    {
        $pendingEmails = $this->emailQueue->getPending();
        
        $this->logger->info('🔍 TerminateListener triggered', ['pending_emails' => count($pendingEmails)]);
        
        if (empty($pendingEmails)) {
            $this->logger->info('📭 No pending emails');
            return;
        }

        try {
            foreach ($pendingEmails as $message) {
                try {
                    $this->logger->info('💾 Saving email to queue', [
                        'to' => $message->getEmail(),
                        'subject' => 'Vérification de votre compte Homi',
                    ]);

                    // Construire l'URL de vérification
                    $verificationUrl = sprintf(
                        '%s/verify-email/%s',
                        $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173',
                        $message->getToken()
                    );

                    // Créer l'email HTML
                    $htmlContent = sprintf(
                        '<html><body style="font-family: Arial, sans-serif;">' .
                        '<div style="max-width: 600px; margin: 0 auto;">' .
                        '<h1 style="color: #4F46E5;">Bienvenue sur Homi !</h1>' .
                        '<p>Bonjour <strong>%s</strong>,</p>' .
                        '<p>Merci de vous être inscrit(e) sur Homi. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>' .
                        '<p style="margin: 30px 0;"><a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Vérifier mon email</a></p>' .
                        '<p>Ou copiez ce lien :</p>' .
                        '<p style="word-break: break-all; color: #666;"><small>%s</small></p>' .
                        '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">' .
                        '<p style="color: #999; font-size: 12px;">Si vous n\'avez pas créé de compte, ignorez cet email.</p>' .
                        '</div></body></html>',
                        htmlspecialchars($message->getFirstName() ?: $message->getEmail()),
                        htmlspecialchars($verificationUrl),
                        htmlspecialchars($verificationUrl)
                    );

                    // Enqueuer en BD (très rapide!)
                    $pendingEmail = new PendingEmail();
                    $pendingEmail->setEmail($message->getEmail());
                    $pendingEmail->setSubject('Vérification de votre compte Homi');
                    $pendingEmail->setHtmlContent($htmlContent);

                    $this->em->persist($pendingEmail);
                    $this->em->flush();

                    $this->logger->info('✅ Email queued in database', [
                        'to' => $message->getEmail(),
                        'id' => $pendingEmail->getId(),
                    ]);

                } catch (\Throwable $e) {
                    $this->logger->error('❌ Failed to queue email', [
                        'to' => $message->getEmail(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            $this->logger->info('🗑️ Clearing email queue');
            $this->emailQueue->flush();
        }
    }
}
