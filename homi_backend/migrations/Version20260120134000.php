<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260120134000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add email verification fields to user table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN email_verified_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP COLUMN is_email_verified');
        $this->addSql('ALTER TABLE "user" DROP COLUMN email_verification_token');
        $this->addSql('ALTER TABLE "user" DROP COLUMN email_verified_at');
    }
}
