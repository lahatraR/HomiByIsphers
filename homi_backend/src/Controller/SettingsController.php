<?php

namespace App\Controller;


use App\Entity\UserSettings;
use App\Repository\UserSettingsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/settings')]
class SettingsController extends AbstractController
{
    public function __construct(
        private UserSettingsRepository $settingsRepository,
        private EntityManagerInterface $em
    ) {}

    #[Route('', name: 'api_settings_get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getSettings(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        $settings = $this->settingsRepository->findOneBy(['user' => $user]);
        if (!$settings) {
            // Valeurs par défaut si aucun paramètre trouvé
            $settings = new UserSettings();
            $settings->setUser($user);
            $this->em->persist($settings);
            $this->em->flush();
        }
        return $this->json([
            'theme' => $settings->getTheme(),
            'lang' => $settings->getLang(),
            'notifications' => $settings->getNotifications(),
            '2fa' => $settings->getTwofa(),
        ]);
    }

    #[Route('', name: 'api_settings_update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function updateSettings(Request $request): JsonResponse
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
        $data = json_decode($request->getContent(), true);
        if (isset($data['theme'])) $settings->setTheme($data['theme']);
        if (isset($data['lang'])) $settings->setLang($data['lang']);
        if (isset($data['notifications'])) $settings->setNotifications((bool)$data['notifications']);
        if (isset($data['2fa'])) $settings->setTwofa((bool)$data['2fa']);
        $this->em->persist($settings);
        $this->em->flush();
        return $this->json(['message' => 'Paramètres mis à jour']);
    }
}
