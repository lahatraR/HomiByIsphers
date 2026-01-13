<?php

namespace App\Controller;

use App\Entity\Domicile;
use App\Entity\User;
use App\Service\DomicileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Doctrine\Persistence\ManagerRegistry;

#[Route('/api/domiciles')]
class DomicileController extends AbstractController
{
    public function __construct(
        private DomicileService $domicileService,
        private ManagerRegistry $doctrine,
    ) {
    }

    /**
     * Créer un domicile
     */
    #[Route('', name: 'create_domicile', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if ($data === null) {
                return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
            }

            $em = $this->doctrine->getManager();
            $domicile = new Domicile();
            $domicile->setName($data['name'] ?? '');
            $domicile->setAddress($data['address'] ?? '');
            $domicile->setDescription($data['description'] ?? null);
            $domicile->setOwner($this->getUser());
            $domicile->setCreatedAt(new \DateTimeImmutable());
            $domicile->setUpdatedAt(new \DateTimeImmutable());

            $em->persist($domicile);
            $em->flush();

            return $this->json([
                'id'          => $domicile->getId(),
                'name'        => $domicile->getName(),
                'address'     => $domicile->getAddress(),
                'description' => $domicile->getDescription(),
                'owner'       => $domicile->getOwner() ? [
                    'id'    => $domicile->getOwner()->getId(),
                    'email' => $domicile->getOwner()->getEmail(),
                    'role'  => $domicile->getOwner()->getRole(),
                ] : null,
                'executors'   => [],
                'createdAt'   => $domicile->getCreatedAt()?->format('c'),
            ], Response::HTTP_CREATED);
        } catch (\Throwable $e) {
            return $this->json([
                'error'   => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer un domicile
     */
    #[Route('/{id}', name: 'get_domicile', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getDomicile(int $id): JsonResponse
    {
        try {
            $domicile = $this->doctrine->getRepository(Domicile::class)->find($id);
            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            /** @var User|null $user */
            $user = $this->getUser();
            $isOwner = $user && $domicile->getOwner()?->getId() === $user->getId();
            $isExecutor = false;
            
            if ($user) {
                foreach ($domicile->getDomicileExecutors() as $domExec) {
                    if ($domExec->getExecutor()?->getId() === $user->getId()) {
                        $isExecutor = true;
                        break;
                    }
                }
            }

            if (!$isOwner && !$isExecutor && (!$user || $user->getRole() !== 'ROLE_ADMIN')) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $executors = [];
            foreach ($domicile->getDomicileExecutors() as $domExec) {
                $executor = $domExec->getExecutor();
                if ($executor) {
                    $executors[] = [
                        'id'    => $executor->getId(),
                        'email' => $executor->getEmail(),
                        'role'  => $executor->getRole(),
                    ];
                }
            }

            return $this->json([
                'id'          => $domicile->getId(),
                'name'        => $domicile->getName(),
                'address'     => $domicile->getAddress(),
                'description' => $domicile->getDescription(),
                'owner'       => $domicile->getOwner() ? [
                    'id'    => $domicile->getOwner()->getId(),
                    'email' => $domicile->getOwner()->getEmail(),
                    'role'  => $domicile->getOwner()->getRole(),
                ] : null,
                'executors'   => $executors,
                'createdAt'   => $domicile->getCreatedAt()?->format('c'),
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return $this->json([
                'error'   => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mettre à jour un domicile
     */
    #[Route('/{id}', name: 'update_domicile', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $domicile = $this->domicileService->getDomicile($id);

            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);

            if (!isset($data['name']) || empty($data['name'])) {
                return $this->json(['error' => 'Le nom du domicile est requis'], Response::HTTP_BAD_REQUEST);
            }

            $domicile->setName($data['name']);
            if (isset($data['address'])) {
                $domicile->setAddress($data['address']);
            }
            if (isset($data['description'])) {
                $domicile->setDescription($data['description']);
            }
            $domicile->setUpdatedAt(new \DateTimeImmutable());

            $updated = $this->domicileService->updateDomicile($domicile, $data['name']);

            return $this->json([
                'id'          => $updated->getId(),
                'name'        => $updated->getName(),
                'address'     => $updated->getAddress(),
                'description' => $updated->getDescription(),
                'createdAt'   => $updated->getCreatedAt()?->format('c'),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer un domicile
     */
    #[Route('/{id}', name: 'delete_domicile', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id): JsonResponse
    {
        try {
            $domicile = $this->domicileService->getDomicile($id);

            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $this->domicileService->deleteDomicile($domicile);

            return $this->json(['message' => 'Domicile supprimé avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lister tous les exécutants d'un domicile
     */
    #[Route('/{id}/executors', name: 'list_executors', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listExecutors(int $id): JsonResponse
    {
        try {
            $domicile = $this->domicileService->getDomicile($id);

            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            // Vérifier l'accès (propriétaire, exécutant ou admin)
            $isOwner = $domicile->getOwner()?->getId() === $user->getId();
            $isExecutor = false;
            
            foreach ($domicile->getDomicileExecutors() as $domExec) {
                if ($domExec->getExecutor()?->getId() === $user->getId()) {
                    $isExecutor = true;
                    break;
                }
            }

            if (!$isOwner && !$isExecutor && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $executors = [];
            foreach ($domicile->getDomicileExecutors() as $domExec) {
                $executor = $domExec->getExecutor();
                if ($executor) {
                    $executors[] = [
                        'id'        => $domExec->getId(),
                        'user'      => [
                            'id'    => $executor->getId(),
                            'email' => $executor->getEmail(),
                            'role'  => $executor->getRole(),
                        ],
                        'createdAt' => $domExec->getCreatedAt()?->format('c'),
                    ];
                }
            }

            return $this->json([
                'domicile'  => $domicile->getId(),
                'name'      => $domicile->getName(),
                'executors' => $executors,
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return $this->json([
                'error'   => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Ajouter un exécutant à un domicile
     */
    #[Route('/{id}/executors', name: 'add_executor', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function addExecutor(int $id, Request $request): JsonResponse
    {
        try {
            $domicile = $this->domicileService->getDomicile($id);

            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);
            if ($data === null) {
                return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
            }

            $executorId = $data['userId'] ?? $data['user_id'] ?? null;
            if (!$executorId) {
                return $this->json(['error' => 'userId est requis'], Response::HTTP_BAD_REQUEST);
            }

            $executor = $this->doctrine->getRepository(User::class)->find($executorId);

            if (!$executor) {
                return $this->json(['error' => 'Exécutant non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $domExec = $this->domicileService->addExecutor($domicile, $executor);

            return $this->json([
                'id'        => $domExec->getId(),
                'domicile'  => $domExec->getDomicile()->getId(),
                'executor'  => [
                    'id'    => $domExec->getExecutor()->getId(),
                    'email' => $domExec->getExecutor()->getEmail(),
                    'role'  => $domExec->getExecutor()->getRole(),
                ],
                'createdAt' => $domExec->getCreatedAt()?->format('c'),
            ], Response::HTTP_CREATED);
        } catch (\Throwable $e) {
            return $this->json([
                'error'   => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer un exécutant d'un domicile
     */
    #[Route('/{id}/executors/{user_id}', name: 'remove_executor', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function removeExecutor(int $id, int $user_id): JsonResponse
    {
        try {
            $domicile = $this->domicileService->getDomicile($id);

            if (!$domicile) {
                return $this->json(['error' => 'Domicile non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
            }

            if ($domicile->getOwner()->getId() !== $user->getId() && !in_array('ROLE_ADMIN', $user->getRoles())) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $executor = $this->doctrine->getRepository(User::class)->find($user_id);

            if (!$executor) {
                return $this->json(['error' => 'Exécutant non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $this->domicileService->removeExecutor($domicile, $executor);

            return $this->json(['message' => 'Exécutant supprimé avec succès'], Response::HTTP_OK);
        } catch (\Throwable $e) {
            return $this->json([
                'error'   => 'Une erreur est survenue',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

