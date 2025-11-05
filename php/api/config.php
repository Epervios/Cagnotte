<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

if ($method === 'GET') {
    // Get all config
    $stmt = $pdo->query('SELECT config_key as `key`, config_value as value FROM config');
    echo json_encode($stmt->fetchAll());
    
} elseif ($method === 'PUT') {
    // Update config (admin only)
    $user = getCurrentUser($pdo);
    requireAdmin($user);
    
    $key = end($pathParts);
    $value = file_get_contents('php://input');
    
    $stmt = $pdo->prepare('INSERT INTO config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?');
    $stmt->execute([$key, $value, $value]);
    
    echo json_encode(['success' => true]);
}
?>