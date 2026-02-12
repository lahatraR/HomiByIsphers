<?php
namespace App\Service;

use Mailjet\Client;
use Mailjet\Resources;

class MailjetService
{
    private $client;
    private $fromEmail;
    private $fromName;

    public function __construct(string $apiKey, string $apiSecret, string $fromEmail, string $fromName = 'Homi')
    {
        $this->client = new Client($apiKey, $apiSecret, true, ['version' => 'v3.1']);
        $this->fromEmail = $fromEmail;
        $this->fromName = $fromName;
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

        $response = $this->client->post(Resources::$Email, ['body' => $body]);
        return $response->success();
    }
}
