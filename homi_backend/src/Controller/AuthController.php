<?php

namespace App\Controller;

use App\Dto\LoginRequest;
use App\Dto\RegisterRequest;
use App\Dto\AuthResponse;
use App\Entity\User;
use App\Message\SendVerificationEmailMessage;
use App\Repository\UserRepository;
use App\Security\JwtTokenProvider;
use App\Service\EmailQueue;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;
use App\Service\MailjetService;


#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private JwtTokenProvider $jwtTokenProvider,
        private ValidatorInterface $validator,
        private EmailQueue $emailQueue,
        private LoggerInterface $logger,
        private MailjetService $mailjetService,
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
            $registerRequest->role = 'ROLE_USER'; // Force ROLE_USER — never accept role from client

            // Trace l'entrée sans exposer le mot de passe
            $this->logger->info('Registration request received', [
                'email' => $registerRequest->email,
                'role' => $registerRequest->role,
                'firstName' => $registerRequest->firstName,
                'lastName' => $registerRequest->lastName,
                'frontendUrl' => $_ENV['FRONTEND_URL'] ?? null,
            ]);

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
            

            // Désactivation du mailer : activer directement l'utilisateur
            $user->setIsEmailVerified(true);
            $user->setEmailVerifiedAt(new \DateTime());
            $user->setEmailVerificationToken(null);
            $user->setEmailVerificationTokenExpiresAt(null);

            try {
                $this->em->persist($user);
                $this->em->flush();
                
                $this->logger->info('✅ [Register] User created and auto-verified', [
                    'userId' => $user->getId(),
                    'email' => $user->getEmail(),
                ]);
            } catch (UniqueConstraintViolationException) {
                $this->logger->warning('Registration conflict: email already exists', [
                    'email' => $registerRequest->email,
                ]);
                return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
            } catch (\Throwable $e) {
                // Log détaillé pour diagnostiquer en production
                $this->logger->error('Registration error', [
                    'email' => $registerRequest->email,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                error_log('Registration error: ' . $e->getMessage());
                return $this->json([
                    'error' => 'Erreur serveur lors de l\'inscription'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            return $this->json([
                'message' => 'Inscription réussie. Votre compte est activé.',
                'email' => $user->getEmail()
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            // Log l'erreur pour le debugging
            $this->logger->error('Registration exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            error_log('Registration exception: ' . $e->getMessage());
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

            // Vérifier si l'email est vérifié
            // if (!$user->isEmailVerified()) {
            //     return $this->json(
            //         ['error' => 'Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception.'],
            //         Response::HTTP_FORBIDDEN
            //     );
            // }

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

    /**
     * Vérifier l'email avec le token
     */
    #[Route('/verify-email/{token}', name: 'verify_email', methods: ['GET'])]
    public function verifyEmail(string $token): JsonResponse
    {
        try {
            $user = $this->userRepository->findOneBy(['emailVerificationToken' => $token]);

            if (!$user) {
                return $this->json(
                    ['error' => 'Token de vérification invalide ou expiré'],
                    Response::HTTP_BAD_REQUEST
                );
            }

            // Vérifier si le token a expiré
            $expiresAt = $user->getEmailVerificationTokenExpiresAt();
            if ($expiresAt && $expiresAt < new \DateTime()) {
                return $this->json(
                    ['error' => 'Token de vérification expiré. Veuillez demander un nouvel email de vérification.'],
                    Response::HTTP_BAD_REQUEST
                );
            }

            if ($user->isEmailVerified()) {
                return $this->json(
                    ['message' => 'Email déjà vérifié. Vous pouvez vous connecter.'],
                    Response::HTTP_OK
                );
            }

            // Marquer l'email comme vérifié
            $user->setIsEmailVerified(true);
            $user->setEmailVerifiedAt(new \DateTime());
            $user->setEmailVerificationToken(null); // Supprimer le token après utilisation
            $user->setEmailVerificationTokenExpiresAt(null); // Supprimer la date d'expiration

            $this->em->flush();

            return $this->json([
                'message' => 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.',
                'email' => $user->getEmail()
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Une erreur est survenue lors de la vérification'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Renvoyer l'email de vérification
     */
    #[Route('/resend-verification', name: 'resend_verification', methods: ['POST'])]
    public function resendVerification(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $email = $data['email'] ?? '';

            if (!$email) {
                return $this->json(['error' => 'Email requis'], Response::HTTP_BAD_REQUEST);
            }

            $user = $this->userRepository->findOneBy(['email' => $email]);

            if (!$user) {
                // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
                return $this->json(
                    ['message' => 'Si un compte existe avec cet email, un nouvel email de vérification a été envoyé.'],
                    Response::HTTP_OK
                );
            }

            if ($user->isEmailVerified()) {
                return $this->json(
                    ['message' => 'Cet email est déjà vérifié.'],
                    Response::HTTP_OK
                );
            }

            // Générer un nouveau token
            $verificationToken = bin2hex(random_bytes(32));
            $user->setEmailVerificationToken($verificationToken);
            
            // Token expire dans 24h
            $expiresAt = new \DateTime('+24 hours');
            $user->setEmailVerificationTokenExpiresAt($expiresAt);
            
            $this->em->flush();
            
            $this->logger->info('📧 [Resend] Enqueueing verification email', [
                'userId' => $user->getId(),
                'email' => $user->getEmail(),
            ]);

            // Enqueuer l'email pour envoi APRÈS la réponse HTTP
            $this->emailQueue->enqueue(
                new SendVerificationEmailMessage(
                    userId: $user->getId(),
                    email: $user->getEmail(),
                    token: $verificationToken,
                    firstName: $user->getFirstName() ?? ''
                )
            );
            
            $this->logger->info('✅ [Resend] Email enqueued successfully', [
                'userId' => $user->getId(),
            ]);

            return $this->json(
                ['message' => 'Un nouvel email de vérification a été envoyé.'],
                Response::HTTP_OK
            );
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Une erreur est survenue'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }


}
