<?php

namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class JwtAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private JwtTokenProvider $jwtTokenProvider,
        private UserRepository $userRepository,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('Authorization') &&
               str_starts_with($request->headers->get('Authorization', ''), 'Bearer ');
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $authorizationHeader = $request->headers->get('Authorization', '');
        $token = substr($authorizationHeader, 7);

        $validatedToken = $this->jwtTokenProvider->validateToken($token);

        if ($validatedToken === null) {
            throw new CustomUserMessageAuthenticationException('Invalid JWT token');
        }

        $userId = $this->jwtTokenProvider->getUserIdFromToken($validatedToken);

        if ($userId === null) {
            throw new CustomUserMessageAuthenticationException('Invalid token claims');
        }

        return new SelfValidatingPassport(
            new UserBadge((string) $userId, function (string $userId) {
                $user = $this->userRepository->find((int) $userId);
                if ($user === null) {
                    throw new CustomUserMessageAuthenticationException('User not found');
                }
                return $user;
            })
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'error' => 'Authentication failed',
            'message' => $exception->getMessageKey(),
        ], Response::HTTP_UNAUTHORIZED);
    }
}
