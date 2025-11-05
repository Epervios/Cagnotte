<?php
require_once '../config/database.php';
require_once '../config/config.php';

$pdo = getDbConnection();
$user = getCurrentUser($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

if (strpos($requestUri, 'kpi/participant') !== false) {
    // KPI for current user
    $stmt = $pdo->prepare('SELECT config_value FROM config WHERE config_key = "montant_mensuel"');
    $stmt->execute();
    $montantMensuel = (float)$stmt->fetchColumn();
    
    $annee = date('Y');
    $moisActuel = date('Y-m');
    
    $stmt = $pdo->prepare('
        SELECT SUM(montant) as total
        FROM paiements
        WHERE participant_id = ? AND mois LIKE ? AND statut = "confirme"
    ');
    $stmt->execute([$user['id'], $annee . '%']);
    $totalConfirme = (float)($stmt->fetch()['total'] ?? 0);
    
    $stmt = $pdo->prepare('
        SELECT SUM(montant) as total
        FROM paiements
        WHERE participant_id = ? AND mois LIKE ? AND statut = "en_attente"
    ');
    $stmt->execute([$user['id'], $annee . '%']);
    $enAttente = (float)($stmt->fetch()['total'] ?? 0);
    
    $stmt = $pdo->prepare('
        SELECT SUM(montant) as total
        FROM paiements
        WHERE participant_id = ? AND mois = ? AND statut = "confirme"
    ');
    $stmt->execute([$user['id'], $moisActuel]);
    $totalMois = (float)($stmt->fetch()['total'] ?? 0);
    
    $resteMois = max(0, $montantMensuel - $totalMois);
    
    echo json_encode([
        'total_confirme_annee' => $totalConfirme,
        'en_attente_annee' => $enAttente,
        'reste_mois' => $resteMois
    ]);
    
} elseif (strpos($requestUri, 'kpi/admin') !== false) {
    // KPI for all participants (admin only)
    requireAdmin($user);
    
    $stmt = $pdo->prepare('SELECT config_value FROM config WHERE config_key = "montant_mensuel"');
    $stmt->execute();
    $montantMensuel = (float)$stmt->fetchColumn();
    
    $annee = date('Y');
    $moisActuelNum = (int)date('m');
    
    $stmt = $pdo->query('SELECT * FROM participants WHERE actif = 1');
    $participants = $stmt->fetchAll();
    
    $kpis = [];
    
    foreach ($participants as $participant) {
        $stmt = $pdo->prepare('
            SELECT SUM(montant) as total
            FROM paiements
            WHERE participant_id = ? AND mois LIKE ? AND statut = "confirme"
        ');
        $stmt->execute([$participant['id'], $annee . '%']);
        $confirmeAnnee = (float)($stmt->fetch()['total'] ?? 0);
        
        $stmt = $pdo->prepare('
            SELECT SUM(montant) as total
            FROM paiements
            WHERE participant_id = ? AND mois LIKE ? AND statut = "en_attente"
        ');
        $stmt->execute([$participant['id'], $annee . '%']);
        $enAttente = (float)($stmt->fetch()['total'] ?? 0);
        
        $attendu = $montantMensuel * $moisActuelNum;
        $manquant = max(0, $attendu - $confirmeAnnee);
        $progression = $attendu > 0 ? ($confirmeAnnee / $attendu * 100) : 0;
        
        // Check retard
        $enRetard = false;
        for ($m = 1; $m < $moisActuelNum; $m++) {
            $moisStr = sprintf('%d-%02d', $annee, $m);
            $stmt = $pdo->prepare('
                SELECT COUNT(*) FROM paiements
                WHERE participant_id = ? AND mois = ? AND statut = "confirme"
            ');
            $stmt->execute([$participant['id'], $moisStr]);
            if ($stmt->fetchColumn() == 0) {
                $enRetard = true;
                break;
            }
        }
        
        $kpis[] = [
            'participant_id' => $participant['id'],
            'nom' => $participant['nom'],
            'confirme_annee' => $confirmeAnnee,
            'en_attente' => $enAttente,
            'manquant' => $manquant,
            'progression' => $progression,
            'en_retard' => $enRetard
        ];
    }
    
    echo json_encode($kpis);
}
?>