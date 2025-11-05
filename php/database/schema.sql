-- Schéma de la base de données Cagnotte Cadre SIC

CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(36) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    actif TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paiements (
    id VARCHAR(36) PRIMARY KEY,
    participant_id VARCHAR(36) NOT NULL,
    mois VARCHAR(7) NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    methode ENUM('TWINT', 'VIREMENT', 'AUTRE', 'DEPENSE') NOT NULL,
    raison TEXT,
    statut ENUM('en_attente', 'confirme') DEFAULT 'en_attente',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id),
    INDEX idx_participant (participant_id),
    INDEX idx_mois (mois),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de configuration par défaut
INSERT INTO config (config_key, config_value) VALUES
('montant_mensuel', '50'),
('devise', 'CHF'),
('titre', 'Cagnotte Cadre SIC')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);