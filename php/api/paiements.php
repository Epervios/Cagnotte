<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$user = getCurrentUser($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

if ($method === 'GET') {
    // Check if /all endpoint
    if (end($pathParts) === 'all') {
        requireAdmin($user);
        $stmt = $pdo->query('SELECT * FROM paiements ORDER BY mois DESC, date DESC');
        echo json_encode($stmt->fetchAll());
    } else {
        // Get user's paiements
        $stmt = $pdo->prepare('SELECT * FROM paiements WHERE participant_id = ? ORDER BY mois DESC');
        $stmt->execute([$user['id']]);
        echo json_encode($stmt->fetchAll());
    }
    
} elseif ($method === 'POST') {
    // Check if confirm-month endpoint
    if (strpos($requestUri, 'confirm-month') !== false) {
        requireAdmin($user);
        $mois = $_GET['mois'] ?? '';
        
        if (empty($mois)) {
            http_response_code(400);
            echo json_encode(['detail' => 'Mois requis']);
            exit;
        }
        
        $stmt = $pdo->prepare('UPDATE paiements SET statut = "confirme" WHERE mois = ? AND statut = "en_attente"');
        $stmt->execute([$mois]);
        
        echo json_encode(['success' => true, 'modified' => $stmt->rowCount()]);
    } else {
        // Create paiement
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['mois']) || !isset($input['montant']) || !isset($input['methode'])) {
            http_response_code(400);
            echo json_encode(['detail' => 'Mois, montant et méthode requis']);
            exit;
        }
        
        // Check for duplicate
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM paiements WHERE participant_id = ? AND mois = ?');
        $stmt->execute([$user['id'], $input['mois']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['detail' => 'Un versement existe déjà pour ce mois']);
            exit;
        }
        
        $id = bin2hex(random_bytes(16));
        
        $stmt = $pdo->prepare('
            INSERT INTO paiements (id, participant_id, mois, montant, methode, raison, statut, date)
            VALUES (?, ?, ?, ?, ?, ?, "en_attente", NOW())
        ');
        
        $stmt->execute([
            $id,
            $user['id'],
            $input['mois'],
            $input['montant'],
            $input['methode'],
            $input['raison'] ?? null
        ]);
        
        echo json_encode([
            'id' => $id,
            'participant_id' => $user['id'],
            'mois' => $input['mois'],
            'montant' => (float)$input['montant'],
            'methode' => $input['methode'],
            'raison' => $input['raison'] ?? null,
            'statut' => 'en_attente',
            'date' => date('Y-m-d H:i:s')
        ]);
    }
    
} elseif ($method === 'PUT') {
    // Update paiement (admin only)
    requireAdmin($user);
    $paiementId = end($pathParts);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];
    
    if (isset($input['montant'])) {
        $updates[] = 'montant = ?';
        $params[] = $input['montant'];
    }
    if (isset($input['methode'])) {
        $updates[] = 'methode = ?';
        $params[] = $input['methode'];
    }
    if (isset($input['statut'])) {
        $updates[] = 'statut = ?';
        $params[] = $input['statut'];
    }
    if (isset($input['raison'])) {
        $updates[] = 'raison = ?';
        $params[] = $input['raison'];
    }
    
    $params[] = $paiementId;
    
    $stmt = $pdo->prepare('UPDATE paiements SET ' . implode(', ', $updates) . ' WHERE id = ?');
    $stmt->execute($params);
    
    $stmt = $pdo->prepare('SELECT * FROM paiements WHERE id = ?');
    $stmt->execute([$paiementId]);
    echo json_encode($stmt->fetch());
    
} elseif ($method === 'DELETE') {
    // Delete paiement (admin only)
    requireAdmin($user);
    $paiementId = end($pathParts);
    
    $stmt = $pdo->prepare('DELETE FROM paiements WHERE id = ?');
    $stmt->execute([$paiementId]);
    
    echo json_encode(['success' => true]);
}
?>