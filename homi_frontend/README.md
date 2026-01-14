# Homi Frontend - Documentation

## 🏗️ Architecture

Ce projet utilise une architecture moderne et scalable basée sur **React + TypeScript + Vite**.

### Structure du Projet

```
homi_frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── common/         # Composants UI de base (Button, Input, Card, etc.)
│   │   ├── forms/          # Composants de formulaires
│   │   ├── layout/         # Composants de mise en page
│   │   └── dashboard/      # Composants spécifiques au dashboard
│   ├── pages/              # Pages/Routes de l'application
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CreateTaskPage.tsx
│   │   └── TasksPage.tsx
│   ├── services/           # Services API et logique métier
│   │   ├── api.ts          # Client API centralisé (Axios)
│   │   ├── auth.service.ts # Service d'authentification
│   │   └── task.service.ts # Service de gestion des tâches
│   ├── stores/             # État global (Zustand)
│   │   ├── authStore.ts    # Store d'authentification
│   │   └── taskStore.ts    # Store des tâches
│   ├── types/              # Types et interfaces TypeScript
│   │   └── index.ts
│   ├── layouts/            # Layouts de page
│   │   └── MainLayout.tsx
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Fonctions utilitaires
│   ├── contexts/           # React Contexts (si nécessaire)
│   ├── assets/             # Assets statiques
│   ├── App.tsx             # Composant racine avec routing
│   ├── main.tsx            # Point d'entrée
│   └── index.css           # Styles globaux
├── .env                    # Variables d'environnement
├── .env.example            # Exemple de variables d'environnement
├── tailwind.config.js      # Configuration Tailwind CSS
├── tsconfig.json           # Configuration TypeScript
├── vite.config.ts          # Configuration Vite
└── package.json            # Dépendances et scripts
```

## 🚀 Technologies Utilisées

### Core
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server ultra-rapide

### Styling
- **Tailwind CSS** - Framework CSS utility-first
- **PostCSS** - Traitement CSS

### Routing
- **React Router v6** - Navigation côté client

### État Global
- **Zustand** - Gestion d'état légère et performante

### API
- **Axios** - Client HTTP pour les requêtes API

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation des dépendances

```bash
cd homi_frontend
npm install
```

### Configuration

Créez un fichier `.env` à partir de `.env.example`:

```bash
cp .env.example .env
```

Modifiez les variables d'environnement selon votre configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏃 Développement

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Build pour la production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`

### Prévisualiser le build de production

```bash
npm run preview
```

## 🎨 Conventions de Code

### Composants

- Un composant = un fichier
- Utiliser PascalCase pour les noms de composants
- Préférer les functional components avec hooks
- Utiliser TypeScript pour tous les composants

```tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
    </div>
  );
};
```

### Services

- Centraliser toute la logique API dans les services
- Un service par domaine métier
- Utiliser des fonctions async/await
- Gérer les erreurs de manière cohérente

```typescript
export const myService = {
  getData: async (): Promise<Data> => {
    const response = await api.get<Data>('/data');
    return response.data;
  },
};
```

### Stores (Zustand)

- Un store par domaine métier
- Inclure les actions dans le store
- Utiliser le middleware persist pour la persistance

```typescript
import { create } from 'zustand';

interface MyState {
  data: Data[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const data = await myService.getData();
      set({ data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
```

## 🔐 Authentification

L'authentification utilise JWT (JSON Web Tokens):

1. L'utilisateur se connecte via `/login`
2. Le token JWT est stocké dans localStorage
3. Le token est automatiquement ajouté à chaque requête API via un intercepteur Axios
4. En cas de 401 (Unauthorized), l'utilisateur est redirigé vers `/login`

## 🛣️ Routing

Routes publiques:
- `/login` - Page de connexion

Routes privées (nécessitent authentification):
- `/dashboard` - Tableau de bord principal
- `/tasks` - Liste des tâches
- `/create-task` - Création de tâche

## 🧩 Composants Réutilisables

### Button
```tsx
<Button variant="primary" size="lg" isLoading={false}>
  Click me
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errorMessage}
  required
/>
```

### Card
```tsx
<Card className="p-6" gradient hover>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

## 🎯 Best Practices

### Performance
- Utiliser React.memo() pour les composants qui re-render souvent
- Lazy loading des routes avec React.lazy()
- Optimiser les images et assets
- Utiliser useMemo et useCallback quand nécessaire

### Accessibilité
- Utiliser des labels sémantiques
- Ajouter des attributs ARIA quand nécessaire
- Assurer la navigation au clavier
- Contraste des couleurs suffisant

### Sécurité
- Ne jamais stocker de données sensibles dans localStorage
- Valider toutes les entrées utilisateur
- Utiliser HTTPS en production
- Implémenter CORS correctement

## 🔄 Intégration avec le Backend

Le frontend communique avec le backend Symfony via l'API REST:

- Base URL: `http://localhost:8000/api`
- Authentification: Bearer Token (JWT)
- Format: JSON
- CORS configuré pour le développement local

### Endpoints principaux

- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Refresh token
- `GET /tasks` - Liste des tâches
- `POST /tasks` - Créer une tâche
- `PATCH /tasks/{id}` - Modifier une tâche
- `DELETE /tasks/{id}` - Supprimer une tâche
- `GET /tasks/stats` - Statistiques

## 📝 Scripts Disponibles

```json
{
  "dev": "vite",                    // Serveur de développement
  "build": "tsc && vite build",     // Build pour production
  "preview": "vite preview"         // Prévisualiser le build
}
```

## 🐛 Debugging

### DevTools
- React DevTools pour inspecter les composants
- Redux DevTools compatible avec Zustand
- Network tab pour les requêtes API

### Logs
- Utiliser `console.log()` pour le debug simple
- Utiliser `console.error()` pour les erreurs
- Les erreurs API sont loggées automatiquement

## 📚 Ressources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🤝 Contribution

1. Créer une branche pour votre feature: `git checkout -b feature/ma-feature`
2. Commiter vos changements: `git commit -m 'Add: ma feature'`
3. Pusher vers la branche: `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 License

© 2026 Homi - Tous droits réservés

