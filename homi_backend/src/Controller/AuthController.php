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
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private JwtTokenProvider $jwtTokenProvider,
        private ValidatorInterface $validator,
        private MailerInterface $mailer,
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
            
            // Générer un token de vérification
            $verificationToken = bin2hex(random_bytes(32));
            $user->setEmailVerificationToken($verificationToken);
            $user->setIsEmailVerified(false);
            
            // Token expire dans 24h
            $expiresAt = new \DateTime('+24 hours');
            $user->setEmailVerificationTokenExpiresAt($expiresAt);

            try {
                $this->em->persist($user);
                $this->em->flush();

                // Envoyer l'email de vérification
                $this->sendVerificationEmail($user, $verificationToken);
            } catch (UniqueConstraintViolationException) {
                return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
            } catch (\Throwable $e) {
                return $this->json(['error' => 'Erreur serveur'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            return $this->json([
                'message' => 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
                'email' => $user->getEmail()
            ], Response::HTTP_CREATED);
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

            // Vérifier si l'email est vérifié
            if (!$user->isEmailVerified()) {
                return $this->json(
                    ['error' => 'Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception.'],
                    Response::HTTP_FORBIDDEN
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

            // Renvoyer l'email
            $this->sendVerificationEmail($user, $verificationToken);

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

    /**
     * Méthode privée pour envoyer l'email de vérification
     */
    private function sendVerificationEmail(User $user, string $token): void
    {
        // URL de vérification (à ajuster selon votre configuration frontend)
        $verificationUrl = sprintf(
            '%s/verify-email/%s',
            $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173',
            $token
        );

        $email = (new Email())
            ->from($_ENV['MAILER_FROM'] ?? 'noreply@homi.com')
            ->to($user->getEmail())
            ->subject('Vérification de votre compte Homi')
            ->html(sprintf(
                '<html><body>' .
                '<h1>Bienvenue sur Homi !</h1>' .
                '<p>Bonjour %s,</p>' .
                '<p>Merci de vous être inscrit(e) sur Homi. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>' .
                '<p><a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon email</a></p>' .
                '<p>Ou copiez ce lien dans votre navigateur : %s</p>' .
                '<p>Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.</p>' .
                '<p>Cordialement,<br>L\'équipe Homi</p>' .
                '</body></html>',
                $user->getFirstName() ?? $user->getEmail(),
                $verificationUrl,
                $verificationUrl
            ));

        $this->mailer->send($email);
    }
}
