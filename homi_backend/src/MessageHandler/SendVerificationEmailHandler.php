<?php

namespace App\MessageHandler;

use App\Message\SendVerificationEmailMessage;
use App\Repository\UserRepository;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

/**
 * Handler pour envoyer les emails de vérification de manière asynchrone
 */
#[AsMessageHandler]
class SendVerificationEmailHandler
{
    public function __construct(
        private MailerInterface $mailer,
        private UserRepository $userRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(SendVerificationEmailMessage $message): void
    {
        try {
            // Récupérer l'utilisateur
            $user = $this->userRepository->find($message->getUserId());
            
            if (!$user) {
                $this->logger->warning('User not found for verification email', [
                    'userId' => $message->getUserId(),
                ]);
                return;
            }

            // Construire l'URL de vérification
            $verificationUrl = sprintf(
                '%s/verify-email/%s',
                $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173',
                $message->getToken()
            );

            // Créer et envoyer l'email
            $email = (new Email())
                ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                ->to($message->getEmail())
                ->subject('Vérification de votre compte Homi')
                ->html(sprintf(
                    '<html><body>' .
                    '<h1>Bienvenue sur Homi !</h1>' .
                    '<p>Bonjour %s,</p>' .
                    '<p>Merci de vous être inscrit(e) sur Homi. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>' .
                    '<p><a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon email</a></p>' .
                    '<p>Ou copiez ce lien dans votre navigateur : %s</p>' .
                    '<p>Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.</p>' .
                    '<p>Cordialement,<br>L\'équipe Homi</p>' .
                    '</body></html>',
                    $message->getFirstName() ?: $message->getEmail(),
                    $verificationUrl,
                    $verificationUrl
                ));

            // sendLazy() est non-bloquant! Il envoie sans attendre la réponse
            // Parfait pour les emails qui ne doivent pas impacter le temps de réponse
            $this->mailer->sendLazy($email);
            
            $this->logger->info('Verification email queued for sending (lazy)', [
                'to' => $message->getEmail(),
                'verificationUrl' => $verificationUrl,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to queue verification email', [
                'to' => $message->getEmail(),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Ne pas re-throw pour éviter les retries - l'email n'est que complémentaire
            // Si sendLazy échoue, c'est généralement parce que le transport est mal configuré
        }
    }
}
