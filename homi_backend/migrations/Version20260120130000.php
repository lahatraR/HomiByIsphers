<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour ajouter le tarif horaire (hourly_rate) à domicile_executor
 */
final class Version20260120130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add hourly_rate column to domicile_executor table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE domicile_executor ADD hourly_rate DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE domicile_executor DROP hourly_rate');
    }
}
