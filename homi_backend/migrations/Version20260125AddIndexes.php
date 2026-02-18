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

        // Activity indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity (user_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity (created_at)');

        // Notification indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_notification_user ON notification (user_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification (is_read)');

        // RefreshToken indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_refresh_token_expires_at ON refresh_token (expires_at)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_token (user_id)');

        // Favorite indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_favorite_user ON favorite (user_id)');

        // PendingEmail indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_pending_email_status ON pending_email (status)');

        // TaskHistory indexes
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history (task_id)');
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
