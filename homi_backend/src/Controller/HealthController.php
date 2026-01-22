<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractController
{
    /**
     * Root health check - for Render and general health monitoring
     */
    #[Route('/', name: 'root_health', methods: ['GET', 'HEAD'])]
    public function rootHealth(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'service' => 'Homi Backend API',
            'timestamp' => date('c')
        ], Response::HTTP_OK);
    }

    /**
     * API health check endpoint
     */
    #[Route('/api/health', name: 'api_health', methods: ['GET', 'HEAD'])]
    public function health(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'timestamp' => date('c')
        ], Response::HTTP_OK);
    }
}
