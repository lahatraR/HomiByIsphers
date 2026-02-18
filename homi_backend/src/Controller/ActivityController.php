<?php

namespace App\Controller;


use App\Repository\ActivityRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/activity')]
class ActivityController extends AbstractController
{
    public function __construct(private ActivityRepository $activityRepository) {}

    #[Route('', name: 'api_activity_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }
        $activities = $this->activityRepository->findBy(['user' => $user], ['createdAt' => 'DESC']);
        $data = array_map(fn($a) => [
            'id' => $a->getId(),
            'action' => $a->getAction(),
            'createdAt' => $a->getCreatedAt()->format(DATE_ATOM),
        ], $activities);
        return $this->json($data);
    }
}
