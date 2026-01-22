<?php

namespace App\Command;

use App\Repository\PendingEmailRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

#[AsCommand(
    name: 'app:send-pending-emails',
    description: 'Send all pending emails from the queue',
)]
class SendPendingEmailsCommand extends Command
{
    public function __construct(
        private PendingEmailRepository $pendingEmailRepository,
        private MailerInterface $mailer,
        private EntityManagerInterface $em,
        private LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('limit', null, InputOption::VALUE_OPTIONAL, 'Maximum emails to send', 10);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $limit = (int) $input->getOption('limit');
        
        $output->writeln('📧 Starting to send pending emails...');
        $this->logger->info('📧 Command: Starting to send pending emails', ['limit' => $limit]);

        try {
            $pending = $this->pendingEmailRepository->findPending();
            $pendingCount = count($pending);
            
            $output->writeln("Found <info>$pendingCount</info> pending emails");
            $this->logger->info("Found pending emails", ['count' => $pendingCount]);

            $sent = 0;
            $failed = 0;

            foreach (array_slice($pending, 0, $limit) as $pendingEmail) {
                try {
                    $this->logger->info('📤 Sending email', [
                        'to' => $pendingEmail->getEmail(),
                        'subject' => $pendingEmail->getSubject(),
                    ]);

                    $email = (new Email())
                        ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                        ->to($pendingEmail->getEmail())
                        ->subject($pendingEmail->getSubject())
                        ->html($pendingEmail->getHtmlContent());

                    $this->mailer->send($email);

                    $pendingEmail->setSentAt(new \DateTimeImmutable());
                    $this->em->flush();

                    $output->writeln("✅ Sent to <info>{$pendingEmail->getEmail()}</info>");
                    $this->logger->info('✅ Email sent successfully', ['to' => $pendingEmail->getEmail()]);
                    $sent++;

                } catch (\Throwable $e) {
                    $failed++;
                    $pendingEmail->setFailureReason($e->getMessage());
                    $pendingEmail->incrementRetryCount();
                    $this->em->flush();

                    $output->writeln("❌ Failed to send to <error>{$pendingEmail->getEmail()}</error>: {$e->getMessage()}");
                    $this->logger->error('❌ Failed to send email', [
                        'to' => $pendingEmail->getEmail(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $output->writeln("✅ Done! Sent: <info>$sent</info>, Failed: <error>$failed</error>");
            $this->logger->info('✅ Email sending complete', ['sent' => $sent, 'failed' => $failed]);

            return Command::SUCCESS;

        } catch (\Throwable $e) {
            $output->writeln("<error>Error: {$e->getMessage()}</error>");
            $this->logger->error('❌ Command failed', ['error' => $e->getMessage()]);
            return Command::FAILURE;
        }
    }
}
