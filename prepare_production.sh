#!/bin/bash

echo "=========================================="
echo "🚀 Préparation du package de production"
echo "=========================================="
echo ""

# 1. Build du frontend
echo "📦 1. Build du frontend React..."
cd /app/frontend
GENERATE_SOURCEMAP=false yarn build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "✅ Build terminé"
echo ""

# 2. Copie des assets
echo "📁 2. Copie des assets vers /app/php/public/..."
mkdir -p /app/php/public/static
cp /app/frontend/build/index.html /app/php/public/
cp -r /app/frontend/build/static/* /app/php/public/static/

echo "✅ Assets copiés"
echo ""

# 3. Création de l'archive
echo "📦 3. Création de l'archive de déploiement..."
cd /app
tar -czf cagnotte_sic_production.tar.gz php/ DEPLOIEMENT_PLESK.md

if [ $? -eq 0 ]; then
    echo "✅ Archive créée : /app/cagnotte_sic_production.tar.gz"
    echo ""
    echo "📊 Taille de l'archive :"
    du -h /app/cagnotte_sic_production.tar.gz
else
    echo "❌ Erreur lors de la création de l'archive"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Package de production prêt !"
echo "=========================================="
echo ""
echo "📦 Fichier à télécharger : /app/cagnotte_sic_production.tar.gz"
echo ""
echo "📚 Guide de déploiement : /app/DEPLOIEMENT_PLESK.md"
echo ""
echo "🔧 Prochaines étapes :"
echo "  1. Téléchargez cagnotte_sic_production.tar.gz"
echo "  2. Suivez le guide DEPLOIEMENT_PLESK.md"
echo "  3. Uploadez sur wizardaring.ch via FTP/SFTP"
echo "  4. Configurez config/database.php et config/config.php"
echo "  5. Visitez https://wizardaring.ch/setup.php"
echo ""
echo "🎉 Bonne mise en production !"
