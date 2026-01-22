<?php

namespace App\EventListener;

use App\Repository\UserRepository;
use App\Service\EmailQueue;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

/**
 * Envoie les emails directement après la réponse HTTP
 * 
 * À ce stade (kernel.terminate):
 * - La réponse est déjà envoyée au client
 * - Le client a reçu le 201 Created
 * - Le client ne peut plus timeout!
 * 
 * Donc envoyer l'email ICI est OK - il prend du temps mais le client est parti
 */
#[AsEventListener(event: KernelEvents::TERMINATE)]
class TerminateListener
{
    public function __construct(
        private EmailQueue $emailQueue,
        private MailerInterface $mailer,
        private UserRepository $userRepository,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Envoyer les emails directement après réponse HTTP
     */
    public function __invoke(TerminateEvent $event): void
    {
        $pendingEmails = $this->emailQueue->getPending();
        
        $this->logger->info('🔍 TerminateListener triggered', ['pending_emails' => count($pendingEmails)]);
        
        if (empty($pendingEmails)) {
            $this->logger->info('📭 No pending emails to send');
            return;
        }

        try {
            foreach ($pendingEmails as $message) {
                $this->logger->info('📧 Email would be sent', [
                    'to' => $message->getEmail(),
                    'userId' => $message->getUserId(),
                ]);
                
                // ⚠️ TEMPORARILY DISABLED: Email sending was causing 408 timeout
                // Just log for now to isolate the problem
                // $this->sendVerificationEmail($message);
            }
        } finally {
            $this->logger->info('🗑️ Clearing email queue');
            $this->emailQueue->flush();
        }
    }

    /**
     * Envoyer un email de vérification
     */
    private function sendVerificationEmail($message): void
    {
        try {
            $this->logger->info('🔍 [Email] Looking up user', ['userId' => $message->getUserId()]);
            
            // Récupérer l'utilisateur
            $user = $this->userRepository->find($message->getUserId());
            
            if (!$user) {
                $this->logger->warning('⚠️ [Email] User not found', [
                    'userId' => $message->getUserId(),
                ]);
                return;
            }
            
            $this->logger->info('✅ [Email] User found', ['email' => $user->getEmail()]);

            // Construire l'URL de vérification
            $verificationUrl = sprintf(
                '%s/verify-email/%s',
                $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173',
                $message->getToken()
            );
            
            $this->logger->info('🔗 [Email] Verification URL created', ['url' => $verificationUrl]);

            // Créer l'email
            $this->logger->info('📝 [Email] Creating email object');
            
            $email = (new Email())
                ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                ->to($message->getEmail())
                ->subject('Vérification de votre compte Homi')
                ->html(sprintf(
                    '<html><body style="font-family: Arial, sans-serif;">' .
                    '<div style="max-width: 600px; margin: 0 auto;">' .
                    '<h1 style="color: #4F46E5;">Bienvenue sur Homi !</h1>' .
                    '<p>Bonjour <strong>%s</strong>,</p>' .
                    '<p>Merci de vous être inscrit(e) sur Homi. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>' .
                    '<p style="margin: 30px 0;"><a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Vérifier mon email</a></p>' .
                    '<p>Ou copiez ce lien dans votre navigateur :</p>' .
                    '<p style="word-break: break-all; color: #666;"><small>%s</small></p>' .
                    '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">' .
                    '<p style="color: #999; font-size: 12px;">Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.</p>' .
                    '<p style="color: #999; font-size: 12px;">Cordialement,<br><strong>L\'équipe Homi</strong></p>' .
                    '</div>' .
                    '</body></html>',
                    htmlspecialchars($message->getFirstName() ?: $message->getEmail()),
                    htmlspecialchars($verificationUrl),
                    htmlspecialchars($verificationUrl)
                ));

            $this->logger->info('📤 [Email] Sending via mailer', [
                'from' => $_ENV['MAILER_FROM'] ?? 'noreply@homi.com',
                'to' => $message->getEmail(),
            ]);
            
            // Envoyer l'email
            $this->mailer->send($email);
            
            $this->logger->info('✅ [Email] Email sent successfully!', [
                'userId' => $message->getUserId(),
                'to' => $message->getEmail(),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('❌ [Email] FAILED TO SEND', [
                'to' => $message->getEmail(),
                'error_message' => $e->getMessage(),
                'error_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
