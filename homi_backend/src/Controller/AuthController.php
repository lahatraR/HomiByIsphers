<?php

namespace App\Controller;

use App\Dto\LoginRequest;
use App\Dto\RegisterRequest;
use App\Dto\AuthResponse;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\JwtTokenProvider;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
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
    #[Route('/register', name: 'app_register', methods: ['POST'])]
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
            $registerRequest->firstName = $data['firstName'] ?? '';
            $registerRequest->lastName = $data['lastName'] ?? '';
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
            $user->setFirstName($registerRequest->firstName);
            $user->setLastName($registerRequest->lastName);
            $user->setPassword(
                $this->passwordHasher->hashPassword($user, $registerRequest->password)
            );
            $user->setRole($registerRequest->role);

            try {
                $this->em->persist($user);
                $this->em->flush();
            } catch (UniqueConstraintViolationException) {
                return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
            } catch (\Throwable $e) {
                return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
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

    /**
     * Déconnexion utilisateur
     */
    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json(['message' => 'Déconnexion réussie'], Response::HTTP_OK);
    }

    /**
     * Obtenir l'utilisateur connecté via le token JWT
     */
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        try {
            $authHeader = $request->headers->get('Authorization');

            if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
                return $this->json(['error' => 'Missing token'], Response::HTTP_UNAUTHORIZED);
            }

            $tokenString = substr($authHeader, 7);
            $token = $this->jwtTokenProvider->validateToken($tokenString);

            if (!$token) {
                return $this->json(['error' => 'Invalid JWT token'], Response::HTTP_UNAUTHORIZED);
            }

            // Extraire l'ID du token (sub claim)
            $userId = $token->claims()->get('sub');
            $user = $this->userRepository->find($userId);

            if (!$user) {
                return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
            }

            return $this->json([
                'userId' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'role' => $user->getRole(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid JWT token', 'message' => $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        }
    }
}
