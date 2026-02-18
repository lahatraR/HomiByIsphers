<?php

namespace App\Controller;


use App\Repository\UserSettingsRepository;
use App\Entity\UserSettings;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/2fa')]
class TwoFAController extends AbstractController
{
    public function __construct(
        private UserSettingsRepository $settingsRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_2fa_status', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function status(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $settings = $this->settingsRepository->findOneBy(['user' => $user]);
        $enabled = $settings ? $settings->getTwofa() : false;
        return $this->json(['enabled' => $enabled]);
    }

    #[Route('/enable', name: 'api_2fa_enable', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function enable(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $settings = $this->settingsRepository->findOneBy(['user' => $user]);
        if (!$settings) {
            $settings = new UserSettings();
            $settings->setUser($user);
        }
        $settings->setTwofa(true);
        $this->em->persist($settings);
        $this->em->flush();
        return $this->json(['message' => '2FA activée']);
    }

    #[Route('/disable', name: 'api_2fa_disable', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function disable(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $settings = $this->settingsRepository->findOneBy(['user' => $user]);
        if (!$settings) {
            $settings = new UserSettings();
            $settings->setUser($user);
        }
        $settings->setTwofa(false);
        $this->em->persist($settings);
        $this->em->flush();
        return $this->json(['message' => '2FA désactivée']);
    }
}
