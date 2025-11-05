<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$user = getCurrentUser($pdo);
requireAdmin($user);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['participants']) || !isset($input['montant_total']) || !isset($input['raison'])) {
        http_response_code(400);
        echo json_encode(['detail' => 'Participants, montant_total et raison requis']);
        exit;
    }
    
    if (count($input['participants']) == 0) {
        http_response_code(400);
        echo json_encode(['detail' => 'Sélectionnez au moins un participant']);
        exit;
    }
    
    if (empty(trim($input['raison']))) {
        http_response_code(400);
        echo json_encode(['detail' => 'La raison est obligatoire']);
        exit;
    }
    
    $nbParticipants = count($input['participants']);
    $montantTotal = (float)$input['montant_total'];
    $moisActuel = date('Y-m');
    
    $pdo->beginTransaction();
    
    try {
        $createdCount = 0;
        
        if ($input['repartition'] === 'egale') {
            $montantParPersonne = arrondir005($montantTotal / $nbParticipants);
            
            foreach ($input['participants'] as $participantId) {
                $id = bin2hex(random_bytes(16));
                
                $stmt = $pdo->prepare('
                    INSERT INTO paiements (id, participant_id, mois, montant, methode, raison, statut, date)
                    VALUES (?, ?, ?, ?, "DEPENSE", ?, "en_attente", NOW())
                ');
                
                $stmt->execute([
                    $id,
                    $participantId,
                    $moisActuel,
                    $montantParPersonne,
                    $input['raison']
                ]);
                
                $createdCount++;
            }
        } else {
            // Répartition pondérée
            $poids = $input['poids'] ?? [];
            $totalPoids = 0;
            
            foreach ($input['participants'] as $pid) {
                $totalPoids += $poids[$pid] ?? 1;
            }
            
            foreach ($input['participants'] as $participantId) {
                $poidsParticipant = $poids[$participantId] ?? 1;
                $part = ($poidsParticipant / $totalPoids) * $montantTotal;
                $montantArrondi = arrondir005($part);
                
                $id = bin2hex(random_bytes(16));
                
                $stmt = $pdo->prepare('
                    INSERT INTO paiements (id, participant_id, mois, montant, methode, raison, statut, date)
                    VALUES (?, ?, ?, ?, "DEPENSE", ?, "en_attente", NOW())
                ');
                
                $stmt->execute([
                    $id,
                    $participantId,
                    $moisActuel,
                    $montantArrondi,
                    $input['raison']
                ]);
                
                $createdCount++;
            }
        }
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'paiements_created' => $createdCount]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['detail' => 'Erreur lors de la création de la dépense']);
    }
}
?>