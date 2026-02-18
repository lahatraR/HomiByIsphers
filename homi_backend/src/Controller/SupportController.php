<?php

namespace App\Controller;

use App\Entity\SupportMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/support')]
class SupportController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/', name: 'api_support_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user || !$user instanceof \App\Entity\User) {
            return $this->json([], Response::HTTP_OK);
        }

        $tickets = $this->em->getRepository(SupportMessage::class)->findBy(
            ['email' => $user->getEmail()],
            ['createdAt' => 'DESC']
        );

        $data = array_map(fn(SupportMessage $t) => [
            'id' => $t->getId(),
            'subject' => $t->getSubject(),
            'message' => $t->getMessage(),
            'status' => $t->getStatus(),
            'createdAt' => $t->getCreatedAt()?->format(\DATE_ATOM),
        ], $tickets);

        return $this->json($data);
    }

    #[Route('/', name: 'api_support_contact', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function contact(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $subject = trim($data['subject'] ?? '');
        $message = trim($data['message'] ?? '');

        if (!$message) {
            return $this->json(['error' => 'Le message est requis'], Response::HTTP_BAD_REQUEST);
        }

        $supportMessage = new SupportMessage();
        if ($user instanceof \App\Entity\User) {
            $supportMessage->setEmail($user->getEmail());
        } else {
            $supportMessage->setEmail($data['email'] ?? 'unknown');
        }
        $supportMessage->setSubject($subject ?: 'Demande de support');
        $supportMessage->setMessage($message);
        $supportMessage->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($supportMessage);
        $this->em->flush();

        return $this->json([
            'message' => 'Ticket créé avec succès.',
            'id' => $supportMessage->getId(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Admin: liste tous les tickets
     */
    #[Route('/admin', name: 'api_support_admin_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminList(): JsonResponse
    {
        $tickets = $this->em->getRepository(SupportMessage::class)->findBy([], ['createdAt' => 'DESC']);

        $data = array_map(fn(SupportMessage $t) => [
            'id' => $t->getId(),
            'email' => $t->getEmail(),
            'subject' => $t->getSubject(),
            'message' => $t->getMessage(),
            'status' => $t->getStatus(),
            'createdAt' => $t->getCreatedAt()?->format(\DATE_ATOM),
        ], $tickets);

        return $this->json($data);
    }
}
