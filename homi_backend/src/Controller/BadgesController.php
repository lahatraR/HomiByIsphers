<?php

namespace App\Controller;

use App\Repository\BadgeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/badges')]
class BadgesController extends AbstractController
{
    public function __construct(private BadgeRepository $badgeRepository) {}

    #[Route('', name: 'api_badges_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $badges = $this->badgeRepository->findAll();
        $data = array_map(function($badge) {
            return [
                'id' => $badge->getId(),
                'label' => $badge->getLabel(),
                'icon' => $badge->getIcon(),
            ];
        }, $badges);
        return $this->json($data);
    }
}
