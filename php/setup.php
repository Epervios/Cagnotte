<?php
/**
 * Script d'installation - À EXÉCUTER UNE SEULE FOIS
 * 
 * Ce script crée l'administrateur par défaut
 * SUPPRIMEZ CE FICHIER après l'installation !
 */

require_once 'config/database.php';

try {
    $pdo = getDbConnection();
    
    // Vérifie si l'admin existe déjà
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM participants WHERE email = ?');
    $stmt->execute(['eric.savary@lausanne.ch']);
    
    if ($stmt->fetchColumn() > 0) {
        echo '<h1>Installation déjà effectuée</h1>';
        echo '<p>L\'administrateur existe déjà.</p>';
        echo '<p><strong>IMPORTANT : Supprimez ce fichier (setup.php) immédiatement !</strong></p>';
        exit;
    }
    
    // Crée l'administrateur
    $id = bin2hex(random_bytes(16));
    $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare('
        INSERT INTO participants (id, nom, email, password, actif, created_at)
        VALUES (?, ?, ?, ?, 1, NOW())
    ');
    
    $stmt->execute([
        $id,
        'Eric Savary',
        'eric.savary@lausanne.ch',
        $hashedPassword
    ]);
    
    echo '<h1>Installation réussie !</h1>';
    echo '<h2>Administrateur créé :</h2>';
    echo '<ul>';
    echo '<li><strong>Email :</strong> eric.savary@lausanne.ch</li>';
    echo '<li><strong>Mot de passe :</strong> admin123</li>';
    echo '</ul>';
    echo '<p><strong style="color: red;">⚠️ IMPORTANT : Supprimez ce fichier (setup.php) immédiatement !</strong></p>';
    echo '<p>Vous pouvez maintenant vous connecter à l\'application.</p>';
    
} catch (Exception $e) {
    echo '<h1>Erreur d\'installation</h1>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
}
?>