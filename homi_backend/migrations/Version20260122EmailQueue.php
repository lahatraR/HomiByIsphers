<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260122EmailQueue extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create pending_email table for async email sending';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE pending_email (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            subject TEXT NOT NULL,
            html_content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            sent_at TIMESTAMP NULL,
            failure_reason TEXT NULL,
            retry_count INTEGER NOT NULL DEFAULT 0
        )');
        
        $this->addSql('CREATE INDEX idx_pending_email_status ON pending_email(sent_at, failure_reason)');
        $this->addSql('CREATE INDEX idx_pending_email_created ON pending_email(created_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE pending_email');
    }
}
