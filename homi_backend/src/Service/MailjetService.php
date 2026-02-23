<?php
namespace App\Service;

use Mailjet\Client;
use Mailjet\Resources;
use Psr\Log\LoggerInterface;

class MailjetService
{
    private $client;
    private $fromEmail;
    private $fromName;
    private $logger;

    public function __construct(string $apiKey, string $apiSecret, string $fromEmail, string $fromName = 'Homi', ?LoggerInterface $logger = null)
    {
        $this->client = new Client($apiKey, $apiSecret, true, ['version' => 'v3.1']);
        $this->fromEmail = $fromEmail;
        $this->fromName = $fromName;
        $this->logger = $logger;
    }

    public function sendEmail(string $toEmail, string $toName, string $subject, string $htmlContent): bool
    {
        $body = [
            'Messages' => [
                [
                    'From' => [
                        'Email' => $this->fromEmail,
                        'Name'  => $this->fromName,
                    ],
                    'To' => [
                        [
                            'Email' => $toEmail,
                            'Name'  => $toName,
                        ]
                    ],
                    'Subject' => $subject,
                    'HTMLPart' => $htmlContent,
                ]
            ]
        ];

        try {
            $this->logger?->info('📤 [Mailjet] Sending email', [
                'from' => $this->fromEmail,
                'to' => $toEmail,
                'subject' => $subject,
            ]);

            $response = $this->client->post(Resources::$Email, ['body' => $body]);

            if ($response->success()) {
                $this->logger?->info('✅ [Mailjet] Email sent successfully', [
                    'to' => $toEmail,
                    'data' => $response->getData(),
                ]);
                return true;
            }

            $this->logger?->error('❌ [Mailjet] API returned failure', [
                'to' => $toEmail,
                'status' => $response->getStatus(),
                'body' => $response->getBody(),
                'data' => $response->getData(),
            ]);
            return false;

        } catch (\Throwable $e) {
            $this->logger?->error('❌ [Mailjet] Exception during send', [
                'to' => $toEmail,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
