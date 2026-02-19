<?php

namespace App\Controller;

use App\Entity\TaskReview;
use App\Repository\TaskReviewRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/reviews')]
#[IsGranted('ROLE_USER')]
class TaskReviewController extends AbstractController
{
    public function __construct(
        private TaskReviewRepository $reviewRepo,
        private TaskRepository $taskRepo,
        private UserRepository $userRepo,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
    ) {}

    /**
     * Ajouter un avis sur une tâche complétée (admin seulement).
     */
    #[Route('', name: 'review_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user || !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json(['error' => 'Seul un admin peut noter'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
        }

        $task = $this->taskRepo->find($data['taskId'] ?? 0);
        if (!$task) {
            return $this->json(['error' => 'Tâche introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getStatus() !== 'COMPLETED') {
            return $this->json(['error' => 'Seules les tâches complétées peuvent être notées'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier qu'un avis n'existe pas déjà pour cette tâche
        $existing = $this->reviewRepo->findOneBy(['task' => $task]);
        if ($existing) {
            return $this->json(['error' => 'Un avis existe déjà pour cette tâche'], Response::HTTP_CONFLICT);
        }

        // Vérifier que la tâche a un exécuteur assigné
        if (!$task->getAssignedTo()) {
            return $this->json(['error' => 'Tâche sans exécuteur assigné'], Response::HTTP_BAD_REQUEST);
        }

        $review = new TaskReview();
        $review->setTask($task);
        $review->setRating((int) ($data['rating'] ?? 5));
        $review->setComment($data['comment'] ?? null);
        $review->setReviewedBy($user);
        $review->setExecutor($task->getAssignedTo());

        $errors = $this->validator->validate($review);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($review);
        $this->em->flush();

        return $this->json($this->serializeReview($review), Response::HTTP_CREATED);
    }

    /**
     * Obtenir l'avis d'une tâche spécifique.
     */
    #[Route('/task/{taskId}', name: 'review_by_task', methods: ['GET'])]
    public function getByTask(int $taskId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $review = $this->reviewRepo->findOneBy(['task' => $taskId]);
        if (!$review) {
            return $this->json(null, Response::HTTP_OK);
        }

        return $this->json($this->serializeReview($review));
    }

    /**
     * Statistiques d'un exécuteur (note moyenne, nombre d'avis).
     */
    #[Route('/executor/{executorId}/stats', name: 'review_executor_stats', methods: ['GET'])]
    public function executorStats(int $executorId): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $stats = $this->reviewRepo->getExecutorStats($executorId);
        $recentReviews = $this->reviewRepo->findByExecutor($executorId, 5);

        return $this->json([
            'averageRating' => $stats['averageRating'],
            'totalReviews' => $stats['totalReviews'],
            'recentReviews' => array_map([$this, 'serializeReview'], $recentReviews),
        ]);
    }

    /**
     * Tous les avis (admin) — avec filtres optionnels.
     */
    #[Route('', name: 'review_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        // Exécuteur voit ses propres avis, admin voit tout
        $isAdmin = in_array('ROLE_ADMIN', $user->getRoles());

        if ($isAdmin) {
            $reviews = $this->reviewRepo->findBy([], ['createdAt' => 'DESC']);
        } else {
            $reviews = $this->reviewRepo->findBy(
                ['executor' => $user],
                ['createdAt' => 'DESC']
            );
        }

        return $this->json(array_map([$this, 'serializeReview'], $reviews));
    }

    private function serializeReview(TaskReview $r): array
    {
        return [
            'id' => $r->getId(),
            'taskId' => $r->getTask()?->getId(),
            'taskTitle' => $r->getTask()?->getTitle(),
            'rating' => $r->getRating(),
            'comment' => $r->getComment(),
            'reviewedBy' => [
                'id' => $r->getReviewedBy()?->getId(),
                'firstName' => $r->getReviewedBy()?->getFirstName(),
                'lastName' => $r->getReviewedBy()?->getLastName(),
            ],
            'executor' => [
                'id' => $r->getExecutor()?->getId(),
                'firstName' => $r->getExecutor()?->getFirstName(),
                'lastName' => $r->getExecutor()?->getLastName(),
            ],
            'createdAt' => $r->getCreatedAt()?->format('c'),
        ];
    }
}
