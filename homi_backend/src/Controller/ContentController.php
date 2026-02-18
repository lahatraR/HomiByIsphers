<?php

namespace App\Controller;

use App\Entity\Content;
use App\Repository\ContentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/content')]
class ContentController extends AbstractController
{
    public function __construct(
        private ContentRepository $contentRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_admin_content_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(): JsonResponse
    {
        $contents = $this->contentRepository->findAll();
        $data = array_map(function($content) {
            return [
                'id' => $content->getId(),
                'type' => $content->getType(),
                'name' => $content->getName(),
            ];
        }, $contents);
        return $this->json($data);
    }

    #[Route('', name: 'api_admin_content_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['type'], $data['name'])) {
            return $this->json(['error' => 'Champs manquants'], Response::HTTP_BAD_REQUEST);
        }
        $content = new Content();
        $content->setType($data['type']);
        $content->setName($data['name']);
        $this->em->persist($content);
        $this->em->flush();
        return $this->json(['message' => 'Contenu créé', 'id' => $content->getId()], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_content_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $content = $this->contentRepository->find($id);
        if (!$content) {
            return $this->json(['error' => 'Contenu introuvable'], Response::HTTP_NOT_FOUND);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['type'])) {
            $content->setType($data['type']);
        }
        if (isset($data['name'])) {
            $content->setName($data['name']);
        }
        $this->em->flush();
        return $this->json(['message' => 'Contenu mis à jour']);
    }

    #[Route('/{id}', name: 'api_admin_content_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $content = $this->contentRepository->find($id);
        if (!$content) {
            return $this->json(['error' => 'Contenu introuvable'], Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($content);
        $this->em->flush();
        return $this->json(['message' => 'Contenu supprimé']);
    }
}
