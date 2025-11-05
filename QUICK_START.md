# 🚀 Quick Start Guide - Cagnotte Cadre SIC

Guide rapide pour démarrer avec l'application en 5 minutes !

## 🎯 Objectif

Déployer rapidement l'application de gestion de contributions sur votre hébergement Plesk.

---

## ⚡ Déploiement Express (Recommandé)

### Étape 1 : Générer l'Archive de Déploiement

```bash
# Clone le repository
git clone https://github.com/Epervios/Cagnotte.git
cd Cagnotte

# Exécuter le script de packaging
bash scripts/package-php-deployment.sh
```

✅ Une archive ZIP sera créée dans `/app/deployment/`

### Étape 2 : Préparer Plesk

1. **Créer une Base de Données**
   - Allez dans Plesk → Bases de données
   - Créez une nouvelle base MySQL
   - Notez : `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

### Étape 3 : Upload des Fichiers

1. Téléchargez l'archive générée (`cagnotte-plesk-*.zip`)
2. Extrayez sur votre ordinateur
3. Dans Plesk, allez dans "Fichiers"
4. Uploadez **TOUT** le contenu dans `httpdocs/` ou `public_html/`

### Étape 4 : Configuration

#### A. Base de Données (`config/database.php`)

```php
<?php
define('DB_HOST', 'localhost');           // Hôte MySQL
define('DB_NAME', 'votre_base_donnees'); // Nom de votre BD
define('DB_USER', 'votre_utilisateur');  // Utilisateur MySQL
define('DB_PASS', 'votre_mot_de_passe'); // Mot de passe MySQL
?>
```

#### B. Sécurité (`config/config.php`)

```php
<?php
define('JWT_SECRET', 'CHANGEZ_CETTE_CLE_SECRETE_LONGUE_ET_ALEATOIRE');
define('ADMIN_EMAILS', 'eric.savary@lausanne.ch'); // Emails admin séparés par virgules
?>
```

### Étape 5 : Importer le Schéma

1. Dans Plesk → Bases de données → phpMyAdmin
2. Sélectionnez votre base de données
3. Cliquez sur "Importer"
4. Uploadez `database/schema.sql`
5. Cliquez sur "Exécuter"

### Étape 6 : Créer l'Administrateur

1. Dans votre navigateur : `https://votre-domaine.ch/setup.php`
2. L'admin est créé avec :
   - **Email** : `eric.savary@lausanne.ch`
   - **Mot de passe** : `admin123`
3. **⚠️ IMPORTANT** : Supprimez `setup.php` après !

### Étape 7 : Première Connexion

1. Allez sur `https://votre-domaine.ch`
2. Connectez-vous avec les identifiants ci-dessus
3. **Changez immédiatement le mot de passe** via le bouton "Changer mot de passe"

---

## ✅ Vérification

### Checklist de Déploiement Réussi

- [ ] L'application se charge (page de login visible)
- [ ] Connexion réussie avec les identifiants admin
- [ ] La page admin affiche les sections vides (normal au début)
- [ ] Création d'un participant fonctionne
- [ ] Déclaration d'un paiement fonctionne
- [ ] Export CSV fonctionne

### En Cas de Problème

#### Page Blanche
- Vérifiez les logs PHP dans Plesk → Logs
- Assurez-vous que tous les fichiers sont uploadés
- Vérifiez que `.htaccess` est présent

#### Erreur Base de Données
- Vérifiez `config/database.php`
- Testez la connexion MySQL dans phpMyAdmin
- Assurez-vous que `schema.sql` a été importé

#### Erreur 404 sur les API
- Vérifiez que `.htaccess` est bien à la racine
- Activez "mod_rewrite" dans Plesk (souvent activé par défaut)

#### Problème de Login
- Vérifiez que `JWT_SECRET` est défini dans `config/config.php`
- Vérifiez que l'admin a été créé via `setup.php`
- Essayez de recréer l'admin en relançant `setup.php`

---

## 🎓 Premiers Pas

### 1. Ajouter des Participants

1. Page Admin → "Ajouter Participant"
2. Remplir : Nom, Email, (Mot de passe optionnel)
3. Si pas de mot de passe, il sera auto-généré et affiché

### 2. Configurer les Paramètres

1. Page Admin → "Configuration"
2. Modifier :
   - **Titre** : Nom de votre cagnotte
   - **Montant Mensuel** : Cotisation par défaut (ex: 50)
   - **Devise** : CHF, EUR, etc.

### 3. Déclarer un Premier Paiement

**En tant que participant** :
1. Se connecter avec l'email du participant
2. "Déclarer un Paiement"
3. Sélectionner mois et méthode (TWINT, Virement...)
4. Le paiement apparaît en "En attente"

**En tant qu'admin** :
1. Page Admin → Section "Tous les Paiements"
2. Cliquer sur l'icône d'édition
3. Changer le statut en "Confirmé"

### 4. Créer une Dépense Groupée

1. Page Admin → "Créer Dépense"
2. Sélectionner les participants concernés
3. Entrer le montant total et la raison
4. Choisir :
   - **Parts égales** : Montant divisé également
   - **Pondérée** : Définir un poids par participant
5. Valider → Crée automatiquement des paiements "En attente"

---

## 📧 Configuration Email (Optionnel)

Pour activer les rappels automatiques :

1. Éditez `config/config.php`
2. Ajoutez :

```php
define('SMTP_HOST', 'smtp.example.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@example.com');
define('SMTP_PASSWORD', 'your-password');
```

3. Testez via Admin → "Envoyer rappels email"

---

## 🎨 Personnalisation Rapide

### Changer le Titre
Page Admin → "Configuration" → Modifier "Titre"

### Changer le Montant par Défaut
Page Admin → "Configuration" → Modifier "Montant Mensuel"

### Activer le Mode Sombre
Cliquez sur l'icône 🌙 en haut à droite

---

## 📊 Utilisation Quotidienne

### Workflow Type

**Chaque mois** :
1. Les participants déclarent leurs paiements
2. L'admin confirme les paiements reçus
3. L'admin crée les dépenses s'il y en a
4. Export PDF/CSV pour la comptabilité

**Rappels** :
- Bouton "Envoyer rappels email" pour relancer les retardataires
- Timeline visuelle pour chaque participant

---

## 🔧 Maintenance

### Backup Recommandé

**Base de données** :
- Via Plesk → Bases de données → Export
- Fréquence : Hebdomadaire

**Fichiers** :
- Via Plesk → Fichiers → Télécharger
- Sauvegarder : `config/`, `database/`

### Mises à Jour

1. Téléchargez la nouvelle version depuis GitHub
2. Exécutez le script de packaging
3. Remplacez les fichiers (sauf `config/`)
4. Testez sur un environnement de staging d'abord !

---

## 📞 Support

**Documentation complète** :
- [INSTALLATION.md](INSTALLATION.md) - Installation développement
- [DEPLOIEMENT_PLESK.md](DEPLOIEMENT_PLESK.md) - Déploiement détaillé

**Contact** :
- 📧 Email : eric.savary@lausanne.ch
- 🌐 Site : [wizardaring.ch](https://wizardaring.ch)

---

## ⏱️ Temps de Déploiement Estimé

- ✅ **Préparation Plesk** : 5 min
- ✅ **Upload & Configuration** : 10 min
- ✅ **Import BD & Test** : 5 min
- ✅ **Premier paramétrage** : 5 min

**Total** : ~25 minutes pour un déploiement complet !

---

🎉 **Félicitations !** Votre application de gestion de contributions est prête !

Pour aller plus loin, consultez la documentation complète dans [README.md](README.md).
