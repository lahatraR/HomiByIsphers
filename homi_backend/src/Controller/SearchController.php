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

    #[Route('', name: 'api_search', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->query->get('q', ''));
        $type = $request->query->get('type', ''); // filter by type: task, user, domicile
        $results = [];
        $user = $this->getUser();
        $isAdmin = $user && in_array('ROLE_ADMIN', $user->getRoles());

        if (strlen($q) < 2) {
            return $this->json(['results' => [], 'total' => 0]);
        }

        // Recherche dans les tâches — scoped by role
        if (!$type || $type === 'task') {
            $qb = $this->taskRepository->createQueryBuilder('t')
                ->where('LOWER(t.title) LIKE LOWER(:q) OR LOWER(t.description) LIKE LOWER(:q)')
                ->setParameter('q', '%' . $q . '%')
                ->orderBy('t.createdAt', 'DESC')
                ->setMaxResults(10);
            
            // Non-admin users only see their assigned tasks
            if (!$isAdmin) {
                $qb->andWhere('t.assignedTo = :user')->setParameter('user', $user);
            }
            
            $tasks = $qb->getQuery()->getResult();
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

        // Recherche dans les utilisateurs — admin only
        if ($isAdmin && (!$type || $type === 'user')) {
            $users = $this->userRepository->createQueryBuilder('u')
                ->where('LOWER(u.firstName) LIKE LOWER(:q) OR LOWER(u.lastName) LIKE LOWER(:q) OR LOWER(u.email) LIKE LOWER(:q)')
                ->setParameter('q', '%' . $q . '%')
                ->setMaxResults(10)
                ->getQuery()->getResult();
            foreach ($users as $u) {
                $fullName = trim(($u->getFirstName() ?? '') . ' ' . ($u->getLastName() ?? ''));
                $results[] = [
                    'id' => $u->getId(),
                    'type' => 'user',
                    'title' => $fullName ?: $u->getEmail(),
                    'snippet' => $u->getEmail(),
                    'status' => $u->getRole(),
                    'url' => '/admin/users',
                ];
            }
        }

        // Recherche dans les domiciles — admin only (scoped to own domiciles)
        if ($isAdmin && (!$type || $type === 'domicile')) {
            $domiciles = $this->domicileRepository->createQueryBuilder('d')
                ->where('(LOWER(d.name) LIKE LOWER(:q) OR LOWER(d.address) LIKE LOWER(:q))')
                ->andWhere('d.createdBy = :user')
                ->setParameter('q', '%' . $q . '%')
                ->setParameter('user', $user)
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
