# Architecture Frontend — Homi

> Guide d'architecture pour l'équipe de développement.
> Dernière mise à jour : Février 2026

---

## Structure des dossiers

```
src/
├── App.tsx                     # Routes (public, privé, admin)
├── main.tsx                    # Point d'entrée, imports CSS + i18n
├── App.css                     # Couche @layer components (utilitaires Tailwind)
├── index.css                   # Design tokens + @layer base
│
├── types/                      # 📦 Source unique de vérité pour les types
│   ├── index.ts                # Barrel — re-exporte tout (import { User } from '../types')
│   ├── auth.ts                 # User, UserRole, LoginCredentials, AuthResponse
│   ├── task.ts                 # Task, TaskStatus, TaskStats, CreateTaskForm
│   ├── domicile.ts             # Domicile, CreateDomicileForm
│   ├── invoice.ts              # Invoice, InvoiceStatus, InvoiceStats
│   ├── timeTracking.ts         # TimeLog, TimeLogStatus, AdminTimeLogStats, PersistedTimer
│   ├── budget.ts               # BudgetOverview, DomicileBudget, TodayCost
│   ├── performance.ts          # PerformanceData
│   ├── recurringTask.ts        # RecurringTaskTemplate, CreateRecurringTaskForm
│   ├── smartEstimate.ts        # SmartEstimateResult, OverrunCheck
│   ├── taskReview.ts           # TaskReviewData, ExecutorReviewStats
│   └── api.ts                  # ApiResponse, ApiError
│
├── services/                   # 🔌 Couche API (1 service = 1 domaine)
│   ├── api.ts                  # Client Axios, intercepteurs, retry
│   ├── auth.service.ts         # Login, register, logout, JWT
│   ├── task.service.ts         # CRUD tâches + start/complete
│   ├── domicile.service.ts     # CRUD domiciles
│   ├── user.service.ts         # Utilisateurs (getAll, getNonAdmin)
│   ├── invoice.service.ts      # CRUD factures + stats
│   ├── timeTracking.service.ts # Logs de temps + admin stats
│   ├── timerPersistence.service.ts # Persistance localStorage du timer
│   ├── budget.service.ts       # Budgets + coût du jour
│   ├── performance.service.ts  # Dashboard performance
│   ├── recurringTask.service.ts # Tâches récurrentes
│   ├── smartEstimate.service.ts # Estimations intelligentes
│   └── taskReview.service.ts   # Avis sur les tâches
│
├── stores/                     # 🏪 State management (Zustand)
│   ├── authStore.ts            # Authentification + persist
│   ├── taskStore.ts            # Tâches + stats calculées
│   └── domicileStore.ts        # Domiciles
│
├── components/
│   ├── common/                 # 🧱 Composants UI génériques
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── SpellCheckTextarea.tsx
│   │   ├── SpellCheckInput.tsx
│   │   └── index.ts            # Barrel export
│   │
│   ├── layout/                 # 📐 Composants de mise en page
│   │   ├── PageWrapper.tsx     # MainLayout + loading + error (remplace le pattern dupliqué)
│   │   └── index.ts
│   │
│   ├── feedback/               # 💬 Feedback utilisateur
│   │   ├── EmptyState.tsx      # État vide réutilisable (icône + titre + CTA)
│   │   ├── ErrorAlert.tsx      # Bannière d'erreur avec dismiss
│   │   ├── StatusBadge.tsx     # Badge de statut (task/invoice/timeLog) + StatusDot
│   │   └── index.ts
│   │
│   ├── data-display/           # 📊 Affichage de données
│   │   ├── StatsCard.tsx       # Carte de statistique (gradient + icône + valeur)
│   │   ├── StatsGrid.tsx       # Grille responsive pour StatsCard
│   │   └── index.ts
│   │
│   ├── ErrorBoundary.tsx       # Error boundary React
│   └── ProtectedRoute.tsx      # Guards d'authentification (PrivateRoute, AdminRoute)
│
├── hooks/                      # 🪝 Hooks réutilisables
│   ├── useAsyncData.ts         # Fetching générique (remplace useState+useEffect+try/catch)
│   ├── useSpellCheck.ts        # Vérification orthographique LanguageTool
│   └── index.ts
│
├── utils/                      # 🔧 Fonctions utilitaires
│   ├── format.ts               # formatCurrency, formatDate, formatDuration, getUserInitials...
│   ├── notifications.ts        # Toast (notifySuccess, notifyError, notifyInfo)
│   └── spellcheck.ts           # Intégration API LanguageTool + Levenshtein
│
├── layouts/
│   └── MainLayout.tsx          # Barre de navigation + menu mobile + dropdown utilisateur
│
├── pages/                      # 📄 Pages (lazy-loaded depuis App.tsx)
│   ├── index.ts                # Barrel export
│   ├── DashboardPage.tsx       # ✅ Refactorisé avec les composants partagés
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ... (37 pages)
│   └── Error404.tsx
│
├── i18n/                       # 🌐 Internationalisation
│   ├── index.ts                # Config i18next (5 langues)
│   └── locales/                # Fichiers de traduction JSON
│
└── contexts/                   # (Réservé pour futurs Context providers)
```

---

## Principes d'architecture

### 1. Source unique de vérité pour les types

**Avant** : Les types étaient définis à la fois dans `types/index.ts` ET dans chaque service, avec des divergences (champs manquants, noms différents).

**Après** : Chaque domaine a son propre fichier de types dans `types/`. Les services importent depuis `types/` et re-exportent pour compatibilité.

```typescript
// ✅ Bon : importer depuis types/
import type { Task, TaskStats } from '../types/task';

// ✅ Aussi bon : importer depuis le barrel
import type { Task, TaskStats } from '../types';

// ❌ Ne plus faire : définir des interfaces dans les services
```

### 2. Composants partagés pour éliminer la duplication

| Pattern dupliqué | Composant partagé | Fichiers impactés |
|---|---|---|
| `isLoading ? <MainLayout><Spinner /></MainLayout>` | `<PageWrapper isLoading={...}>` | Toutes les pages |
| Bannière d'erreur rouge | `<ErrorAlert message={...} />` | Toutes les pages |
| État vide (icône + texte + bouton) | `<EmptyState title={...} action={...} />` | Listes vides |
| Carte de stat (gradient + nombre) | `<StatsCard label={...} value={...} />` | Dashboard, Admin, Budget |
| Point coloré de statut | `<StatusDot status="TODO" />` | Listes de tâches |
| Badge de statut | `<StatusBadge status="PAID" type="invoice" />` | Toutes les listes |

### 3. Hook `useAsyncData` pour le data-fetching

**Avant** (répété dans chaque page) :
```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const load = async () => {
    try { setData(await fetchFn()); }
    catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };
  load();
}, []);
```

**Après** :
```typescript
const { data, isLoading, error, refetch } = useAsyncData(
  () => budgetService.getOverview(year, month),
  { deps: [year, month] }
);
```

### 4. Utilitaires de formatage centralisés

```typescript
import { formatCurrency, formatDate, getUserDisplayName } from '../utils/format';

formatCurrency(1234.5)           // → "1 234,50 €"
formatDate('2026-01-15')         // → "15 janv. 2026"
getUserDisplayName(user)         // → "John Doe"
getUserInitials(user)            // → "JD"
formatDuration(3661)             // → "1h 01m 01s"
```

---

## Conventions de code

### Imports : ordre recommandé

```typescript
// 1. React & bibliothèques externes
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// 2. Stores
import { useAuthStore } from '../stores/authStore';

// 3. Types (import type)
import type { Task } from '../types';

// 4. Composants partagés
import { PageWrapper } from '../components/layout';
import { EmptyState, StatusBadge } from '../components/feedback';
import { StatsCard, StatsGrid } from '../components/data-display';
import { Card, Button } from '../components/common';

// 5. Utilitaires
import { formatCurrency, getUserDisplayName } from '../utils/format';
```

### Services : pattern uniforme

Tous les services exportent un **objet nommé** :
```typescript
export const myDomainService = {
  getAll: async (): Promise<MyType[]> => { ... },
  create: async (data: CreateForm): Promise<MyType> => { ... },
};
```

### Pages : structure type

```tsx
export const MyPage: React.FC = () => {
  // Hooks
  const { t } = useTranslation();
  const { data, isLoading, error } = useAsyncData(() => myService.getAll());

  return (
    <PageWrapper isLoading={isLoading} error={error}>
      {/* Contenu de la page */}
    </PageWrapper>
  );
};
```

---

## Domaines métier

| Domaine | Types | Service | Store | Pages |
|---|---|---|---|---|
| **Auth** | `auth.ts` | `auth.service.ts` | `authStore.ts` | Login, Register, VerifyEmail, 2FA |
| **Tâches** | `task.ts` | `task.service.ts`, `taskReview.service.ts`, `smartEstimate.service.ts` | `taskStore.ts` | Tasks, CreateTask, TaskTimer |
| **Domiciles** | `domicile.ts` | `domicile.service.ts` | `domicileStore.ts` | Domiciles, CreateDomicile |
| **Temps** | `timeTracking.ts` | `timeTracking.service.ts`, `timerPersistence.service.ts` | — | MyTimeLogs, ManualTimeLog, AdminTimeLogs |
| **Factures** | `invoice.ts` | `invoice.service.ts` | — | MyInvoices, AdminInvoices, CreateInvoice |
| **Budget** | `budget.ts` | `budget.service.ts` | — | BudgetPage |
| **Performance** | `performance.ts` | `performance.service.ts` | — | PerformancePage |
| **Récurrent** | `recurringTask.ts` | `recurringTask.service.ts` | — | RecurringTasksPage |

---

## Refactorisations futures recommandées

### Priorité haute

1. **Appliquer `PageWrapper` à toutes les pages** — Le pattern `<MainLayout><LoadingSpinner /></MainLayout>` est encore présent dans ~30 pages. Migrer progressivement en utilisant DashboardPage comme modèle.

2. **Appliquer `useAsyncData` aux pages qui gèrent le state localement** — BadgesPage, SettingsPage, NotificationsPage, ProfilePage, AdminStatsPage appellent `api.get()` directement. Migrer vers le hook.

3. **Créer des services manquants** — ProfilePage, SettingsPage, NotificationsPage, BadgesPage appellent `api` directement. Créer :
   - `profile.service.ts`
   - `settings.service.ts`
   - `notification.service.ts`
   - `badge.service.ts`

### Priorité moyenne

4. **Unifier `SpellCheckInput` et `SpellCheckTextarea`** — 70% du code est identique. Extraire un composant `SpellCheckWrapper` qui accepte un `renderInput` prop.

5. **Décomposer les pages volumineuses** :
   - `TaskTimerPage.tsx` (495 lignes) → Extraire `TimerDisplay`, `TimerControls`, `EstimatePanel`
   - `MainLayout.tsx` (487 lignes) → Extraire `UserDropdown`, `MobileMenu`, `NavLinks`

6. **Créer des stores Zustand** pour les domaines qui n'en ont pas (invoices, timeLogs) pour permettre le partage d'état entre pages.

### Priorité basse

7. **Nettoyer les hooks inutilisés** — 8 hooks dans `hooks/` ne sont importés nulle part (`useDarkMode`, `useSessionTimeout`, `useNetworkStatus`, etc.). Les supprimer ou les intégrer.

8. **Ajouter `<ToastContainer />`** dans App.tsx et utiliser `notifySuccess`/`notifyError` au lieu d'`alert()` et de states d'erreur inline.

9. **Internationaliser les chaînes restantes** — Certaines pages (Performance, Budget) ont encore des textes en dur en français.

---

## Pour ajouter une nouvelle fonctionnalité

1. Créer le fichier de types : `types/monDomaine.ts`
2. Ajouter la re-export dans `types/index.ts` : `export * from './monDomaine';`
3. Créer le service : `services/monDomaine.service.ts` (importe les types depuis `types/`)
4. Si besoin d'état partagé : créer `stores/monDomaineStore.ts`
5. Créer la page dans `pages/`
6. Ajouter la route dans `App.tsx`
7. Ajouter l'export dans `pages/index.ts`
