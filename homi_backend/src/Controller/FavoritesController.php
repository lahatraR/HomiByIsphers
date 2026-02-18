<?php

namespace App\Controller;


use App\Entity\Favorite;
use App\Repository\FavoriteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/favorites')]
class FavoritesController extends AbstractController
{
    public function __construct(
        private FavoriteRepository $favoriteRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_favorites_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $favorites = $this->favoriteRepository->findBy(['user' => $user]);
        $data = array_map(fn($fav) => [
            'id' => $fav->getId(),
            'type' => $fav->getType(),
            'label' => $fav->getLabel(),
        ], $favorites);
        return $this->json($data);
    }

    #[Route('', name: 'api_favorites_add', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function add(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $data = json_decode($request->getContent(), true);
        if (!isset($data['type'], $data['label'])) {
            return $this->json(['error' => 'Type et label requis'], Response::HTTP_BAD_REQUEST);
        }
        $favorite = new Favorite();
        $favorite->setType($data['type']);
        $favorite->setLabel($data['label']);
        $favorite->setUser($user);
        $this->em->persist($favorite);
        $this->em->flush();
        return $this->json([
            'id' => $favorite->getId(),
            'type' => $favorite->getType(),
            'label' => $favorite->getLabel(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_favorites_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $favorite = $this->favoriteRepository->find($id);
        $userEntity = ($user instanceof \App\Entity\User) ? $user : null;
        if (!$favorite || !$userEntity || $favorite->getUser()?->getId() !== $userEntity->getId()) {
            return $this->json(['error' => 'Favori introuvable ou accès refusé'], Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($favorite);
        $this->em->flush();
        return $this->json(['message' => 'Favori supprimé']);
    }
}
