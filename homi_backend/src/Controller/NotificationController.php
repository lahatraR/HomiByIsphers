<?php

namespace App\Controller;


use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private NotificationRepository $notificationRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('/', name: 'api_notifications_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $notifications = $this->notificationRepository->findBy(['user' => $user], ['createdAt' => 'DESC']);
        $data = array_map(fn($n) => [
            'id' => $n->getId(),
            'message' => $n->getMessage(),
            'read' => $n->isRead(),
            'createdAt' => $n->getCreatedAt()->format(DATE_ATOM),
        ], $notifications);
        return $this->json($data);
    }

    #[Route('/', name: 'api_notifications_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $data = json_decode($request->getContent(), true);
        if (!isset($data['message'])) {
            return $this->json(['error' => 'Message requis'], Response::HTTP_BAD_REQUEST);
        }
        $notification = new Notification();
        $notification->setMessage($data['message']);
        $notification->setRead(false);
        $notification->setCreatedAt(new \DateTimeImmutable());
        $notification->setUser($user);
        $this->em->persist($notification);
        $this->em->flush();
        return $this->json([
            'id' => $notification->getId(),
            'message' => $notification->getMessage(),
            'read' => $notification->isRead(),
            'createdAt' => $notification->getCreatedAt()->format(DATE_ATOM),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_notifications_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $notification = $this->notificationRepository->find($id);
        $userEntity = ($user instanceof \App\Entity\User) ? $user : null;
        if (!$notification || !$userEntity || $notification->getUser()?->getId() !== $userEntity->getId()) {
            return $this->json(['error' => 'Notification introuvable ou accès refusé'], Response::HTTP_NOT_FOUND);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['read'])) {
            $notification->setRead((bool)$data['read']);
        }
        $this->em->flush();
        return $this->json([
            'id' => $notification->getId(),
            'message' => $notification->getMessage(),
            'read' => $notification->isRead(),
            'createdAt' => $notification->getCreatedAt()->format(DATE_ATOM),
        ]);
    }

    #[Route('/{id}', name: 'api_notifications_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $notification = $this->notificationRepository->find($id);
        $userEntity = ($user instanceof \App\Entity\User) ? $user : null;
        if (!$notification || !$userEntity || $notification->getUser()?->getId() !== $userEntity->getId()) {
            return $this->json(['error' => 'Notification introuvable ou accès refusé'], Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($notification);
        $this->em->flush();
        return $this->json(['message' => 'Notification supprimée']);
    }
}
