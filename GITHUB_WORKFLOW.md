# 🔄 Workflow GitHub - Cagnotte Cadre SIC

Guide complet pour contribuer et déployer via GitHub.

---

## 📂 Structure du Repository

```
Cagnotte/
├── backend/              # Backend FastAPI (dev)
├── frontend/             # Frontend React (source)
├── php/                  # Backend PHP + Frontend (prod)
│   ├── api/
│   ├── config/
│   ├── database/
│   └── public/          # ⚠️ NON versionné (généré)
├── scripts/
│   └── package-php-deployment.sh
├── deployment/          # ⚠️ NON versionné (archives)
├── docs/                # Documentation
├── INSTALLATION.md
├── DEPLOIEMENT_PLESK.md
├── QUICK_START.md
└── README.md
```

---

## 🌿 Stratégie de Branches

### Branches Principales

- **`main`** : Code stable en production
- **`develop`** : Développement en cours
- **`feature/*`** : Nouvelles fonctionnalités
- **`hotfix/*`** : Corrections urgentes

### Workflow GitFlow

```
main (prod)
  ↑
  merge après tests
  ↑
develop (dev)
  ↑
  merge feature
  ↑
feature/nouvelle-fonctionnalite
```

---

## 🔧 Développement Local

### 1. Clone et Setup

```bash
# Clone
git clone https://github.com/Epervios/Cagnotte.git
cd Cagnotte

# Créer une branche de feature
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 2. Environnement de Dev

#### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

#### Frontend (React)
```bash
cd frontend
yarn install
yarn start
```

### 3. Développement

- Faites vos modifications
- Testez localement (FastAPI + React)
- Commitez régulièrement avec des messages clairs

```bash
git add .
git commit -m "feat: ajout de la fonctionnalité X"
git push origin feature/ma-nouvelle-fonctionnalite
```

---

## 🚀 Pipeline de Déploiement

### Étape 1 : Développement Local
```
Développer sur FastAPI + React + MongoDB
↓
Tests locaux
↓
Commit sur feature branch
```

### Étape 2 : Intégration
```
Pull Request vers develop
↓
Code Review
↓
Merge dans develop
```

### Étape 3 : Préparation Production
```
Merge develop → main
↓
Exécuter package-php-deployment.sh
↓
Archive ZIP générée
```

### Étape 4 : Déploiement Plesk
```
Télécharger l'archive depuis /deployment/
↓
Extraire et uploader sur Plesk
↓
Configuration et tests
```

---

## 📝 Conventions de Commit

### Format

```
<type>(<scope>): <message>

[corps optionnel]

[footer optionnel]
```

### Types

- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Documentation
- **style** : Formatage (pas de changement de code)
- **refactor** : Refactoring
- **test** : Ajout de tests
- **chore** : Tâches de maintenance

### Exemples

```bash
# Nouvelle fonctionnalité
git commit -m "feat(admin): ajout export PDF personnalisé"

# Correction de bug
git commit -m "fix(participant): correction calcul progression"

# Documentation
git commit -m "docs: mise à jour guide déploiement"

# Refactoring
git commit -m "refactor(api): optimisation requêtes base de données"
```

---

## 🔀 Pull Request Process

### 1. Créer une PR

```bash
# S'assurer d'être à jour
git checkout develop
git pull origin develop

# Créer votre branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire vos modifications
# ...

# Push
git push origin feature/nouvelle-fonctionnalite
```

### 2. Template de PR

```markdown
## Description
Brève description de la fonctionnalité ou du fix

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Breaking change
- [ ] Documentation

## Tests effectués
- [ ] Tests locaux (dev)
- [ ] Tests sur build production
- [ ] Tests manuels des fonctionnalités impactées

## Checklist
- [ ] Code suit les conventions du projet
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de conflits avec develop
- [ ] Build production testé

## Screenshots (si applicable)
```

### 3. Code Review

- Attendre la review d'au moins 1 personne
- Intégrer les feedbacks
- Merger après approbation

---

## 🏷️ Versioning (Semantic Versioning)

### Format : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles avec les versions précédentes
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs

### Exemples

```bash
# Nouvelle feature mineure
git tag v2.1.0
git push origin v2.1.0

# Correction de bug
git tag v2.1.1
git push origin v2.1.1

# Breaking change
git tag v3.0.0
git push origin v3.0.0
```

---

## 🔄 Processus de Release

### 1. Préparer la Release

```bash
# Sur develop, vérifier que tout est OK
git checkout develop
git pull origin develop

# Créer une branche release
git checkout -b release/2.1.0

# Mettre à jour la version dans les fichiers nécessaires
# - package.json
# - README.md
# - etc.

git add .
git commit -m "chore: préparation release v2.1.0"
git push origin release/2.1.0
```

### 2. Merger vers Main

```bash
# Créer une PR : release/2.1.0 → main
# Après merge dans main:

git checkout main
git pull origin main
git tag v2.1.0
git push origin v2.1.0
```

### 3. Générer l'Archive de Déploiement

```bash
# Sur main
bash scripts/package-php-deployment.sh

# Archive créée dans /app/deployment/
```

### 4. Créer une GitHub Release

1. Allez sur GitHub → Releases → "New Release"
2. Tag : `v2.1.0`
3. Title : `Version 2.1.0 - Description`
4. Description : Changelog détaillé
5. Attachez l'archive ZIP générée
6. Publish Release

### 5. Backmerge vers Develop

```bash
# Pour synchroniser develop avec les changements de main
git checkout develop
git merge main
git push origin develop
```

---

## 📦 Gestion des Archives de Déploiement

### Ne PAS Versionner

Les archives ZIP et les builds ne sont **pas versionnés** dans Git (voir `.gitignore`).

```
# .gitignore
/deployment/*.zip
/php/public/*
```

### Distribution

Les archives sont :
1. Générées localement via le script
2. Attachées aux GitHub Releases
3. Téléchargées par les utilisateurs depuis GitHub

---

## 🔍 Workflow de Hotfix

Pour les corrections urgentes en production :

```bash
# Créer depuis main
git checkout main
git pull origin main
git checkout -b hotfix/correction-critique

# Faire la correction
# ...

# Commit
git commit -m "fix: correction bug critique X"

# Merger dans main
git checkout main
git merge hotfix/correction-critique
git tag v2.1.1
git push origin main --tags

# Backmerge dans develop
git checkout develop
git merge main
git push origin develop

# Supprimer la branche hotfix
git branch -d hotfix/correction-critique
```

---

## 🧪 Tests Avant Déploiement

### Checklist

- [ ] **Tests locaux FastAPI** : Toutes les routes fonctionnent
- [ ] **Tests locaux React** : UI responsive et fonctionnelle
- [ ] **Build production** : `yarn build` réussit sans erreurs
- [ ] **Tests après packaging** : Extraire l'archive et tester localement
- [ ] **Tests sur environnement staging** : Si disponible
- [ ] **Validation utilisateur** : Tester les workflows principaux

### Commandes Utiles

```bash
# Test backend
cd backend
pytest

# Test frontend
cd frontend
yarn test

# Build production
cd frontend
yarn craco build

# Package complet
bash scripts/package-php-deployment.sh
```

---

## 📊 Suivi des Issues

### Labels Recommandés

- **bug** : Problème à corriger
- **enhancement** : Amélioration
- **feature** : Nouvelle fonctionnalité
- **documentation** : Mise à jour docs
- **help wanted** : Aide externe souhaitée
- **priority: high** : Urgent
- **wontfix** : Ne sera pas corrigé

### Template d'Issue

```markdown
## Description
Description claire du problème ou de la demande

## Étapes pour reproduire (si bug)
1. Aller sur...
2. Cliquer sur...
3. Observer...

## Comportement attendu
Ce qui devrait se passer

## Comportement actuel
Ce qui se passe actuellement

## Screenshots
Si applicable

## Environnement
- OS: [Windows/Mac/Linux]
- Navigateur: [Chrome/Firefox/Safari]
- Version: [v2.0.0]
```

---

## 🤝 Contribution

### Pour Contribuer

1. Fork le repository
2. Créer une branche feature
3. Faire vos modifications
4. Pusher sur votre fork
5. Créer une Pull Request

### Code of Conduct

- Code propre et commenté
- Respecter les conventions existantes
- Tester avant de pusher
- Documentation à jour

---

## 📞 Support

**Questions sur le workflow ?**
- 📧 Email : eric.savary@lausanne.ch
- 🌐 Wiki : (À créer sur GitHub)
- 💬 Discussions : (À activer sur GitHub)

---

## 📚 Ressources

- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions) (pour CI/CD futur)

---

✅ **Workflow bien établi = Déploiements sereins !**
