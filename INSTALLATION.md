# Installation - Cagnotte Cadre SIC

## Vue d'ensemble

Cette application existe en **deux versions** :

1. **Version Preview** (FastAPI + React + MongoDB) - Pour le développement et les tests
2. **Version Production** (PHP + MySQL) - Pour le déploiement sur hébergement mutualisé Plesk

---

## VERSION PREVIEW (Development)

### Accès
- **URL**: https://expenseshare-13.preview.emergentagent.com
- **Email administrateur**: eric.savary@lausanne.ch
- **Mot de passe**: admin123

### Architecture
- **Backend**: FastAPI (Python) sur port 8001
- **Frontend**: React sur port 3000
- **Base de données**: MongoDB locale

### Fonctionnalités testées
✅ Connexion et authentification JWT
✅ Vue Participant avec KPI et déclaration de versements
✅ Vue Admin avec gestion complète
✅ Anti-doublon pour les déclarations
✅ Filtres et recherche
✅ Exports CSV
✅ Création de dépenses réparties
✅ Confirmation groupée des paiements
✅ Bascule Admin ⇄ Participant

---

## VERSION PRODUCTION (Plesk/PHP+MySQL)

### Emplacement des fichiers
Tous les fichiers de production se trouvent dans le dossier `/app/php/`

### Étape 1 : Préparation de la base de données MySQL

1. **Créer une base de données via Plesk**
   - Nom suggéré : `cagnotte_sic`
   - Créez un utilisateur dédié avec tous les privilèges sur cette base

2. **Importer le schéma SQL**
   ```bash
   mysql -u votre_utilisateur -p cagnotte_sic < /app/php/database/schema.sql
   ```

   Ou via phpMyAdmin :
   - Sélectionnez votre base de données
   - Onglet "Importer"
   - Sélectionnez le fichier `database/schema.sql`
   - Cliquez sur "Exécuter"

### Étape 2 : Configuration de l'application

1. **Éditer `/app/php/config/database.php`**
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'cagnotte_sic');
   define('DB_USER', 'votre_utilisateur_mysql');
   define('DB_PASS', 'votre_mot_de_passe_mysql');
   ```

2. **Éditer `/app/php/config/config.php`**
   ```php
   // Générez une clé secrète aléatoire longue (min 32 caractères)
   define('JWT_SECRET', 'VOTRE_CLE_SECRETE_ALEATOIRE_TRES_LONGUE');
   
   // Liste des emails administrateurs (séparés par des virgules)
   define('ADMIN_EMAILS', 'eric.savary@lausanne.ch,autre@email.ch');
   ```

### Étape 3 : Upload des fichiers

1. **Via FTP/SFTP**, uploadez le contenu du dossier `/app/php/` vers la racine de votre domaine :
   ```
   votre-domaine.ch/
   ├── api/
   ├── config/
   ├── database/
   ├── .htaccess
   ├── setup.php
   └── README.md
   ```

2. **Vérifiez les permissions**
   - Fichiers : 644
   - Dossiers : 755

### Étape 4 : Installation de l'administrateur

1. **Visitez** : https://votre-domaine.ch/setup.php

2. Le script va créer l'administrateur avec :
   - Email : eric.savary@lausanne.ch
   - Mot de passe : admin123

3. **⚠️ IMPORTANT** : Supprimez immédiatement le fichier `setup.php` après l'installation

### Étape 5 : Build et déploiement du frontend React

1. **Modifier la configuration du frontend** pour pointer vers votre domaine :
   
   Dans `/app/frontend/.env` :
   ```
   REACT_APP_BACKEND_URL=https://votre-domaine.ch
   ```

2. **Builder le frontend** :
   ```bash
   cd /app/frontend
   yarn build
   ```

3. **Uploader les fichiers du build** :
   - Copiez tout le contenu de `/app/frontend/build/` vers la racine de votre domaine
   - Les fichiers statiques (JS, CSS) iront dans un dossier `static/`
   - Le fichier `index.html` sera à la racine

### Étape 6 : Vérifications finales

✅ HTTPS activé (le .htaccess force la redirection)
✅ Fichier setup.php supprimé
✅ Connexion à l'application fonctionne
✅ Les routes API répondent correctement

---

## Structure des URLs

### Preview (Development)
- Frontend : `https://expenseshare-13.preview.emergentagent.com/`
- API : `https://expenseshare-13.preview.emergentagent.com/api/`

### Production (Plesk)
- Frontend : `https://votre-domaine.ch/`
- API : `https://votre-domaine.ch/api/`

---

## Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur connecté

### Configuration
- `GET /api/config` - Récupérer la configuration
- `PUT /api/config/{key}` - Mettre à jour une valeur (admin)

### Participants
- `GET /api/participants` - Liste des participants (admin)
- `POST /api/participants` - Ajouter un participant (admin)
- `PUT /api/participants/{id}` - Modifier un participant (admin)
- `DELETE /api/participants/{id}` - Désactiver un participant (admin)

### Paiements
- `GET /api/paiements` - Mes paiements
- `GET /api/paiements/all` - Tous les paiements (admin)
- `POST /api/paiements` - Déclarer un paiement
- `PUT /api/paiements/{id}` - Modifier un paiement (admin)
- `DELETE /api/paiements/{id}` - Supprimer un paiement (admin)
- `POST /api/paiements/confirm-month?mois=2025-11` - Confirmer tous les paiements d'un mois (admin)

### Dépenses
- `POST /api/depenses` - Créer une dépense répartie (admin)

### KPI
- `GET /api/kpi/participant` - KPI du participant connecté
- `GET /api/kpi/admin` - KPI de tous les participants (admin)

### Export
- `GET /api/export/csv/{participant_id}` - Export CSV

---

## Maintenance

### Sauvegardes recommandées

**Base de données** (via cron hebdomadaire) :
```bash
mysqldump -u utilisateur -p cagnotte_sic > backup_$(date +%Y%m%d).sql
```

### Mise à jour du montant mensuel

Via l'interface admin : Bouton "Configuration"

Ou directement en base :
```sql
UPDATE config SET config_value = '60' WHERE config_key = 'montant_mensuel';
```

### Ajout d'un administrateur

Éditez `/app/php/config/config.php` :
```php
define('ADMIN_EMAILS', 'eric.savary@lausanne.ch,nouvel.admin@email.ch');
```

---

## Sécurité

✅ Mots de passe hashés avec bcrypt
✅ Tokens JWT pour l'authentification
✅ Protection CSRF via vérification du token
✅ HTTPS forcé
✅ Validation des entrées côté serveur
✅ Protection des fichiers sensibles via .htaccess
✅ Soft-delete pour l'historique
✅ Sessions sécurisées

---

## Support et contact

Pour toute question ou problème :
1. Vérifiez les logs d'erreur PHP de Plesk
2. Vérifiez que la base de données est accessible
3. Assurez-vous que PHP 8.0+ est actif
4. Contactez votre hébergeur si nécessaire

---

## Checklist de déploiement

- [ ] Base de données MySQL créée et schéma importé
- [ ] Fichiers de configuration édités (database.php, config.php)
- [ ] Fichiers uploadés sur le serveur
- [ ] Permissions correctes (644/755)
- [ ] Setup.php exécuté et supprimé
- [ ] Frontend buildé avec la bonne URL d'API
- [ ] HTTPS activé et fonctionnel
- [ ] Connexion testée avec succès
- [ ] Mot de passe admin changé
- [ ] Backup planifié

**L'application est prête à être utilisée !** 🎉
