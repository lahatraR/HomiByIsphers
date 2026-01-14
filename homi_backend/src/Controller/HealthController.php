<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractController
{
    #[Route('/', name: 'app_root', methods: ['GET', 'HEAD'])]
    public function root(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'message' => 'Homi API is running',
            'timestamp' => date('c')
        ], Response::HTTP_OK);
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'timestamp' => date('c')
        ], Response::HTTP_OK);
    }
}
