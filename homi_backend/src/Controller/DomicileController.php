<?php

namespace App\Controller;

use App\Entity\Domicile;
use App\Entity\DomicileExecutor;
use App\Repository\DomicileRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/domiciles')]
class DomicileController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private DomicileRepository $domicileRepository,
        private ValidatorInterface $validator,
        private UserRepository $userRepository,
    ) {
    }

    /**
     * Get all domiciles of the connected admin
     */
    #[Route('/', name: 'api_domiciles_index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(): JsonResponse
    {
        $user = $this->getUser();
        
        // L'admin voit uniquement ses domiciles (optimized query with task count)
        $domiciles = $this->domicileRepository->createQueryBuilder('d')
            ->leftJoin('d.tasks', 't')
            ->addSelect('t')
            ->where('d.createdBy = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        return $this->json(array_map(fn($domicile) => $domicile->toArray(), $domiciles));
    }

    /**
     * Get a specific domicile
     */
    #[Route('/{id}/', name: 'api_domiciles_show', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function show(int $id): JsonResponse
    {
        $domicile = $this->domicileRepository->find($id);

        if (!$domicile) {
            return $this->json([
                'error' => 'Domicile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que le domicile appartient à l'admin connecté
        if ($domicile->getCreatedBy() !== $this->getUser()) {
            return $this->json([
                'error' => 'Access denied'
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json($domicile->toArray());
    }

    /**
     * Create a new domicile
     */
    #[Route('', name: 'api_domiciles_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'error' => 'Invalid JSON data'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation du champ requis
        if (empty($data['name'])) {
            return $this->json([
                'error' => 'Field "name" is required'
            ], Response::HTTP_BAD_REQUEST);
        }

        $domicile = new Domicile();
        $domicile->setName($data['name']);
        $domicile->setCreatedBy($this->getUser());

        // Champs optionnels
        if (isset($data['address'])) {
            $domicile->setAddress($data['address']);
        }
        if (isset($data['phone'])) {
            $domicile->setPhone($data['phone']);
        }
        if (isset($data['notes'])) {
            $domicile->setNotes($data['notes']);
        }

        // Validation
        $errors = $this->validator->validate($domicile);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($domicile);
        $this->entityManager->flush();

        return $this->json($domicile->toArray(), Response::HTTP_CREATED);
    }

    /**
     * Update a domicile
     */
    #[Route('/{id}', name: 'api_domiciles_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $domicile = $this->domicileRepository->find($id);

        if (!$domicile) {
            return $this->json([
                'error' => 'Domicile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que le domicile appartient à l'admin connecté
        if ($domicile->getCreatedBy() !== $this->getUser()) {
            return $this->json([
                'error' => 'Access denied'
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'error' => 'Invalid JSON data'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Mise à jour des champs
        if (isset($data['name'])) {
            $domicile->setName($data['name']);
        }
        if (isset($data['address'])) {
            $domicile->setAddress($data['address']);
        }
        if (isset($data['phone'])) {
            $domicile->setPhone($data['phone']);
        }
        if (isset($data['notes'])) {
            $domicile->setNotes($data['notes']);
        }

        // Validation
        $errors = $this->validator->validate($domicile);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'error' => 'Validation failed',
                'errors' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->flush();

        return $this->json($domicile->toArray());
    }

    /**
     * Delete a domicile
     */
    #[Route('/{id}', name: 'api_domiciles_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $domicile = $this->domicileRepository->find($id);

        if (!$domicile) {
            return $this->json([
                'error' => 'Domicile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que le domicile appartient à l'admin connecté
        if ($domicile->getCreatedBy() !== $this->getUser()) {
            return $this->json([
                'error' => 'Access denied'
            ], Response::HTTP_FORBIDDEN);
        }

        // Vérifier s'il y a des tâches associées
        if ($domicile->getTasks()->count() > 0) {
            return $this->json([
                'error' => 'Cannot delete domicile with associated tasks',
                'tasksCount' => $domicile->getTasks()->count()
            ], Response::HTTP_CONFLICT);
        }

        $this->entityManager->remove($domicile);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Domicile deleted successfully'
        ]);
    }

    /**
     * Get domiciles for the current admin (for task creation dropdown)
     */
    #[Route('/my/list/', name: 'api_domiciles_my_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function myDomiciles(): JsonResponse
    {
        $user = $this->getUser();
        
        $domiciles = $this->domicileRepository->findBy(
            ['createdBy' => $user],
            ['name' => 'ASC']
        );

        // Format simplifié pour les dropdowns
        $simplifiedDomiciles = array_map(function($domicile) {
            return [
                'id' => $domicile->getId(),
                'name' => $domicile->getName(),
                'address' => $domicile->getAddress(),
            ];
        }, $domiciles);

        return $this->json($simplifiedDomiciles);
    }

    /**
     * Assigner un exécuteur à un domicile
     */
    #[Route('/{id}/executors', name: 'domicile_add_executor', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function addExecutor(int $id, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $executorId = $data['executorId'] ?? null;

            if (!$executorId) {
                return $this->json(['error' => 'executorId is required'], Response::HTTP_BAD_REQUEST);
            }

            $domicile = $this->domicileRepository->find($id);
            if (!$domicile) {
                return $this->json(['error' => 'Domicile not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que le domicile appartient à l'admin connecté
            if ($domicile->getCreatedBy() !== $this->getUser()) {
                return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
            }

            $executor = $this->userRepository->find($executorId);
            if (!$executor) {
                return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier si l'association existe déjà
            $existingAssociation = $this->entityManager->getRepository(DomicileExecutor::class)
                ->findOneBy([
                    'domicile' => $domicile,
                    'executor' => $executor,
                ]);

            if ($existingAssociation) {
                return $this->json(['message' => 'Executor already assigned to this domicile'], Response::HTTP_OK);
            }

            // Créer l'association
            $domicileExecutor = new DomicileExecutor();
            $domicileExecutor->setDomicile($domicile);
            $domicileExecutor->setExecutor($executor);

            $this->entityManager->persist($domicileExecutor);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Executor added successfully',
                'domicileExecutor' => [
                    'id' => $domicileExecutor->getId(),
                    'domicile' => [
                        'id' => $domicile->getId(),
                        'name' => $domicile->getName(),
                    ],
                    'executor' => [
                        'id' => $executor->getId(),
                        'email' => $executor->getEmail(),
                        'firstName' => $executor->getFirstName(),
                        'lastName' => $executor->getLastName(),
                    ],
                ],
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to add executor'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Obtenir les exécuteurs d'un domicile
     */
    #[Route('/{id}/executors/', name: 'domicile_get_executors', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getExecutors(int $id): JsonResponse
    {
        try {
            $domicile = $this->domicileRepository->find($id);
            if (!$domicile) {
                return $this->json(['error' => 'Domicile not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que le domicile appartient à l'admin connecté
            if ($domicile->getCreatedBy() !== $this->getUser()) {
                return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
            }

            $domicileExecutors = $this->entityManager->getRepository(DomicileExecutor::class)
                ->findBy(['domicile' => $domicile]);

            $executors = array_map(function (DomicileExecutor $de) {
                return [
                    'id' => $de->getExecutor()->getId(),
                    'email' => $de->getExecutor()->getEmail(),
                    'firstName' => $de->getExecutor()->getFirstName(),
                    'lastName' => $de->getExecutor()->getLastName(),
                    'role' => $de->getExecutor()->getRole(),
                ];
            }, $domicileExecutors);

            return $this->json($executors, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to fetch executors'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retirer un exécuteur d'un domicile
     */
    #[Route('/{id}/executors/{executorId}', name: 'domicile_remove_executor', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function removeExecutor(int $id, int $executorId): JsonResponse
    {
        try {
            $domicile = $this->domicileRepository->find($id);
            if (!$domicile) {
                return $this->json(['error' => 'Domicile not found'], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que le domicile appartient à l'admin connecté
            if ($domicile->getCreatedBy() !== $this->getUser()) {
                return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
            }

            $executor = $this->userRepository->find($executorId);
            if (!$executor) {
                return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
            }

            $domicileExecutor = $this->entityManager->getRepository(DomicileExecutor::class)
                ->findOneBy([
                    'domicile' => $domicile,
                    'executor' => $executor,
                ]);

            if (!$domicileExecutor) {
                return $this->json(['error' => 'Executor not assigned to this domicile'], Response::HTTP_NOT_FOUND);
            }

            $this->entityManager->remove($domicileExecutor);
            $this->entityManager->flush();

            return $this->json(['message' => 'Executor removed successfully'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to remove executor'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

