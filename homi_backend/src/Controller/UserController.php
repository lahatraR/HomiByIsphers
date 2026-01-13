<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
class UserController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private UserService $userService,
    ) {
    }

    /**
     * Lister tous les utilisateurs (admin only)
     */
    #[Route('', name: 'list_users', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function listUsers(): JsonResponse
    {
        try {
            $users = $this->userRepository->findAll();
            $data = array_map(fn(User $u) => [
                'id'    => $u->getId(),
                'email' => $u->getEmail(),
                'role'  => $u->getRole(),
            ], $users);
            return new JsonResponse($data);
        } catch (\Throwable $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    #[Route('/{id}', name: 'get_user', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUserById(int $id): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return new JsonResponse(
                    ['error' => 'Utilisateur non trouvé'],
                    Response::HTTP_NOT_FOUND
                );
            }

            $currentUser = $this->getUser();
            if ($currentUser instanceof User && ($currentUser->getId() === $id || $currentUser->getRole() === 'ROLE_ADMIN')) {
                return new JsonResponse([
                    'id'    => $user->getId(),
                    'email' => $user->getEmail(),
                    'role'  => $user->getRole(),
                ], Response::HTTP_OK);
            }

            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => 'Erreur serveur',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mettre à jour son propre profil
     */
    #[Route('/{id}', name: 'update_user', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function updateUser(int $id, Request $request): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $currentUser = $this->getUser();
            if (!$currentUser instanceof User || ($currentUser->getId() !== $id && $currentUser->getRole() !== 'ROLE_ADMIN')) {
                return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);

            if ($data === null) {
                return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
            }

            $updated = $this->userService->updateUser($user, $data);

            return $this->json([
                'id'    => $updated->getId(),
                'email' => $updated->getEmail(),
                'role'  => $updated->getRole(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprimer un utilisateur (admin only)
     */
    #[Route('/{id}', name: 'delete_user', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteUser(int $id): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
            }

            $this->userService->deleteUser($user);

            return $this->json(['message' => 'Utilisateur supprimé avec succès'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Une erreur est survenue'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

