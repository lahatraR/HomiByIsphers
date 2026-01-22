<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Psr\Log\LoggerInterface;

#[Route('/api/debug', name: 'debug_api')]
class DebugController extends AbstractController
{
    /**
     * Test l'envoi d'email
     */
    #[Route('/test-email', name: 'test_email', methods: ['POST'])]
    public function testEmail(MailerInterface $mailer, LoggerInterface $logger): JsonResponse
    {
        try {
            $logger->info('🧪 Testing email sending...');
            
            $email = (new Email())
                ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
                ->to('test@example.com')
                ->subject('Test Email from Homi')
                ->text('This is a test email to verify MAILER_DSN is working correctly.');
            
            $mailer->send($email);
            
            $logger->info('✅ Test email sent successfully!');
            
            return $this->json([
                'status' => 'success',
                'message' => 'Email sent successfully',
                'mailer_from' => $_ENV['MAILER_FROM'] ?? 'noreply@homi.com',
                'mailer_dsn_present' => !empty($_ENV['MAILER_DSN']),
            ]);
        } catch (\Throwable $e) {
            $logger->error('❌ Email test failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return $this->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'mailer_from' => $_ENV['MAILER_FROM'] ?? 'noreply@homi.com',
                'mailer_dsn_present' => !empty($_ENV['MAILER_DSN']),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Affiche l'état du backend
     */
    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => phpversion(),
            'environment' => $_ENV['APP_ENV'] ?? 'unknown',
            'mailer_configured' => !empty($_ENV['MAILER_DSN']),
            'frontend_url' => $_ENV['FRONTEND_URL'] ?? 'not configured',
        ]);
    }
}
