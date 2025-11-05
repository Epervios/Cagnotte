<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$user = getCurrentUser($pdo);
requireAdmin($user);

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

if ($method === 'GET') {
    // Get all participants
    $stmt = $pdo->query('SELECT id, nom, email, actif, created_at FROM participants');
    echo json_encode($stmt->fetchAll());
    
} elseif ($method === 'POST') {
    // Create participant
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['nom']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['detail' => 'Nom et email requis']);
        exit;
    }
    
    // Check if email exists
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM participants WHERE email = ?');
    $stmt->execute([$input['email']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['detail' => 'Cet email existe déjà']);
        exit;
    }
    
    $id = bin2hex(random_bytes(16));
    $password = $input['password'] ?? substr(bin2hex(random_bytes(4)), 0, 8);
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare('
        INSERT INTO participants (id, nom, email, password, actif, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ');
    
    $stmt->execute([
        $id,
        $input['nom'],
        $input['email'],
        $hashedPassword,
        $input['actif'] ?? 1
    ]);
    
    echo json_encode([
        'id' => $id,
        'nom' => $input['nom'],
        'email' => $input['email'],
        'actif' => $input['actif'] ?? 1,
        'created_at' => date('Y-m-d H:i:s')
    ]);
    
} elseif ($method === 'PUT') {
    // Update participant
    $participantId = end($pathParts);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];
    
    if (isset($input['nom'])) {
        $updates[] = 'nom = ?';
        $params[] = $input['nom'];
    }
    if (isset($input['email'])) {
        $updates[] = 'email = ?';
        $params[] = $input['email'];
    }
    if (isset($input['actif'])) {
        $updates[] = 'actif = ?';
        $params[] = $input['actif'];
    }
    if (isset($input['password']) && !empty($input['password'])) {
        $updates[] = 'password = ?';
        $params[] = password_hash($input['password'], PASSWORD_BCRYPT);
    }
    
    $params[] = $participantId;
    
    $stmt = $pdo->prepare('UPDATE participants SET ' . implode(', ', $updates) . ' WHERE id = ?');
    $stmt->execute($params);
    
    $stmt = $pdo->prepare('SELECT id, nom, email, actif, created_at FROM participants WHERE id = ?');
    $stmt->execute([$participantId]);
    echo json_encode($stmt->fetch());
    
} elseif ($method === 'DELETE') {
    // Soft delete participant
    $participantId = end($pathParts);
    
    $stmt = $pdo->prepare('UPDATE participants SET actif = 0 WHERE id = ?');
    $stmt->execute([$participantId]);
    
    echo json_encode(['success' => true]);
}
?>