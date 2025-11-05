<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$user = getCurrentUser($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

if ($method === 'GET' && strpos($requestUri, 'export/csv/') !== false) {
    $participantId = end($pathParts);
    
    // Check access
    $admins = array_map('trim', explode(',', ADMIN_EMAILS));
    $isAdmin = in_array($user['email'], $admins);
    
    if (!$isAdmin && $user['id'] !== $participantId) {
        http_response_code(403);
        echo json_encode(['detail' => 'Accès refusé']);
        exit;
    }
    
    $stmt = $pdo->prepare('SELECT * FROM paiements WHERE participant_id = ? ORDER BY mois');
    $stmt->execute([$participantId]);
    $paiements = $stmt->fetchAll();
    
    $csv = "Mois,Montant,Méthode,Statut,Date,Raison\n";
    
    foreach ($paiements as $p) {
        $raison = str_replace(',', ';', $p['raison'] ?? '');
        $csv .= "{$p['mois']},{$p['montant']},{$p['methode']},{$p['statut']},{$p['date']},{$raison}\n";
    }
    
    echo json_encode(['csv' => $csv]);
}
?>