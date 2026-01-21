<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour créer la table task_time_log
 * Permet de sauvegarder les heures travaillées sur les tâches
 */
final class Version20260120125000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create task_time_log table for tracking time spent on tasks';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE task_time_log (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL,
            executor_id INTEGER NOT NULL,
            validated_by_id INTEGER,
            start_time TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            end_time TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            hours_worked DOUBLE PRECISION NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT \'PENDING\',
            notes TEXT,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
            FOREIGN KEY (executor_id) REFERENCES "user"(id) ON DELETE CASCADE,
            FOREIGN KEY (validated_by_id) REFERENCES "user"(id) ON DELETE SET NULL
        )');
        
        $this->addSql('CREATE INDEX idx_task_time_log_task_id ON task_time_log(task_id)');
        $this->addSql('CREATE INDEX idx_task_time_log_executor_id ON task_time_log(executor_id)');
        $this->addSql('CREATE INDEX idx_task_time_log_status ON task_time_log(status)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE task_time_log');
    }
}
