<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Login
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['detail' => 'Email et mot de passe requis']);
        exit;
    }
    
    $stmt = $pdo->prepare('SELECT * FROM participants WHERE email = ?');
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();
    
    if (!$user || !$user['actif']) {
        http_response_code(401);
        echo json_encode(['detail' => 'Email ou mot de passe incorrect']);
        exit;
    }
    
    if (!password_verify($input['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['detail' => 'Email ou mot de passe incorrect']);
        exit;
    }
    
    $token = createJWT($user['id'], $user['email']);
    $is_admin = isAdmin($user['email']);
    
    unset($user['password']);
    
    echo json_encode([
        'token' => $token,
        'user' => $user,
        'is_admin' => $is_admin
    ]);
    
} elseif ($method === 'GET') {
    // Get current user
    $user = getCurrentUser($pdo);
    unset($user['password']);
    echo json_encode($user);
}
?>