<?php
namespace App\Controller;

use App\Service\MailjetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Request;

class MailTestController extends AbstractController
{
    #[Route('/mailjet/test', name: 'mailjet_test', methods: ['POST'])]
    public function testMail(MailjetService $mailjetService, Request $request): JsonResponse
    {
        $toEmail = $request->request->get('toEmail', 'destinataire@example.com');
        $toName = $request->request->get('toName', 'Destinataire');
        $subject = $request->request->get('subject', 'Test Mailjet');
        $htmlContent = $request->request->get('html', '<h1>Ceci est un test Mailjet</h1>');

        $success = $mailjetService->sendEmail($toEmail, $toName, $subject, $htmlContent);

        return $this->json([
            'success' => $success,
            'message' => $success ? 'E-mail envoyé avec succès.' : 'Échec de l\'envoi de l\'e-mail.'
        ]);
    }
}
