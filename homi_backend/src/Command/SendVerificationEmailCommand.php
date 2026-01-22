<?php

namespace App\Command;

use App\Repository\UserRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

#[AsCommand(
    name: 'app:send-verification-email',
    description: 'Envoi un email de vérification asynchrone',
)]
class SendVerificationEmailCommand extends Command
{
    public function __construct(
        private MailerInterface $mailer,
        private UserRepository $userRepository,
        private LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('userId', InputArgument::REQUIRED, 'User ID')
            ->addArgument('email', InputArgument::REQUIRED, 'User email')
            ->addArgument('token', InputArgument::REQUIRED, 'Verification token')
            ->addArgument('firstName', InputArgument::OPTIONAL, 'User first name', '');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $userId = (int) $input->getArgument('userId');
            $email = $input->getArgument('email');
            $token = $input->getArgument('token');
            $firstName = $input->getArgument('firstName');

            // Vérifier que l'utilisateur existe
            $user = $this->userRepository->find($userId);
            if (!$user) {
                $this->logger->warning('User not found for verification email', ['userId' => $userId]);
                return Command::SUCCESS; // Pas d'erreur - juste ignorer
            }

            // Construire l'URL de vérification
            $verificationUrl = sprintf(
                '%s/verify-email/%s',
                $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173',
                $token
            );

            // Créer et envoyer l'email
            $emailMessage = (new Email())
                ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                ->to($email)
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
                    $firstName ?: $email,
                    $verificationUrl,
                    $verificationUrl
                ));

            $this->mailer->send($emailMessage);

            $this->logger->info('Verification email sent successfully', [
                'userId' => $userId,
                'to' => $email,
            ]);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send verification email', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Ne pas échouer - c'est juste un email
            return Command::SUCCESS;
        }
    }
}
