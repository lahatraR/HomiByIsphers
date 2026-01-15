<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\Response;

class CorsListener implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 250],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        // Handle preflight OPTIONS request
        // nginx will add CORS headers via 'add_header ... always'
        if ($request->isMethod('OPTIONS') && str_starts_with($request->getPathInfo(), '/api')) {
            $response = new Response('', 204);
            $event->setResponse($response);
        }
    }
}
