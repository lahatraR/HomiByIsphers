# 🏠 Homi - Application de Gestion de Tâches et Domiciles

## 📋 Description

Homi est une application moderne de gestion de tâches et de domiciles, composée d'un frontend React et d'un backend Symfony.

## 🎯 Statut du Projet

✅ **Frontend refactoré** - Architecture moderne React + TypeScript
✅ **Backend Symfony** - API REST fonctionnelle
⏳ **En attente d'intégration** - Fusion backend/frontend

## 🏗️ Structure du Projet

```
HomiByIsphers/
├── homi_frontend/           # Frontend React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── homi_backend/            # Backend Symfony + PostgreSQL
│   ├── src/
│   ├── config/
│   ├── composer.json
│   └── README.md
├── package.json             # Scripts racine
└── FRONTEND_REFACTORING_COMPLETE.md
```

## 🚀 Installation Rapide

### Prérequis

- **Node.js 18+** et npm
- **PHP 8.4+**
- **PostgreSQL 16**
- **Composer**

### Installation Complète

```bash
# À la racine du projet
npm run install:all

# Ou installer séparément :
npm run install:frontend
npm run install:backend
```

## 🏃 Démarrage

### Démarrer le Frontend

```bash
# Terminal 1
npm run frontend
# ou
cd homi_frontend && npm run dev
```

Le frontend sera accessible sur **http://localhost:5173**

### Démarrer le Backend

```bash
# Terminal 2
npm run backend
# ou
cd homi_backend && php bin/console server:start
```

Le backend sera accessible sur **http://localhost:8000**

## 📚 Documentation

- **Frontend** : Voir [homi_frontend/README.md](homi_frontend/README.md)
- **Backend** : Voir [homi_backend/README.md](homi_backend/README.md)
- **Guide de Refactoring** : Voir [FRONTEND_REFACTORING_COMPLETE.md](FRONTEND_REFACTORING_COMPLETE.md)

## 🛠️ Technologies

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Zustand (state management)
- Axios

### Backend
- Symfony 7.2
- PHP 8.4
- PostgreSQL 16
- API Platform
- JWT Authentication
- Doctrine ORM

## 🔌 Configuration

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend (.env.local)

```env
APP_ENV=dev
DATABASE_URL="postgresql://user:password@localhost:5432/homi_db"
JWT_EXPIRATION=3600
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
```

## 📦 Scripts Disponibles

```bash
# À la racine du projet
npm run frontend         # Démarrer le frontend
npm run backend          # Démarrer le backend
npm run install:all      # Installer toutes les dépendances
npm run build:frontend   # Build le frontend pour production
```

## 🎨 Fonctionnalités

### Actuelles (Frontend Refactoré)
- ✅ Page de connexion moderne
- ✅ Dashboard avec statistiques
- ✅ Création de tâches avec upload de fichiers
- ✅ Liste et gestion des tâches
- ✅ Authentification JWT
- ✅ Design responsive
- ✅ Architecture scalable

### À Intégrer
- ⏳ Timer de tâches
- ⏳ Gestion des exécuteurs
- ⏳ Notifications en temps réel
- ⏳ Statistiques avancées

## 🔄 Prochaines Étapes

1. **Tester le frontend refactoré** ✅
2. **Configurer CORS dans le backend** ⏳
3. **Adapter les endpoints API** ⏳
4. **Tester l'intégration complète** ⏳
5. **Déploiement** ⏳

## 🤝 Contribution

Pour contribuer au projet :

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Commiter : `git commit -m 'Add: ma feature'`
3. Pusher : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 License

© 2026 Homi - Tous droits réservés

## 📞 Support

Pour toute question, consulter la documentation ou contacter l'équipe de développement.

---

**Made with ❤️ by Homi Team**
