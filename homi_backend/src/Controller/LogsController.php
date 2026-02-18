<?php

namespace App\Controller;

use App\Repository\LogEntryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/logs')]
class LogsController extends AbstractController
{
    public function __construct(private LogEntryRepository $logEntryRepository) {}

    #[Route('/', name: 'api_admin_logs_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(): JsonResponse
    {
        $logs = $this->logEntryRepository->findBy([], ['date' => 'DESC']);
        $data = array_map(function($log) {
            return [
                'id' => $log->getId(),
                'type' => $log->getType(),
                'message' => $log->getMessage(),
                'date' => $log->getDate() ? $log->getDate()->format(DATE_ATOM) : null,
            ];
        }, $logs);
        return $this->json($data);
    }
}
