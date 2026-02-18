<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Psr\Log\LoggerInterface;

#[Route('/api/debug', name: 'debug_api')]
#[IsGranted('ROLE_ADMIN')]
class DebugController extends AbstractController
{
    /**
     * Test l'envoi d'email — dev environment only
     */
    #[Route('/test-email', name: 'test_email', methods: ['POST'])]
    public function testEmail(MailerInterface $mailer, LoggerInterface $logger): JsonResponse
    {
        if (($_ENV['APP_ENV'] ?? 'prod') !== 'dev') {
            return $this->json(['error' => 'Endpoint disabled in production'], Response::HTTP_FORBIDDEN);
        }

        try {
            $logger->info('Testing email sending...');

            $email = (new Email())
                ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                ->to('test@example.com')
                ->subject('Test Email from Homi')
                ->text('This is a test email to verify MAILER_DSN is working correctly.');

            $mailer->send($email);

            return $this->json([
                'status' => 'success',
                'message' => 'Email sent successfully',
            ]);
        } catch (\Throwable $e) {
            $logger->error('Email test failed', ['error' => $e->getMessage()]);

            return $this->json([
                'status' => 'error',
                'message' => 'Email sending failed',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Affiche l'état du backend — no sensitive info in production
     */
    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'environment' => $_ENV['APP_ENV'] ?? 'unknown',
            'mailer_configured' => !empty($_ENV['MAILER_DSN']),
            'frontend_url' => $_ENV['FRONTEND_URL'] ?? 'not configured',
        ]);
    }
}
