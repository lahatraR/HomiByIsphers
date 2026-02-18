<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

class ExceptionListener implements EventSubscriberInterface
{
    public function __construct(private string $appEnv = 'prod')
    {
        $this->appEnv = $_ENV['APP_ENV'] ?? 'prod';
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => [['onKernelException', 10]],
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $request = $event->getRequest();

        // Ne traiter que les routes API
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $statusCode = Response::HTTP_INTERNAL_SERVER_ERROR;
        $message = 'Une erreur interne est survenue';

        if ($exception instanceof AuthenticationException) {
            $statusCode = Response::HTTP_UNAUTHORIZED;
            $message = 'Authentification requise';
        } elseif ($exception instanceof AccessDeniedException) {
            $statusCode = Response::HTTP_FORBIDDEN;
            $message = 'Accès refusé';
        } elseif ($exception instanceof \InvalidArgumentException) {
            $statusCode = Response::HTTP_BAD_REQUEST;
            $message = $exception->getMessage();
        }

        $payload = [
            'error' => $message,
            'type' => basename(str_replace('\\', '/', get_class($exception))),
        ];

        // Only expose debug info in dev environment
        if ($this->appEnv === 'dev') {
            $payload['message'] = $exception->getMessage();
            $payload['file'] = $exception->getFile();
            $payload['line'] = $exception->getLine();
            $payload['trace'] = explode("\n", $exception->getTraceAsString());
        }

        $response = new JsonResponse($payload, $statusCode);

        $event->setResponse($response);
    }
}
