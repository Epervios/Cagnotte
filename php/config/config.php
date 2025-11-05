<?php
/**
 * Configuration générale de l'application
 */

// Sécurité JWT
define('JWT_SECRET', 'CHANGEZ_CETTE_CLE_SECRETE_PAR_UNE_CHAINE_ALEATOIRE_LONGUE');
define('JWT_ALGORITHM', 'HS256');

// Administrateurs (emails séparés par des virgules)
define('ADMIN_EMAILS', 'eric.savary@lausanne.ch');

// CORS
define('ALLOWED_ORIGINS', '*');

// Timezone
date_default_timezone_set('Europe/Zurich');

// En-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Répondre aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Vérifie si un email est administrateur
 */
function isAdmin($email) {
    $admins = array_map('trim', explode(',', ADMIN_EMAILS));
    return in_array($email, $admins);
}

/**
 * Génère un token JWT
 */
function createJWT($userId, $email) {
    $header = base64_encode(json_encode(['alg' => JWT_ALGORITHM, 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'email' => $email,
        'exp' => time() + (7 * 24 * 60 * 60) // 7 jours
    ]));
    
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    return "$header.$payload.$signature";
}

/**
 * Vérifie et décode un token JWT
 */
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    $expectedSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    if ($signature !== $expectedSignature) {
        return false;
    }
    
    $payloadData = json_decode(base64_decode($payload), true);
    
    if (!$payloadData || $payloadData['exp'] < time()) {
        return false;
    }
    
    return $payloadData;
}

/**
 * Récupère l'utilisateur connecté depuis le token
 */
function getCurrentUser($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Non autorisé']);
        exit;
    }
    
    $token = $matches[1];
    $payload = verifyJWT($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide']);
        exit;
    }
    
    $stmt = $pdo->prepare('SELECT * FROM participants WHERE id = ? AND actif = 1');
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Utilisateur non trouvé']);
        exit;
    }
    
    return $user;
}

/**
 * Vérifie que l'utilisateur est administrateur
 */
function requireAdmin($user) {
    if (!isAdmin($user['email'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès administrateur requis']);
        exit;
    }
}

/**
 * Arrondit au 0.05 supérieur
 */
function arrondir005($montant) {
    return ceil($montant * 20) / 20;
}
?>