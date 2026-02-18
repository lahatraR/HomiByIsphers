<?php

namespace App\Controller;

use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Repository\DomicileRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/search')]
class SearchController extends AbstractController
{
    public function __construct(
        private TaskRepository $taskRepository,
        private UserRepository $userRepository,
        private DomicileRepository $domicileRepository
    ) {}

    #[Route('/', name: 'api_search', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->query->get('q', ''));
        $type = $request->query->get('type', ''); // filter by type: task, user, domicile
        $results = [];

        if (strlen($q) < 2) {
            return $this->json(['results' => [], 'total' => 0]);
        }

        // Recherche dans les tâches
        if (!$type || $type === 'task') {
            $tasks = $this->taskRepository->createQueryBuilder('t')
                ->where('LOWER(t.title) LIKE LOWER(:q) OR LOWER(t.description) LIKE LOWER(:q)')
                ->setParameter('q', "%$q%")
                ->orderBy('t.createdAt', 'DESC')
                ->setMaxResults(10)
                ->getQuery()->getResult();
            foreach ($tasks as $task) {
                $results[] = [
                    'id' => $task->getId(),
                    'type' => 'task',
                    'title' => $task->getTitle(),
                    'snippet' => mb_substr($task->getDescription() ?? '', 0, 120),
                    'status' => $task->getStatus(),
                    'url' => '/tasks',
                ];
            }
        }

        // Recherche dans les utilisateurs (firstName, lastName, email)
        if (!$type || $type === 'user') {
            $users = $this->userRepository->createQueryBuilder('u')
                ->where('LOWER(u.firstName) LIKE LOWER(:q) OR LOWER(u.lastName) LIKE LOWER(:q) OR LOWER(u.email) LIKE LOWER(:q)')
                ->setParameter('q', "%$q%")
                ->setMaxResults(10)
                ->getQuery()->getResult();
            foreach ($users as $user) {
                $fullName = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''));
                $results[] = [
                    'id' => $user->getId(),
                    'type' => 'user',
                    'title' => $fullName ?: $user->getEmail(),
                    'snippet' => $user->getEmail(),
                    'status' => $user->getRole(),
                    'url' => '/admin/users',
                ];
            }
        }

        // Recherche dans les domiciles
        if (!$type || $type === 'domicile') {
            $domiciles = $this->domicileRepository->createQueryBuilder('d')
                ->where('LOWER(d.name) LIKE LOWER(:q) OR LOWER(d.address) LIKE LOWER(:q)')
                ->setParameter('q', "%$q%")
                ->setMaxResults(10)
                ->getQuery()->getResult();
            foreach ($domiciles as $domicile) {
                $results[] = [
                    'id' => $domicile->getId(),
                    'type' => 'domicile',
                    'title' => $domicile->getName(),
                    'snippet' => $domicile->getAddress(),
                    'status' => null,
                    'url' => '/domiciles',
                ];
            }
        }

        return $this->json([
            'results' => $results,
            'total' => count($results),
            'query' => $q,
        ]);
    }
}
