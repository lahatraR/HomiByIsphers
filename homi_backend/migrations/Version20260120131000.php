<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour créer la table invoice
 */
final class Version20260120131000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create invoice table for billing management';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE invoice (
            id SERIAL PRIMARY KEY,
            invoice_number VARCHAR(50) NOT NULL UNIQUE,
            domicile_id INTEGER NOT NULL,
            executor_id INTEGER NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            total_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
            hourly_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
            subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
            tax_rate DOUBLE PRECISION NOT NULL DEFAULT 20.0,
            tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
            total DOUBLE PRECISION NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT \'DRAFT\',
            due_date DATE,
            paid_date DATE,
            notes TEXT,
            pdf_path VARCHAR(255),
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            FOREIGN KEY (domicile_id) REFERENCES domicile(id) ON DELETE CASCADE,
            FOREIGN KEY (executor_id) REFERENCES "user"(id) ON DELETE CASCADE
        )');
        
        $this->addSql('CREATE INDEX idx_invoice_domicile_id ON invoice(domicile_id)');
        $this->addSql('CREATE INDEX idx_invoice_executor_id ON invoice(executor_id)');
        $this->addSql('CREATE INDEX idx_invoice_status ON invoice(status)');
        $this->addSql('CREATE INDEX idx_invoice_due_date ON invoice(due_date)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE invoice');
    }
}
