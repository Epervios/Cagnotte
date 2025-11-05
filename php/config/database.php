<?php
/**
 * Configuration de la base de données
 * 
 * À MODIFIER avec vos informations de connexion MySQL
 */

define('DB_HOST', 'localhost');           // Hôte de la base de données
define('DB_NAME', 'cagnotte_sic');        // Nom de la base de données
define('DB_USER', 'votre_utilisateur');   // Utilisateur MySQL
define('DB_PASS', 'votre_mot_de_passe');  // Mot de passe MySQL
define('DB_CHARSET', 'utf8mb4');

/**
 * Crée une connexion PDO à la base de données
 */
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur de connexion à la base de données']);
        exit;
    }
}
?>