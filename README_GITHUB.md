# 🏦 Cagnotte Cadre SIC - Application de Gestion de Contributions

Application web complète pour gérer les cotisations mensuelles d'un groupe de 6 personnes, avec gestion des participants, paiements, dépenses et statistiques.

## 📊 Fonctionnalités

### Pour les Participants
- ✅ Déclaration de paiements mensuels (TWINT, Virement, Autre)
- 📅 Historique personnel des contributions
- 📈 Visualisation de la progression annuelle
- 🔔 Timeline mensuelle avec statuts (Confirmé, En attente, En retard)
- 📥 Export CSV de l'historique personnel

### Pour les Administrateurs
- 👥 Gestion complète des participants (CRUD)
- ✓ Confirmation et modification des paiements
- 💰 Création de dépenses groupées (répartition égale ou pondérée)
- 📊 KPI détaillés par participant
- 📧 Envoi de rappels par email
- 📄 Export PDF et CSV des rapports
- 📈 Graphiques de progression mensuelle

## 🛠️ Technologies Utilisées

### Développement (FastAPI + React + MongoDB)
- **Backend** : FastAPI (Python)
- **Frontend** : React.js avec Tailwind CSS et Shadcn UI
- **Base de données** : MongoDB
- **Authentification** : JWT avec bcrypt

### Production (PHP + React + MySQL)
- **Backend** : PHP 8.0+
- **Frontend** : React.js (build statique)
- **Base de données** : MySQL/MariaDB
- **Déploiement** : Plesk (hébergement mutualisé)

## 📦 Installation

### Option 1 : Développement (FastAPI + React + MongoDB)

Voir le fichier [INSTALLATION.md](INSTALLATION.md) pour les instructions détaillées.

```bash
# Backend
cd backend
pip install -r requirements.txt
python server.py

# Frontend
cd frontend
yarn install
yarn start
```

### Option 2 : Production sur Plesk (PHP + MySQL)

#### Méthode Automatisée (Recommandée)

Utilisez le script de packaging pour créer une archive prête à déployer :

```bash
cd /app
bash scripts/package-php-deployment.sh
```

Ce script génère :
- ✅ Une archive ZIP avec tous les fichiers nécessaires
- ✅ Le frontend React compilé en mode production
- ✅ Un fichier d'instructions détaillées
- ✅ La configuration pour Plesk

L'archive sera dans `/app/deployment/cagnotte-plesk-YYYYMMDD_HHMMSS.zip`

#### Déploiement sur Plesk

Voir le fichier [DEPLOIEMENT_PLESK.md](DEPLOIEMENT_PLESK.md) pour les instructions complètes.

**Résumé rapide** :
1. Créez une base de données MySQL dans Plesk
2. Extrayez et uploadez le contenu de l'archive
3. Configurez `config/database.php` avec vos identifiants MySQL
4. Importez `database/schema.sql` via phpMyAdmin
5. Exécutez `setup.php` pour créer l'administrateur
6. Supprimez `setup.php` après utilisation

## 🏗️ Architecture du Projet

```
/app/
├── backend/                  # Backend FastAPI (développement)
│   ├── server.py             # Routes API
│   ├── email_service.py      # Service d'envoi d'emails
│   └── requirements.txt
│
├── frontend/                 # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── ParticipantPage.js
│   │   │   └── AdminPage.js
│   │   ├── components/
│   │   └── contexts/
│   ├── package.json
│   └── tailwind.config.js
│
├── php/                      # Backend PHP + Frontend (production)
│   ├── api/                  # API endpoints PHP
│   ├── config/               # Configuration
│   ├── database/             # Schéma SQL
│   ├── public/               # Frontend compilé
│   ├── .htaccess
│   └── setup.php
│
├── scripts/
│   └── package-php-deployment.sh  # Script de packaging
│
├── INSTALLATION.md           # Guide d'installation développement
├── DEPLOIEMENT_PLESK.md     # Guide de déploiement production
└── README.md
```

## 🔐 Sécurité

- 🔒 **Authentification** : JWT avec tokens sécurisés
- 🔑 **Mots de passe** : Hashage avec bcrypt
- 🛡️ **HTTPS** : Obligatoire en production
- 🚫 **SQL Injection** : Requêtes préparées avec PDO
- ✅ **Validation** : Validation côté serveur de toutes les entrées

## 📧 Configuration Email (Optionnel)

Pour activer les rappels par email, configurez les variables dans `backend/.env` :

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
ADMIN_EMAILS=admin@example.com
```

## 🌐 Déploiement

### URL de Production
[wizardaring.ch](https://wizardaring.ch)

### Environnements
- **Développement** : FastAPI (localhost:8001) + React (localhost:3000)
- **Production** : PHP + MySQL sur Plesk

## 🧪 Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
yarn test
```

## 📝 Utilisation

### Créer un Participant
1. Connectez-vous en tant qu'administrateur
2. Cliquez sur "Ajouter Participant"
3. Remplissez le formulaire (nom, email, mot de passe optionnel)
4. Le participant reçoit ses identifiants

### Déclarer un Paiement
1. Connectez-vous en tant que participant
2. Cliquez sur "Déclarer un Paiement"
3. Sélectionnez le mois et la méthode
4. Le montant par défaut est pré-rempli

### Créer une Dépense Groupée
1. Connectez-vous en tant qu'administrateur
2. Cliquez sur "Créer Dépense"
3. Sélectionnez les participants concernés
4. Choisissez la répartition (égale ou pondérée)
5. La dépense crée automatiquement des paiements "En attente"

## 🎨 Personnalisation

### Montant Mensuel par Défaut
Modifiable via l'interface admin dans "Configuration"

### Couleurs et Thème
Le projet utilise Tailwind CSS. Modifiez `tailwind.config.js` pour personnaliser.

### Mode Sombre
Bouton de basculement disponible dans toutes les pages.

## 📄 Licence

Projet privé - Tous droits réservés

## 👨‍💻 Support

Pour toute question ou problème :
- 📧 Email : eric.savary@lausanne.ch
- 🌐 Site : [wizardaring.ch](https://wizardaring.ch)

## 🔄 Mises à Jour

### Version 2.0 (Nov 2025)
- ✅ Support dual : FastAPI + PHP
- ✅ Mode sombre
- ✅ Export PDF
- ✅ Graphiques mensuels
- ✅ Timeline des paiements
- ✅ Dépenses pondérées
- ✅ Script de packaging automatisé

### Prochaines Fonctionnalités
- 🔔 Notifications in-app
- 📊 Analytics avancés
- 💬 Commentaires sur les paiements
- 📜 Historique d'audit
- 📱 Progressive Web App (PWA)

---

Développé avec ❤️ pour la gestion collaborative de contributions
