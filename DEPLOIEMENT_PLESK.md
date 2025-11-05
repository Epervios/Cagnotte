# 🚀 Guide de Déploiement sur Plesk (wizardaring.ch)

## 📦 Méthode Rapide : Script de Packaging Automatisé

**NOUVEAU** : Utilisez le script automatisé pour créer une archive prête à déployer !

```bash
# Depuis le dossier /app
bash scripts/package-php-deployment.sh
```

Ce script va :
1. ✅ Builder le frontend React en mode production
2. ✅ Copier les assets dans `/app/php/public/`
3. ✅ Créer `config.js` avec la bonne configuration
4. ✅ Générer une archive ZIP prête pour Plesk
5. ✅ Créer un fichier d'instructions détaillées

L'archive sera créée dans : `/app/deployment/cagnotte-plesk-YYYYMMDD_HHMMSS.zip`

---

## 📋 Méthode Manuelle : Préparation

### 1. Fichiers à Uploader

Tous les fichiers se trouvent dans `/app/php/`

```
/app/php/
├── api/                    # API PHP
│   ├── auth.php
│   ├── participants.php
│   ├── paiements.php
│   ├── config.php
│   ├── kpi.php
│   ├── depenses.php
│   └── export.php
├── config/                 # Configuration
│   ├── database.php
│   └── config.php
├── database/               # Base de données
│   └── schema.sql
├── public/                 # Frontend (déjà buildé)
│   ├── index.html
│   ├── config.js          # Configuration production
│   └── static/
│       ├── js/
│       ├── css/
│       └── media/
├── .htaccess
├── setup.php              # ⚠️ À SUPPRIMER après usage
└── README.md
```

---

## 🔧 Étape 1 : Configuration MySQL

### A. Créer la base de données

1. Connectez-vous à **Plesk**
2. Allez dans **Bases de données** > **Ajouter une base de données**
3. Créez :
   - **Nom** : `cagnotte_sic` (ou autre)
   - **Utilisateur** : créez un utilisateur dédié
   - **Mot de passe** : générez un mot de passe sécurisé

### B. Importer le schéma

1. Ouvrez **phpMyAdmin** depuis Plesk
2. Sélectionnez votre base `cagnotte_sic`
3. Onglet **Importer**
4. Sélectionnez le fichier `/app/php/database/schema.sql`
5. Cliquez sur **Exécuter**

✅ Vérifiez que 3 tables sont créées :
- `participants`
- `paiements`
- `config`

---

## 📁 Étape 2 : Upload des Fichiers

### Structure sur le serveur

```
httpdocs/                   # Racine de votre domaine
├── index.html             # Copié depuis /app/php/public/
├── config.js              # Copié depuis /app/php/public/
├── static/                # Copié depuis /app/php/public/static/
│   ├── js/
│   ├── css/
│   └── media/
├── api/                   # Copié depuis /app/php/api/
├── config/                # Copié depuis /app/php/config/
├── .htaccess              # Copié depuis /app/php/.htaccess
└── setup.php              # Copié depuis /app/php/setup.php
```

### Via FTP/SFTP

1. Connectez-vous via FileZilla ou équivalent
2. Naviguez vers `httpdocs/`
3. Uploadez :
   - Tout le contenu de `/app/php/public/` → à la racine
   - Le dossier `/app/php/api/` → dans `httpdocs/api/`
   - Le dossier `/app/php/config/` → dans `httpdocs/config/`
   - Le fichier `/app/php/.htaccess` → à la racine
   - Le fichier `/app/php/setup.php` → à la racine

---

## ⚙️ Étape 3 : Configuration

### A. Configurer la base de données

Éditez `httpdocs/config/database.php` :

```php
define('DB_HOST', 'localhost');           // Généralement localhost
define('DB_NAME', 'cagnotte_sic');        // Votre nom de base
define('DB_USER', 'votre_utilisateur');   // Utilisateur MySQL créé
define('DB_PASS', 'votre_mot_de_passe');  // Mot de passe MySQL
```

### B. Configurer l'application

Éditez `httpdocs/config/config.php` :

```php
// Générez une clé secrète aléatoire longue (min 32 caractères)
define('JWT_SECRET', 'VOTRE_CLE_SECRETE_ALEATOIRE_TRES_LONGUE_ET_UNIQUE');

// Liste des emails administrateurs
define('ADMIN_EMAILS', 'eric.savary@lausanne.ch');
```

**Générer une clé secrète** :
```bash
# Sur votre machine locale
openssl rand -base64 32
```

### C. Configurer l'URL du backend

Éditez `httpdocs/config.js` :

```javascript
// Remplacez par votre domaine
window.REACT_APP_BACKEND_URL = 'https://wizardaring.ch';
```

---

## 🔐 Étape 4 : Créer l'Administrateur

1. **Visitez** : https://wizardaring.ch/setup.php

2. Vous devriez voir :
   ```
   Installation réussie !
   
   Administrateur créé :
   • Email : eric.savary@lausanne.ch
   • Mot de passe : admin123
   
   ⚠️ IMPORTANT : Supprimez ce fichier (setup.php) immédiatement !
   ```

3. **⚠️ SUPPRIMEZ `setup.php`** via FTP immédiatement

4. **Testez la connexion** : https://wizardaring.ch
   - Email : `eric.savary@lausanne.ch`
   - Mot de passe : `admin123`

5. **Changez le mot de passe** :
   - Cliquez sur l'icône "Clé" dans le header
   - Changez pour un mot de passe sécurisé

---

## ✅ Étape 5 : Vérifications

### A. Tester l'API

```bash
# Test de connexion
curl -X POST https://wizardaring.ch/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eric.savary@lausanne.ch","password":"admin123"}'
```

Réponse attendue : JSON avec `token`, `user`, `is_admin`

### B. Vérifier HTTPS

1. Visitez https://wizardaring.ch
2. Vérifiez le cadenas dans la barre d'adresse
3. Si HTTP uniquement, configurez SSL/TLS dans Plesk

### C. Tester les fonctionnalités

- ✅ Connexion
- ✅ Vue participant (timeline, KPI)
- ✅ Déclaration de paiement
- ✅ Vue admin
- ✅ Ajout de participant
- ✅ Export CSV
- ✅ Export PDF
- ✅ Mode sombre

---

## 🐛 Dépannage

### Problème : Page blanche

**Cause** : Erreur JavaScript ou mauvaise configuration

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs
3. Vérifiez que `config.js` contient la bonne URL
4. Vérifiez les chemins dans `.htaccess`

### Problème : Erreurs API "404 Not Found"

**Cause** : `.htaccess` non pris en compte

**Solution** :
1. Dans Plesk, activez les overrides `.htaccess`
2. Vérifiez que `mod_rewrite` est activé
3. Vérifiez les permissions du fichier `.htaccess` (644)

### Problème : "Database connection error"

**Cause** : Mauvaises credentials MySQL

**Solution** :
1. Vérifiez `config/database.php`
2. Testez la connexion MySQL depuis phpMyAdmin
3. Vérifiez les permissions de l'utilisateur MySQL

### Problème : Emails non envoyés

**Cause** : Configuration SMTP

**Solution** :
1. Vérifiez les credentials dans `/app/backend/email_service.py`
2. Testez l'envoi depuis la vue admin
3. Vérifiez les logs d'erreur PHP

---

## 📧 Configuration Emails (Rappels Automatiques)

### Option A : Bouton Manuel

Dans la vue admin, utilisez le bouton **"Envoyer rappels email"**

### Option B : Automatisation (Cron)

1. Dans Plesk, allez dans **Tâches planifiées (Cron)**

2. **Rappels mensuels** (le 25 à 9h) :
   ```bash
   0 9 25 * * curl -X POST https://wizardaring.ch/api/notifications/send-reminders \
     -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
   ```

3. **Résumé mensuel** (le 1er à 8h) :
   ```bash
   0 8 1 * * curl -X POST https://wizardaring.ch/api/notifications/send-admin-summary \
     -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
   ```

**Pour obtenir le token admin** :
1. Connectez-vous à l'application
2. Ouvrez la console du navigateur (F12)
3. Tapez : `localStorage.getItem('token')`
4. Copiez le token affiché

---

## 💾 Sauvegardes Automatiques

### Configuration dans Plesk

1. Allez dans **Outils et paramètres** > **Gestionnaire de sauvegardes**
2. Activez les sauvegardes automatiques
3. Fréquence recommandée : **Hebdomadaire**
4. Inclure : Base de données + Fichiers

### Sauvegarde manuelle MySQL

```bash
# Via SSH ou terminal Plesk
mysqldump -u utilisateur -p cagnotte_sic > backup_$(date +%Y%m%d).sql
```

---

## 🔒 Sécurité - Checklist Finale

- ✅ `setup.php` supprimé
- ✅ HTTPS activé et forcé
- ✅ JWT_SECRET changé (32+ caractères)
- ✅ Mot de passe admin changé
- ✅ Permissions fichiers : 644 (fichiers), 755 (dossiers)
- ✅ `config/database.php` non accessible depuis le web
- ✅ Sauvegardes configurées
- ✅ Emails testés

---

## 📊 Monitoring

### Logs d'erreur PHP

Dans Plesk : **Journaux** > **Journaux d'erreurs**

### Statistiques

Dans Plesk : **Statistiques** pour voir :
- Visiteurs
- Bande passante
- Requêtes

---

## 🎯 Prochaines Étapes

1. ✅ **Éditez le mois de début** de chaque participant
2. ✅ **Testez tous les workflows** :
   - Déclaration de paiement
   - Confirmation par admin
   - Création de dépense
   - Exports
3. ✅ **Configurez les rappels automatiques** (cron)
4. ✅ **Formez les utilisateurs**

---

## 📞 Support

En cas de problème :

1. Vérifiez les logs d'erreur PHP dans Plesk
2. Consultez ce guide de dépannage
3. Vérifiez la console JavaScript (F12)
4. Testez les endpoints API avec curl

**L'application est maintenant en production ! 🎉**

---

## 📝 Notes Importantes

- Le frontend est une **Single Page Application (SPA)** React
- Toutes les routes passent par `/api/*` pour le backend PHP
- Le `.htaccess` gère le routage
- Les assets sont dans `/static/`
- La configuration est dans `/config/`
- **Ne jamais** exposer `/config/` au public (protégé par .htaccess)

**Bonne utilisation de votre Cagnotte Cadre SIC ! 🚀**
