<?php

namespace App\Controller;

use App\Repository\PendingEmailRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal', name: 'internal_')]
class InternalCronController extends AbstractController
{
    #[Route('/run-email-cron', name: 'run_email_cron', methods: ['POST'])]
    public function runEmailCron(
        Request $request,
        PendingEmailRepository $pendingEmailRepository,
        MailerInterface $mailer,
        EntityManagerInterface $em,
        LoggerInterface $logger
    ): JsonResponse {
        $providedToken = $request->query->get('token') ?? $request->headers->get('X-Email-Cron-Token');
        $expectedToken = $_ENV['EMAIL_CRON_TOKEN'] ?? null;

        if (!$expectedToken || !hash_equals((string) $expectedToken, (string) $providedToken)) {
            return $this->json([
                'status' => 'forbidden',
                'message' => 'Invalid or missing token',
            ], Response::HTTP_FORBIDDEN);
        }

        $limit = (int) ($request->query->get('limit') ?? 10);

        $logger->info('🔔 HTTP cron trigger received', ['limit' => $limit]);

        try {
            $pending = $pendingEmailRepository->findPending();
            $toProcess = array_slice($pending, 0, max(1, $limit));

            $sent = 0;
            $failed = 0;

            foreach ($toProcess as $pendingEmail) {
                try {
                    $email = (new Email())
                        ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                        ->to($pendingEmail->getEmail())
                        ->subject($pendingEmail->getSubject())
                        ->html($pendingEmail->getHtmlContent());

                    $mailer->send($email);

                    $pendingEmail->setSentAt(new \DateTimeImmutable());
                    $em->flush();

                    $sent++;
                } catch (\Throwable $e) {
                    $failed++;
                    $pendingEmail->setFailureReason($e->getMessage());
                    $pendingEmail->incrementRetryCount();
                    $em->flush();
                    $logger->error('Email send failed (HTTP cron)', [
                        'to' => $pendingEmail->getEmail(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return $this->json([
                'status' => 'ok',
                'processed' => count($toProcess),
                'sent' => $sent,
                'failed' => $failed,
                'remaining' => max(0, count($pending) - count($toProcess)),
            ]);
        } catch (\Throwable $e) {
            $logger->error('HTTP cron processing failed', ['error' => $e->getMessage()]);
            return $this->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
