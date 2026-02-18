<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

#[Route('/api/export')]
class ExportController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/', name: 'api_export_data', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function export(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof \App\Entity\User) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $data = [
            'exportDate' => (new \DateTimeImmutable())->format(\DATE_ATOM),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'role' => $user->getRole(),
                'createdAt' => $user->getCreatedAt()?->format(\DATE_ATOM),
            ],
        ];

        // Export tasks
        $tasks = $this->em->getRepository(\App\Entity\Task::class)->findBy(['assignedTo' => $user]);
        $data['tasks'] = array_map(fn($t) => [
            'id' => $t->getId(),
            'title' => $t->getTitle(),
            'description' => $t->getDescription(),
            'status' => $t->getStatus(),
            'startTime' => $t->getStartTime()?->format(\DATE_ATOM),
            'endTime' => $t->getEndTime()?->format(\DATE_ATOM),
            'createdAt' => $t->getCreatedAt()?->format(\DATE_ATOM),
        ], $tasks);

        // Export time logs
        $timeLogs = $this->em->getRepository(\App\Entity\TaskTimeLog::class)->findBy(['executor' => $user]);
        $data['timeLogs'] = array_map(fn($tl) => [
            'id' => $tl->getId(),
            'hoursWorked' => $tl->getHoursWorked(),
            'status' => $tl->getStatus(),
            'startTime' => $tl->getStartTime()?->format(\DATE_ATOM),
            'endTime' => $tl->getEndTime()?->format(\DATE_ATOM),
            'notes' => $tl->getNotes(),
        ], $timeLogs);

        // Export favorites
        $favorites = $this->em->getRepository(\App\Entity\Favorite::class)->findBy(['user' => $user]);
        $data['favorites'] = array_map(fn($f) => [
            'id' => $f->getId(),
            'type' => $f->getType(),
            'label' => $f->getLabel(),
        ], $favorites);

        // Export notifications
        $notifications = $this->em->getRepository(\App\Entity\Notification::class)->findBy(['user' => $user]);
        $data['notifications'] = array_map(fn($n) => [
            'id' => $n->getId(),
            'message' => $n->getMessage(),
            'read' => $n->isRead(),
            'createdAt' => $n->getCreatedAt()?->format(\DATE_ATOM),
        ], $notifications);

        // Export activity logs
        $activities = $this->em->getRepository(\App\Entity\Activity::class)->findBy(['user' => $user]);
        $data['activities'] = array_map(fn($a) => [
            'id' => $a->getId(),
            'action' => $a->getAction(),
            'createdAt' => $a->getCreatedAt()?->format(\DATE_ATOM),
        ], $activities);

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $dir = $this->getParameter('kernel.project_dir') . '/var/share/exports';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $filename = 'export-user-' . $user->getId() . '-' . date('YmdHis') . '.json';
        $filepath = $dir . '/' . $filename;
        file_put_contents($filepath, $json);

        return $this->json([
            'message' => 'Export généré avec succès',
            'filename' => $filename,
            'url' => '/api/export/download?file=' . urlencode($filename),
            'stats' => [
                'tasks' => count($data['tasks']),
                'timeLogs' => count($data['timeLogs']),
                'favorites' => count($data['favorites']),
                'notifications' => count($data['notifications']),
                'activities' => count($data['activities']),
            ],
        ]);
    }

    #[Route('/download', name: 'api_export_download', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function download(Request $request): Response
    {
        $user = $this->getUser();
        if (!$user instanceof \App\Entity\User) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $filename = basename($request->query->get('file', '')); // basename() prevents path traversal
        $dir = $this->getParameter('kernel.project_dir') . '/var/share/exports';
        $filepath = $dir . '/' . $filename;

        if (!$filename || !file_exists($filepath)) {
            return $this->json(['error' => 'Fichier non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Security: verify resolved path is within exports directory
        $realPath = realpath($filepath);
        $realDir = realpath($dir);
        if (!$realPath || !$realDir || !str_starts_with($realPath, $realDir)) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        // Security: check filename belongs to user
        if (strpos($filename, 'export-user-' . $user->getId() . '-') !== 0) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        return $this->file($filepath, $filename, ResponseHeaderBag::DISPOSITION_ATTACHMENT);
    }
}
