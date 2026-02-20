# ========================================
# GUIDE DE DÉPLOIEMENT CI/CD
# Frontend: Vercel | Backend: Render | CI/CD: GitHub Actions
# ========================================

## 📋 PRÉREQUIS

1. **GitHub Repository**
   - Poussez votre code sur GitHub
   - Repository: https://github.com/VOTRE_USERNAME/HomiByIsphers

2. **Comptes gratuits à créer**
   - Vercel: https://vercel.com/signup
   - Render: https://render.com/register

## 🚀 ÉTAPE 1 : CONFIGURER VERCEL (FRONTEND)

### A. Créer le projet sur Vercel

1. Connectez-vous à https://vercel.com
2. Cliquez sur "Add New" → "Project"
3. Importez votre repo GitHub
4. Configurez le projet:
   - **Framework Preset**: Vite
   - **Root Directory**: `homi_frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### B. Variables d'environnement Vercel

Dans Vercel Settings → Environment Variables, ajoutez:

```
VITE_API_BASE_URL=https://votre-backend-url.onrender.com/api
```

### C. Récupérer les tokens Vercel pour GitHub Actions

1. Allez dans Vercel Account Settings → Tokens
2. Créez un nouveau token → Copiez-le
3. Allez dans Project Settings → General
4. Notez:
   - **Project ID**
   - **Team ID** (ou Org ID)

### D. Ajouter les secrets GitHub (Frontend)

Dans GitHub: Settings → Secrets and variables → Actions → New repository secret

```
VERCEL_TOKEN=votre_token_ici
VERCEL_ORG_ID=votre_org_id_ici
VERCEL_PROJECT_ID=votre_project_id_ici
VITE_API_BASE_URL=https://votre-backend-url.onrender.com/api
```

## 🖥️ ÉTAPE 2 : CONFIGURER RENDER (BACKEND)

### A. Créer le service Web

1. Connectez-vous à https://render.com
2. Dashboard → "New" → "Blueprint"
3. Connectez votre repo GitHub
4. Render détectera automatiquement `render.yaml`

### B. Créer la base de données PostgreSQL

1. Dashboard → "New" → "PostgreSQL"
2. Name: `homi-postgres`
3. Database: `homi_db`
4. User: `homi_user`
5. Plan: **Free**
6. Create Database

### C. Variables d'environnement Render

Dans votre service Web Settings → Environment:

```bash
APP_ENV=prod
APP_SECRET=VotreSecretTresTresLong32CaracteresMinimum!
DATABASE_URL=postgresql://homi_user:password@host:5432/homi_db
JWT_EXPIRATION=3600
CORS_ALLOW_ORIGIN=https://votre-app.vercel.app
```

⚠️ **Important**: Le `DATABASE_URL` sera automatiquement rempli si vous liez la DB

### D. Lier la base de données

1. Service Settings → Environment
2. Cliquez sur "Add Environment Variable"
3. Sélectionnez "Add from Database" → Choisissez `homi-postgres`

### E. Deploy Hook pour GitHub Actions

1. Service Settings → Deploy Hook
2. Copiez l'URL du Deploy Hook

### F. Ajouter le secret GitHub (Backend)

Dans GitHub Secrets, ajoutez:

```
RENDER_DEPLOY_HOOK_URL=votre_deploy_hook_url_ici
```

## 🔧 ÉTAPE 3 : EXÉCUTER LES MIGRATIONS

Une fois le backend déployé sur Render:

1. Dashboard → Votre service → "Shell"
2. Exécutez:

```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

## 🔄 ÉTAPE 4 : METTRE À JOUR LES URLS

### A. Dans homi_frontend/.env.production

Créez ce fichier:

```env
VITE_API_BASE_URL=https://homi-backend.onrender.com/api
```

### B. Dans homi_backend (Render Environment Variables)

Mettez à jour:

```
CORS_ALLOW_ORIGIN=https://votre-app-homi.vercel.app
```

## ✅ ÉTAPE 5 : TESTER LE CI/CD

1. Faites un commit et push:

```bash
git add .
git commit -m "Configure CI/CD deployment"
git push origin main
```

2. Allez sur GitHub → Actions
3. Vous verrez les workflows s'exécuter automatiquement

## 📊 WORKFLOWS GITHUB ACTIONS

### Frontend CI/CD (`.github/workflows/frontend-ci.yml`)
- ✅ Teste le build à chaque push
- ✅ Lint le code
- ✅ Déploie automatiquement sur Vercel (branch main)

### Backend CI/CD (`.github/workflows/backend-ci.yml`)
- ✅ Teste le code PHP
- ✅ Exécute les migrations en test
- ✅ Vérifie la validation Composer
- ✅ Trigger le déploiement Render (branch main)

## 🌐 URLS DE VOTRE APPLICATION

Une fois déployé:

- **Frontend**: https://votre-app-homi.vercel.app
- **Backend**: https://homi-backend.onrender.com
- **API**: https://homi-backend.onrender.com/api

## 📝 COMMANDES UTILES

### Mettre à jour le frontend
```bash
cd homi_frontend
git add .
git commit -m "Update frontend"
git push
```

### Mettre à jour le backend
```bash
cd homi_backend
git add .
git commit -m "Update backend"
git push
```

### Forcer un redéploiement Render
```bash
curl -X POST "$RENDER_DEPLOY_HOOK_URL"
```

## ⚠️ NOTES IMPORTANTES

1. **Render Free Tier**:
   - Se met en veille après 15 min d'inactivité
   - Premier chargement peut prendre 30-60 secondes
   - 750h/mois gratuit

2. **Vercel Free Tier**:
   - Bande passante: 100GB/mois
   - Pas de mise en veille
   - Déploiements illimités

3. **GitHub Actions**:
   - 2000 minutes/mois gratuites
   - Suffisant pour ce projet

## 🐛 DÉPANNAGE

### Le frontend ne peut pas appeler le backend
- Vérifiez `CORS_ALLOW_ORIGIN` dans Render
- Vérifiez `VITE_API_BASE_URL` dans Vercel

### Erreur 500 sur le backend
- Vérifiez les logs Render
- Vérifiez `APP_SECRET` est défini
- Vérifiez les migrations sont exécutées

### GitHub Actions échoue
- Vérifiez les secrets sont bien configurés
- Vérifiez les logs dans Actions tab

## 🎉 FÉLICITATIONS !

Votre application est maintenant déployée avec CI/CD automatique !

Chaque push sur `main` déclenche automatiquement:
1. Tests automatiques
2. Build
3. Déploiement sur Vercel (frontend)
4. Déploiement sur Render (backend)
