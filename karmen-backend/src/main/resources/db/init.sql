CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;
CREATE SCHEMA IF NOT EXISTS facturai;
SET search_path TO facturai, public;

CREATE TABLE users (
    id            BIGSERIAL       PRIMARY KEY,
    email         VARCHAR(150)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    full_name     VARCHAR(200)    NOT NULL,
    role          VARCHAR(20)     NOT NULL DEFAULT 'CONTADOR'
                                  CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'CONTADOR')),
    is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE companies (
    id         BIGSERIAL     PRIMARY KEY,
    owner_id   BIGINT        NOT NULL,
    name       VARCHAR(200)  NOT NULL,
    nit        VARCHAR(30),
    address    VARCHAR(300),
    phone      VARCHAR(20),
    email      VARCHAR(150),
    logo_url   VARCHAR(500),
    created_at TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_companies_nit   UNIQUE (nit),
    CONSTRAINT fk_companies_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE providers (
    id         BIGSERIAL     PRIMARY KEY,
    company_id BIGINT        NOT NULL,
    name       VARCHAR(200)  NOT NULL,
    nit        VARCHAR(30),
    email      VARCHAR(150),
    phone      VARCHAR(20),
    address    VARCHAR(300),
    type       VARCHAR(20)   NOT NULL DEFAULT 'PROVEEDOR'
                             CONSTRAINT chk_providers_type CHECK (type IN ('PROVEEDOR', 'CLIENTE')),
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_providers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE invoices (
    id             BIGSERIAL        PRIMARY KEY,
    company_id     BIGINT           NOT NULL,
    provider_id    BIGINT,
    uploaded_by    BIGINT           NOT NULL,
    invoice_number VARCHAR(50),
    invoice_date   DATE,
    due_date       DATE,
    type           VARCHAR(10)      NOT NULL CONSTRAINT chk_invoices_type CHECK (type IN ('INGRESO', 'EGRESO')),
    subtotal       NUMERIC(15,2)    NOT NULL DEFAULT 0,
    tax_amount     NUMERIC(15,2)    NOT NULL DEFAULT 0,
    total          NUMERIC(15,2)    NOT NULL DEFAULT 0,
    currency       VARCHAR(3)       NOT NULL DEFAULT 'COP',
    status         VARCHAR(20)      NOT NULL DEFAULT 'PENDIENTE'
                                    CONSTRAINT chk_invoices_status CHECK (status IN ('PENDIENTE','CONFIRMADA','CONTABILIZADA')),
    notes          TEXT,
    created_at     TIMESTAMP        NOT NULL DEFAULT NOW(),
    confirmed_at   TIMESTAMP,
    CONSTRAINT fk_invoices_company  FOREIGN KEY (company_id)  REFERENCES companies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_invoices_user     FOREIGN KEY (uploaded_by) REFERENCES users(id)     ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_invoices_total   CHECK (total >= 0),
    CONSTRAINT chk_invoices_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_invoices_tax     CHECK (tax_amount >= 0)
);

CREATE TABLE invoice_files (
    id           BIGSERIAL     PRIMARY KEY,
    invoice_id   BIGINT        NOT NULL,
    file_name    VARCHAR(300)  NOT NULL,
    file_path    VARCHAR(500)  NOT NULL,
    file_type    VARCHAR(10)   NOT NULL CONSTRAINT chk_invoice_files_type CHECK (file_type IN ('PDF','JPG','PNG')),
    file_size_kb INTEGER,
    uploaded_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_invoice_files_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE ocr_extractions (
    id               BIGSERIAL     PRIMARY KEY,
    invoice_id       BIGINT        NOT NULL,
    raw_text         TEXT,
    extracted_data   JSONB,
    confidence_score NUMERIC(5,2)  CONSTRAINT chk_ocr_confidence CHECK (confidence_score BETWEEN 0 AND 100),
    status           VARCHAR(20)   NOT NULL CONSTRAINT chk_ocr_status CHECK (status IN ('PROCESANDO','COMPLETADO','FALLIDO')),
    error_message    TEXT,
    processed_at     TIMESTAMP,
    CONSTRAINT uq_ocr_invoice UNIQUE (invoice_id),
    CONSTRAINT fk_ocr_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE accounting_entries (
    id           BIGSERIAL       PRIMARY KEY,
    invoice_id   BIGINT          NOT NULL,
    company_id   BIGINT          NOT NULL,
    created_by   BIGINT          NOT NULL,
    account_code VARCHAR(20)     NOT NULL,
    account_name VARCHAR(200)    NOT NULL,
    debit        NUMERIC(15,2)   NOT NULL DEFAULT 0,
    credit       NUMERIC(15,2)   NOT NULL DEFAULT 0,
    description  TEXT,
    entry_date   DATE            NOT NULL,
    created_at   TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_entries_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)  ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_entries_company FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_entries_user    FOREIGN KEY (created_by) REFERENCES users(id)     ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_entries_debit  CHECK (debit  >= 0),
    CONSTRAINT chk_entries_credit CHECK (credit >= 0)
);

CREATE TABLE audit_logs (
    id          BIGSERIAL     PRIMARY KEY,
    user_id     BIGINT,
    entity_type VARCHAR(50)   NOT NULL,
    entity_id   BIGINT,
    action      VARCHAR(30)   NOT NULL
                              CONSTRAINT chk_audit_action CHECK (action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT')),
    details     JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_companies_owner      ON companies(owner_id);
CREATE INDEX idx_providers_company    ON providers(company_id);
CREATE INDEX idx_providers_type       ON providers(type, is_active);
CREATE INDEX idx_providers_name_trgm  ON providers USING gin(name gin_trgm_ops);
CREATE INDEX idx_invoices_company     ON invoices(company_id);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_invoices_type        ON invoices(type);
CREATE INDEX idx_invoices_company_date ON invoices(company_id, invoice_date DESC);
CREATE INDEX idx_invoices_number_trgm ON invoices USING gin(invoice_number gin_trgm_ops);
CREATE INDEX idx_entries_invoice      ON accounting_entries(invoice_id);
CREATE INDEX idx_entries_company      ON accounting_entries(company_id);
CREATE INDEX idx_entries_date         ON accounting_entries(entry_date DESC);
CREATE INDEX idx_audit_user_date      ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_ocr_invoice          ON ocr_extractions(invoice_id);
CREATE INDEX idx_ocr_data_gin         ON ocr_extractions USING gin(extracted_data);

CREATE OR REPLACE VIEW vw_invoices_summary AS
SELECT i.id, i.invoice_number, i.invoice_date, i.type, i.status,
       i.subtotal, i.tax_amount, i.total, i.currency,
       c.name AS company_name, p.name AS provider_name, p.nit AS provider_nit,
       u.full_name AS uploaded_by_name, i.created_at
FROM invoices i
JOIN companies c ON c.id = i.company_id
LEFT JOIN providers p ON p.id = i.provider_id
JOIN users u ON u.id = i.uploaded_by;

CREATE OR REPLACE VIEW vw_monthly_balance AS
SELECT company_id,
       DATE_TRUNC('month', invoice_date) AS month,
       SUM(total) FILTER (WHERE type = 'INGRESO') AS total_income,
       SUM(total) FILTER (WHERE type = 'EGRESO')  AS total_expense,
       SUM(total) FILTER (WHERE type = 'INGRESO')
         - COALESCE(SUM(total) FILTER (WHERE type = 'EGRESO'), 0) AS net_balance,
       COUNT(*) AS invoice_count
FROM invoices
WHERE status IN ('CONFIRMADA', 'CONTABILIZADA') AND invoice_date IS NOT NULL
GROUP BY company_id, DATE_TRUNC('month', invoice_date)
ORDER BY company_id, month DESC;

-- Usuario administrador inicial | Credenciales: admin@karmen.com / Admin123!
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@karmen.com', '$2b$12$DnfpQr04UHnezRIRKnk0U.XCiZKSn/17SV4kNZAYlHI8iBMrRKy6e', 'Administrador Karmen', 'ADMIN');

INSERT INTO companies (owner_id, name, nit, address, email)
VALUES (1, 'Empresa Demo S.A.S.', '900123456-7', 'Calle 123 # 45-67, Bogotá', 'demo@empresademo.com');
