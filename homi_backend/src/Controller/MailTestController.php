<?php
namespace App\Controller;

use App\Service\MailjetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin')]
class MailTestController extends AbstractController
{
    #[Route('/mailjet/test', name: 'mailjet_test', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function testMail(MailjetService $mailjetService, Request $request): JsonResponse
    {
        // Only allow in dev environment
        if (($_ENV['APP_ENV'] ?? 'prod') !== 'dev') {
            return $this->json(['error' => 'Endpoint disabled in production'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $toEmail = $data['toEmail'] ?? 'destinataire@example.com';
        $toName = $data['toName'] ?? 'Destinataire';
        $subject = $data['subject'] ?? 'Test Mailjet';
        $htmlContent = $data['html'] ?? '<h1>Ceci est un test Mailjet</h1>';

        $success = $mailjetService->sendEmail($toEmail, $toName, $subject, $htmlContent);

        return $this->json([
            'success' => $success,
            'message' => $success ? 'E-mail envoyé avec succès.' : 'Échec de l\'envoi de l\'e-mail.'
        ]);
    }
}
