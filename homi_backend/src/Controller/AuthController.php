<?php

namespace App\Controller;

use App\Dto\LoginRequest;
use App\Dto\RegisterRequest;
use App\Dto\AuthResponse;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\JwtTokenProvider;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private JwtTokenProvider $jwtTokenProvider,
        private ValidatorInterface $validator,
    ) {
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if ($data === null) {
                return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
            }

            $registerRequest = new RegisterRequest();
            $registerRequest->email = $data['email'] ?? '';
            $registerRequest->password = $data['password'] ?? '';
            $registerRequest->role = $data['role'] ?? 'ROLE_USER';

            // Valider les données
            $errors = $this->validator->validate($registerRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier si l'utilisateur existe déjà
            if ($this->userRepository->findOneBy(['email' => $registerRequest->email])) {
                return $this->json(
                    ['error' => 'Un utilisateur avec cet email existe déjà'],
                    Response::HTTP_CONFLICT
                );
            }

            // Créer le nouvel utilisateur
            $user = new User();
            $user->setEmail($registerRequest->email);
            $user->setPassword(
                $this->passwordHasher->hashPassword($user, $registerRequest->password)
            );
            $user->setRole($registerRequest->role);
            $user->setCreatedAt(new \DateTimeImmutable());
            $user->setUpdatedAt(new \DateTimeImmutable());

            $this->em->persist($user);
            $this->em->flush();

            // Générer le token JWT
            $token = $this->jwtTokenProvider->generateToken($user);
            $authResponse = new AuthResponse(
                token: $token->toString(),
                expiresIn: $this->jwtTokenProvider->getExpirationTime(),
                userId: $user->getId(),
                email: $user->getEmail(),
                role: $user->getRole(),
            );

            return $this->json($authResponse, Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Une erreur est survenue lors de l\'inscription'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Connexion utilisateur
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if ($data === null) {
                return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
            }

            $loginRequest = new LoginRequest();
            $loginRequest->email = $data['email'] ?? '';
            $loginRequest->password = $data['password'] ?? '';

            // Valider les données
            $errors = $this->validator->validate($loginRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
            }

            // Chercher l'utilisateur
            $user = $this->userRepository->findOneBy(['email' => $loginRequest->email]);

            if (!$user) {
                return $this->json(
                    ['error' => 'Email ou mot de passe invalide'],
                    Response::HTTP_UNAUTHORIZED
                );
            }

            // Vérifier le mot de passe
            if (!$this->passwordHasher->isPasswordValid($user, $loginRequest->password)) {
                return $this->json(
                    ['error' => 'Email ou mot de passe invalide'],
                    Response::HTTP_UNAUTHORIZED
                );
            }

            // Générer le token JWT
            $token = $this->jwtTokenProvider->generateToken($user);
            $authResponse = new AuthResponse(
                token: $token->toString(),
                expiresIn: $this->jwtTokenProvider->getExpirationTime(),
                userId: $user->getId(),
                email: $user->getEmail(),
                role: $user->getRole(),
            );

            return $this->json($authResponse, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Une erreur est survenue lors de la connexion'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
