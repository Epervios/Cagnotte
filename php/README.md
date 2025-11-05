# Cagnotte Cadre SIC - Version Production PHP

## Installation sur Plesk

### 1. Prérequis
- Hébergement mutualisé avec PHP 8.0+
- Base de données MySQL/MariaDB
- Accès HTTPS

### 2. Configuration de la base de données

1. Créez une base de données MySQL via Plesk
2. Importez le fichier `database/schema.sql`
3. Notez les informations de connexion

### 3. Configuration de l'application

1. Copiez tous les fichiers dans le répertoire public de votre domaine
2. Éditez le fichier `config/database.php` avec vos informations de connexion
3. Éditez le fichier `config/config.php` pour définir :
   - `JWT_SECRET` : Votre clé secrète (générez une chaîne aléatoire)
   - `ADMIN_EMAILS` : Liste des emails administrateurs séparés par des virgules

### 4. Création du premier administrateur

Exécutez le script depuis votre navigateur une seule fois :
```
https://votre-domaine.ch/setup.php
```

Ce script créera l'administrateur avec :
- Email : eric.savary@lausanne.ch
- Mot de passe : admin123

**⚠️ Supprimez le fichier setup.php après utilisation !**

### 5. Sécurité

1. Vérifiez que le fichier `.htaccess` est bien présent
2. Assurez-vous que HTTPS est activé
3. Changez le mot de passe administrateur après la première connexion

### 6. Structure des fichiers

```
/
├── index.html           # Application React (frontend)
├── assets/               # Ressources statiques
├── api/                  # API PHP
│   ├── auth.php
│   ├── participants.php
│   ├── paiements.php
│   ├── config.php
│   ├── kpi.php
│   └── depenses.php
├── config/               # Configuration
│   ├── database.php
│   └── config.php
├── database/             # Schéma SQL
│   └── schema.sql
├── .htaccess             # Configuration Apache
└── setup.php             # Script d'installation (à supprimer après)
```

## Support

Pour toute question, contactez votre administrateur système.