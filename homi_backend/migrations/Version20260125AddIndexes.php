<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Add missing database indexes for performance optimization.
 * These indexes cover the most frequently queried columns across all entities.
 */
final class Version20260125AddIndexes extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add performance indexes to frequently queried columns';
    }

    public function up(Schema $schema): void
    {
        // User indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_user_email_verification_token ON "user" (email_verification_token)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_user_role ON "user" (role)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_user_is_email_verified ON "user" (is_email_verified)');

        // Task indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_task_status ON task (status)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_task_created_at ON task (created_at)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_task_start_time ON task (start_time)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_task_assigned_to ON task (assigned_to_id)');

        // Domicile indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_domicile_created_by ON domicile (created_by_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_domicile_name ON domicile (name)');

        // DomicileExecutor indexes
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_domicile_executor_unique ON domicile_executor (domicile_id, executor_id)');

        // TaskTimeLog indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_time_log_executor ON task_time_log (executor_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_time_log_status ON task_time_log (status)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_time_log_start_time ON task_time_log (start_time)');

        // Invoice indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice (status)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_invoice_executor ON invoice (executor_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_invoice_domicile ON invoice (domicile_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON invoice (created_at)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoice (due_date)');

        // PendingEmail indexes (composite index matching the original EmailQueue migration)
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_pending_email_status ON pending_email (sent_at, failure_reason)');

        // ── Tables créées par des migrations ultérieures — conditionnel ──
        $this->conditionalIndex('activity', 'idx_activity_user', 'user_id');
        $this->conditionalIndex('activity', 'idx_activity_created_at', 'created_at');
        $this->conditionalIndex('notification', 'idx_notification_user', 'user_id');
        $this->conditionalIndex('notification', 'idx_notification_is_read', 'is_read');
        $this->conditionalIndex('refresh_token', 'idx_refresh_token_expires_at', 'expires_at');
        $this->conditionalIndex('refresh_token', 'idx_refresh_token_user', 'user_id');
        $this->conditionalIndex('favorite', 'idx_favorite_user', 'user_id');
        $this->conditionalIndex('task_history', 'idx_task_history_task', 'task_id');
    }

    /**
     * Crée un index uniquement si la table existe (safe pour fresh DB).
     */
    private function conditionalIndex(string $table, string $indexName, string $column): void
    {
        $this->addSql("DO \$\$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '{$table}') THEN CREATE INDEX IF NOT EXISTS {$indexName} ON {$table} ({$column}); END IF; END \$\$;");
    }

    public function down(Schema $schema): void
    {
        // Drop all added indexes
        $this->addSql('DROP INDEX IF EXISTS idx_user_email_verification_token');
        $this->addSql('DROP INDEX IF EXISTS idx_user_role');
        $this->addSql('DROP INDEX IF EXISTS idx_user_is_email_verified');
        $this->addSql('DROP INDEX IF EXISTS idx_task_status');
        $this->addSql('DROP INDEX IF EXISTS idx_task_created_at');
        $this->addSql('DROP INDEX IF EXISTS idx_task_start_time');
        $this->addSql('DROP INDEX IF EXISTS idx_task_assigned_to');
        $this->addSql('DROP INDEX IF EXISTS idx_domicile_created_by');
        $this->addSql('DROP INDEX IF EXISTS idx_domicile_name');
        $this->addSql('DROP INDEX IF EXISTS idx_domicile_executor_unique');
        $this->addSql('DROP INDEX IF EXISTS idx_time_log_executor');
        $this->addSql('DROP INDEX IF EXISTS idx_time_log_status');
        $this->addSql('DROP INDEX IF EXISTS idx_time_log_start_time');
        $this->addSql('DROP INDEX IF EXISTS idx_invoice_status');
        $this->addSql('DROP INDEX IF EXISTS idx_invoice_executor');
        $this->addSql('DROP INDEX IF EXISTS idx_invoice_domicile');
        $this->addSql('DROP INDEX IF EXISTS idx_invoice_created_at');
        $this->addSql('DROP INDEX IF EXISTS idx_invoice_due_date');
        $this->addSql('DROP INDEX IF EXISTS idx_activity_user');
        $this->addSql('DROP INDEX IF EXISTS idx_activity_created_at');
        $this->addSql('DROP INDEX IF EXISTS idx_notification_user');
        $this->addSql('DROP INDEX IF EXISTS idx_notification_is_read');
        $this->addSql('DROP INDEX IF EXISTS idx_refresh_token_expires_at');
        $this->addSql('DROP INDEX IF EXISTS idx_refresh_token_user');
        $this->addSql('DROP INDEX IF EXISTS idx_favorite_user');
        $this->addSql('DROP INDEX IF EXISTS idx_pending_email_status');
        $this->addSql('DROP INDEX IF EXISTS idx_task_history_task');
    }
}
