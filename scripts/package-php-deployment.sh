#!/bin/bash

# Script de packaging pour le déploiement PHP/MySQL sur Plesk
# Ce script crée une archive ZIP prête à être déployée

set -e

echo "🚀 Packaging de l'application pour le déploiement Plesk..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
PROJECT_ROOT="/app"
PHP_DIR="$PROJECT_ROOT/php"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BUILD_DIR="$FRONTEND_DIR/build"
OUTPUT_DIR="$PROJECT_ROOT/deployment"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="cagnotte-plesk-$TIMESTAMP.zip"

# Étape 1: Vérifier que le dossier PHP existe
if [ ! -d "$PHP_DIR" ]; then
    echo -e "${RED}❌ Erreur: Le dossier $PHP_DIR n'existe pas${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dossier PHP trouvé${NC}"

# Étape 2: Build du frontend React
echo -e "${YELLOW}📦 Construction du frontend React...${NC}"
cd "$FRONTEND_DIR"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    yarn install
fi

# Build avec Craco
echo "Build en cours..."
yarn craco build

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Erreur: Le build a échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend buildé avec succès${NC}"

# Étape 3: Copier les assets dans le dossier PHP
echo -e "${YELLOW}📋 Copie des assets dans /php/public/...${NC}"

# Créer le dossier public s'il n'existe pas
mkdir -p "$PHP_DIR/public"

# Supprimer l'ancien contenu
rm -rf "$PHP_DIR/public"/*

# Copier tous les fichiers buildés
cp -r "$BUILD_DIR"/* "$PHP_DIR/public/"

echo -e "${GREEN}✅ Assets copiés${NC}"

# Étape 4: Modifier index.html pour pointer vers config.js
echo -e "${YELLOW}🔧 Configuration du frontend pour production...${NC}"

# Vérifier que index.html existe
if [ -f "$PHP_DIR/public/index.html" ]; then
    # Ajouter le script config.js avant les autres scripts
    sed -i 's|<script|<script src="/config.js"></script><script|' "$PHP_DIR/public/index.html"
    echo -e "${GREEN}✅ index.html configuré${NC}"
else
    echo -e "${RED}❌ Erreur: index.html introuvable${NC}"
    exit 1
fi

# Étape 5: Créer le fichier config.js pour la production
cat > "$PHP_DIR/public/config.js" << 'EOF'
// Configuration pour la production PHP
// Utilise le domaine actuel pour les appels API
window.REACT_APP_BACKEND_URL = window.location.origin;
EOF

echo -e "${GREEN}✅ config.js créé${NC}"

# Étape 6: Créer le dossier de déploiement
echo -e "${YELLOW}📦 Création de l'archive de déploiement...${NC}"

mkdir -p "$OUTPUT_DIR"

# Aller dans le dossier PHP pour créer l'archive
cd "$PHP_DIR"

# Créer l'archive ZIP
zip -r "$OUTPUT_DIR/$ARCHIVE_NAME" \
    api/ \
    config/ \
    database/ \
    public/ \
    .htaccess \
    setup.php \
    README.md \
    -x "*.git*" "*.DS_Store" "node_modules/*"

echo -e "${GREEN}✅ Archive créée: $OUTPUT_DIR/$ARCHIVE_NAME${NC}"

# Étape 7: Créer un fichier d'instructions
cat > "$OUTPUT_DIR/INSTRUCTIONS_DEPLOIEMENT.txt" << EOF
╔════════════════════════════════════════════════════════════════╗
║     INSTRUCTIONS DE DÉPLOIEMENT SUR PLESK                      ║
╚════════════════════════════════════════════════════════════════╝

📦 Archive: $ARCHIVE_NAME
📅 Date: $(date)

═══════════════════════════════════════════════════════════════

ÉTAPES D'INSTALLATION:

1. PRÉPARATION
   - Créez une base de données MySQL dans Plesk
   - Notez: nom de la BD, utilisateur, mot de passe, hôte

2. TÉLÉCHARGEMENT
   - Téléchargez l'archive $ARCHIVE_NAME sur votre ordinateur
   - Extrayez le contenu de l'archive

3. UPLOAD VIA PLESK
   - Connectez-vous à Plesk
   - Allez dans "Fichiers" pour votre domaine
   - Uploadez TOUT le contenu extrait dans httpdocs/ ou public_html/

4. CONFIGURATION BASE DE DONNÉES
   - Éditez config/database.php avec vos identifiants MySQL:
     * DB_HOST (souvent localhost)
     * DB_NAME (nom de votre base de données)
     * DB_USER (utilisateur MySQL)
     * DB_PASS (mot de passe MySQL)

5. CONFIGURATION SÉCURITÉ
   - Éditez config/config.php:
     * JWT_SECRET: générez une chaîne aléatoire longue
     * ADMIN_EMAILS: votre email séparé par des virgules

6. IMPORT DU SCHÉMA
   - Dans Plesk, allez dans "Bases de données" > "phpMyAdmin"
   - Sélectionnez votre base de données
   - Cliquez sur "Importer"
   - Importez le fichier database/schema.sql

7. CRÉATION DE L'ADMINISTRATEUR
   - Dans votre navigateur, allez sur: https://votre-domaine.ch/setup.php
   - Cela créera l'admin avec:
     Email: eric.savary@lausanne.ch
     Password: admin123
   - ⚠️ SUPPRIMEZ setup.php après !

8. CONNEXION
   - Allez sur https://votre-domaine.ch
   - Connectez-vous avec les identifiants ci-dessus
   - CHANGEZ le mot de passe immédiatement !

═══════════════════════════════════════════════════════════════

VÉRIFICATIONS:

✓ Le fichier .htaccess est bien présent à la racine
✓ HTTPS est activé dans Plesk
✓ PHP 8.0 ou supérieur est configuré
✓ Les extensions PHP suivantes sont activées:
  - mysqli
  - pdo_mysql
  - json
  - mbstring

═══════════════════════════════════════════════════════════════

STRUCTURE ATTENDUE DANS httpdocs/:

httpdocs/
├── public/
│   ├── index.html
│   ├── config.js
│   └── static/
├── api/
├── config/
├── database/
├── .htaccess
├── setup.php
└── README.md

═══════════════════════════════════════════════════════════════

EN CAS DE PROBLÈME:

1. Vérifiez les logs d'erreur PHP dans Plesk
2. Assurez-vous que tous les fichiers ont été uploadés
3. Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)
4. Testez les API directement: https://votre-domaine.ch/api/config.php

═══════════════════════════════════════════════════════════════

SUPPORT:
Pour toute aide, référez-vous au fichier README.md inclus dans l'archive.

EOF

echo -e "${GREEN}✅ Instructions créées${NC}"

# Étape 8: Résumé
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   PACKAGING TERMINÉ !                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📦 Archive prête: ${YELLOW}$OUTPUT_DIR/$ARCHIVE_NAME${NC}"
echo -e "📄 Instructions: ${YELLOW}$OUTPUT_DIR/INSTRUCTIONS_DEPLOIEMENT.txt${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Téléchargez l'archive depuis: $OUTPUT_DIR/$ARCHIVE_NAME"
echo "2. Suivez les instructions dans INSTRUCTIONS_DEPLOIEMENT.txt"
echo "3. Déployez sur votre hébergement Plesk"
echo ""

# Afficher la taille de l'archive
ARCHIVE_SIZE=$(du -h "$OUTPUT_DIR/$ARCHIVE_NAME" | cut -f1)
echo -e "Taille de l'archive: ${GREEN}$ARCHIVE_SIZE${NC}"
echo ""
