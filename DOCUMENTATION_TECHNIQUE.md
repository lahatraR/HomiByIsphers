# Documentation Technique Complète — Homi

> **Auteur** : Riantsoa LAHATRAR  
> **Date** : Janvier 2026  
> **Version** : 1.0  
> **Contexte** : Stage de fin d'études — Isphers  

---

## Table des Matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Explication détaillée des dossiers](#3-explication-détaillée-des-dossiers)
4. [Explication fichier par fichier](#4-explication-fichier-par-fichier)
5. [Fonctions critiques](#5-fonctions-critiques)
6. [Flux de fonctionnement](#6-flux-de-fonctionnement)
7. [Choix techniques et justifications](#7-choix-techniques-et-justifications)
8. [Points sensibles du projet](#8-points-sensibles-du-projet)

---

## 1. Vue d'ensemble du projet

### 1.1 Qu'est-ce que Homi ?

**Homi** est une application SaaS de gestion de domiciles (propriétés immobilières). Elle permet à un propriétaire (Admin) de gérer ses biens, d'y affecter des travailleurs (Exécuteurs), de créer et suivre des tâches, de contrôler le temps de travail, de générer des factures, et de piloter son budget.

### 1.2 Les deux rôles utilisateurs

| Rôle | Code technique | Droits |
|---|---|---|
| **Propriétaire** (Admin) | `ROLE_ADMIN` | Créer domiciles, créer/assigner tâches, valider temps, générer factures, gérer budgets, gérer tâches récurrentes, voir statistiques globales |
| **Exécuteur** (Travailleur) | `ROLE_USER` | Voir tâches qui lui sont assignées, démarrer/terminer tâches, soumettre temps de travail, consulter ses factures, voir sa performance |

> `ROLE_ADMIN` hérite de `ROLE_USER` grâce à la hiérarchie des rôles Symfony. Un admin a donc **tous** les droits d'un exécuteur + ses droits spécifiques.

### 1.3 Stack technique

| Couche | Technologies | Version |
|---|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | React 19, TS 5.9, Vite 7, Tailwind 3.4 |
| **State Management** | Zustand | 5.0 |
| **Internationalisation** | i18next + react-i18next | 5 langues (FR, EN, ES, DE, ZH) |
| **Backend** | Symfony (PHP), Doctrine ORM | Symfony 8.0, PHP 8.4, Doctrine 3.6 |
| **Base de données** | PostgreSQL | 16 |
| **Authentification** | JWT custom (lcobucci/jwt) | HMAC SHA256 |
| **Email** | Mailjet API (envoi asynchrone via queue) | v3.1 |
| **Déploiement** | Docker (PHP-FPM + nginx + supervisor) sur Render | — |
| **Frontend deploy** | GitHub Pages (Vercel possible) | — |

### 1.4 Chiffres clés du projet

| Métrique | Valeur |
|---|---|
| Endpoints API | ~82 |
| Pages frontend | 35 |
| Entités Doctrine | 16+ |
| Services backend | 9 |
| Services frontend | 13 |
| Custom hooks React | 11 |
| Composants partagés | 14 |
| Migrations de base de données | 15 |
| Langues supportées | 5 (FR, EN, ES, DE, ZH) |

---

## 2. Architecture globale

### 2.1 Vue macro : Client–Serveur

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR                          │
│                   (Navigateur)                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (React SPA)                        │
│  GitHub Pages / Vercel                                   │
│  ┌────────────┐ ┌──────────┐ ┌─────────────┐           │
│  │   Pages    │ │  Stores  │ │  Services   │           │
│  │  (35 pages)│ │ (Zustand)│ │  (Axios)    │           │
│  └────────────┘ └──────────┘ └──────┬──────┘           │
└──────────────────────────────────────┼──────────────────┘
                                       │ API REST (JSON)
                                       │ Authorization: Bearer <JWT>
                                       ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Symfony 8 API)                      │
│  Docker sur Render                                       │
│  ┌────────────┐ ┌──────────┐ ┌─────────────┐           │
│  │ Controllers│ │ Services │ │ Repositories│           │
│  │  (18+)     │ │  (9)     │ │  (8+)       │           │
│  └──────┬─────┘ └────┬─────┘ └──────┬──────┘           │
│         │            │              │                    │
│         ▼            ▼              ▼                    │
│  ┌──────────────────────────────────────────┐           │
│  │         Doctrine ORM (Entités)           │           │
│  └─────────────────────┬────────────────────┘           │
└────────────────────────┼────────────────────────────────┘
                         │ SQL (via PDO)
                         ▼
┌──────────────────────────────────────────────────────────┐
│           PostgreSQL 16 (Render Managed)                 │
│  16+ tables, 20+ indexes, migrations Doctrine            │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Séparation des responsabilités

Le projet suit une architecture **en couches** stricte :

```
Frontend                              Backend
─────────                             ─────────
Page (UI) ──→ Store (état) ──→        Controller (routing/validation)
              Service (API) ──→          ↓
                                      Service (logique métier)
                                         ↓
                                      Repository (accès données)
                                         ↓
                                      Entity (modèle de données)
                                         ↓
                                      PostgreSQL (persistance)
```

**Principe** : Chaque couche ne communique qu'avec la couche immédiatement inférieure. Un Controller n'accède jamais directement à la base — il passe par un Service qui utilise un Repository.

### 2.3 Diagramme des entités (relations)

```
User (1) ──────< Task (N)           [assignedTo]
User (1) ──────< Domicile (N)       [createdBy]
User (1) ──────< TaskTimeLog (N)    [executor]
User (1) ──────< Invoice (N)        [executor]
User (1) ──────< TaskHistory (N)    [user]
User (1) ──────< RefreshToken (N)   [user]
User (1) ──────< Notification (N)   [user]
User (1) ──────< Activity (N)       [user]
User (1) ──────< UserSettings (1)   [user]

Domicile (1) ──< Task (N)           [domicile]
Domicile (1) ──< DomicileExecutor (N) [domicile]
Domicile (1) ──< Invoice (N)        [domicile]
Domicile (1) ──< MonthlyBudget (N)  [domicile]
Domicile (1) ──< RecurringTaskTemplate (N) [domicile]

DomicileExecutor = Table de jonction User ↔ Domicile (avec hourlyRate)

Task (1) ──< TaskTimeLog (N)        [task]
Task (1) ── TaskReview (1)          [task] (OneToOne)
Task (1) ──< TaskHistory (N)        [task]
```

---

## 3. Explication détaillée des dossiers

### 3.1 Racine du projet

```
HomiByIsphers/
├── homi_backend/          ← API Symfony (PHP)
├── homi_frontend/         ← Application React (TypeScript)
├── vendor/                ← Dépendances PHP racine (Mailjet scripts)
├── package.json           ← Scripts npm racine (setup, deploy)
├── composer.json          ← Dépendances PHP racine
├── render.yaml            ← Configuration déploiement Render
├── DOCUMENTATION_TECHNIQUE.md  ← Ce fichier
└── *.md                   ← Documentation projet (guides, audits, etc.)
```

### 3.2 Backend — `homi_backend/`

```
homi_backend/
├── bin/
│   ├── console            ← CLI Symfony (migrations, cache, commandes custom)
│   └── phpunit            ← Lanceur de tests unitaires
│
├── config/
│   ├── bundles.php        ← Enregistrement des bundles Symfony
│   ├── preload.php        ← Preloading PHP OPcache
│   ├── routes.yaml        ← Import routes (annotations + yaml)
│   ├── services.yaml      ← Injection de dépendances (DI container)
│   ├── packages/          ← Configuration des packages :
│   │   ├── security.yaml      ← Firewall, JWT, rôles, access_control
│   │   ├── doctrine.yaml      ← PostgreSQL, naming, mapping attributes
│   │   ├── nelmio_cors.yaml   ← CORS (origines autorisées)
│   │   ├── messenger.yaml     ← Queue de messages (emails)
│   │   ├── api_platform.yaml  ← Configuration API Platform (minimale)
│   │   ├── framework.yaml     ← Config framework (secret, sessions)
│   │   └── ...                ← validator, translation, twig, etc.
│   └── routes/
│       └── *.yaml             ← Fichiers de routes additionnels
│
├── docker/
│   └── nginx.conf         ← Configuration nginx (reverse proxy → PHP-FPM)
│
├── migrations/            ← 15 migrations Doctrine (DDL SQL)
│   ├── Version20260113... ← Schéma initial (tables core)
│   ├── Version20260120... ← Tables invoice, email queue
│   ├── Version20260125... ← +20 indexes de performance
│   └── Version20260219... ← Table monthly_budget
│
├── public/
│   └── index.php          ← Point d'entrée unique (front controller)
│
├── src/
│   ├── Controller/        ← 18+ contrôleurs REST (~82 endpoints)
│   ├── Entity/            ← 16+ entités Doctrine (modèle de données)
│   ├── Repository/        ← Repositories Doctrine (requêtes DB)
│   ├── Service/           ← 9 services métier
│   ├── Security/          ← JwtAuthenticator, JwtTokenProvider
│   ├── DTO/               ← Data Transfer Objects (validation)
│   ├── Enum/              ← Enums PHP 8 (TaskActionType, etc.)
│   ├── EventListener/     ← Listeners (CORS, Exception, Terminate)
│   ├── Command/           ← Commandes CLI (send-pending-emails)
│   └── Kernel.php         ← Kernel Symfony
│
├── templates/             ← Templates Twig (emails, vues admin)
├── tests/                 ← Tests PHPUnit
├── translations/          ← Fichiers de traduction Symfony
├── var/                   ← Cache, logs (généré automatiquement)
├── vendor/                ← Dépendances Composer
├── Dockerfile             ← Image Docker (PHP 8.4-FPM + nginx)
├── compose.yaml           ← Docker Compose local
├── composer.json          ← Dépendances PHP du backend
└── render.yaml            ← Config déploiement Render
```

### 3.3 Frontend — `homi_frontend/`

```
homi_frontend/
├── public/                ← Fichiers statiques (favicon, etc.)
│
├── src/
│   ├── components/        ← Composants réutilisables (14 composants)
│   │   ├── common/            ← Button, Card, Input, LoadingSpinner,
│   │   │                        PasswordInput, LanguageSwitcher,
│   │   │                        SpellCheckInput, SpellCheckTextarea
│   │   ├── data-display/      ← StatsCard, StatsGrid
│   │   ├── feedback/          ← EmptyState, ErrorAlert, StatusBadge/StatusDot
│   │   ├── layout/            ← PageWrapper
│   │   ├── ProtectedRoute.tsx ← Guards (PrivateRoute, PublicRoute, AdminRoute)
│   │   └── ErrorBoundary.tsx  ← Capture d'erreurs React globale
│   │
│   ├── hooks/             ← 11 custom hooks
│   │   ├── useAsyncData.ts        ← Hook générique de fetch (loading, error, refetch)
│   │   ├── useSpellCheck.ts       ← Vérification orthographique temps réel
│   │   ├── useDarkMode.ts         ← Détection mode sombre système
│   │   ├── useSessionTimeout.ts   ← Timeout d'inactivité
│   │   ├── useNetworkStatus.ts    ← Détection online/offline
│   │   ├── useDocumentVisibility.ts ← Visibilité onglet
│   │   ├── useKeyboardShortcuts.ts ← Raccourcis clavier
│   │   ├── usePageTitle.ts        ← Titre dynamique de page
│   │   ├── useResponsive.ts       ← Responsive breakpoints
│   │   ├── useAccessibility.ts    ← Accessibilité (aria-label, tabindex)
│   │   └── useErrorBoundary.ts    ← Listener global d'erreurs window
│   │
│   ├── i18n/              ← Internationalisation
│   │   ├── index.ts           ← Configuration i18next
│   │   └── locales/
│   │       ├── fr.json        ← 🇫🇷 Français (langue par défaut)
│   │       ├── en.json        ← 🇬🇧 English
│   │       ├── es.json        ← 🇪🇸 Español
│   │       ├── de.json        ← 🇩🇪 Deutsch
│   │       └── zh.json        ← 🇨🇳 中文
│   │
│   ├── layouts/           ← Layouts de mise en page
│   │   └── MainLayout.tsx     ← Shell principal (header, nav, footer, 487 lignes)
│   │
│   ├── pages/             ← 35 pages de l'application
│   │   ├── LoginPage.tsx          ← Connexion
│   │   ├── RegisterPage.tsx       ← Inscription (avec sélection de rôle)
│   │   ├── DashboardPage.tsx      ← Tableau de bord principal
│   │   ├── TasksPage.tsx          ← Liste/gestion des tâches
│   │   ├── TaskTimerPage.tsx      ← Chronomètre de tâche active
│   │   └── ... (30 autres pages)
│   │
│   ├── services/          ← 13 services (communication API)
│   │   ├── api.ts                 ← Client Axios (intercepteurs, retry, auth)
│   │   ├── auth.service.ts        ← Login/logout/register
│   │   ├── task.service.ts        ← CRUD tâches
│   │   ├── domicile.service.ts    ← CRUD domiciles
│   │   ├── invoice.service.ts     ← CRUD factures
│   │   ├── timeTracking.service.ts← Logs de temps
│   │   ├── budget.service.ts      ← Budget par domicile
│   │   ├── performance.service.ts ← Dashboard performance
│   │   ├── recurringTask.service.ts ← Tâches récurrentes
│   │   ├── smartEstimate.service.ts ← Estimation intelligente
│   │   ├── taskReview.service.ts  ← Avis sur tâches
│   │   ├── timerPersistence.service.ts ← Persistance timer (localStorage)
│   │   └── user.service.ts       ← Liste utilisateurs
│   │
│   ├── stores/            ← 3 stores Zustand (état global)
│   │   ├── authStore.ts       ← Utilisateur connecté, authentification
│   │   ├── taskStore.ts       ← Tâches + statistiques
│   │   └── domicileStore.ts   ← Domiciles
│   │
│   ├── types/             ← 12 fichiers de types TypeScript
│   │   ├── auth.ts, task.ts, domicile.ts, invoice.ts, ...
│   │   └── index.ts          ← Barrel re-export
│   │
│   ├── utils/             ← Fonctions utilitaires
│   │   ├── format.ts          ← formatCurrency, formatDate, formatDuration, ...
│   │   ├── notifications.ts   ← Toast notifications (success/error/info)
│   │   └── spellcheck.ts      ← API LanguageTool (correction orthographique)
│   │
│   ├── App.tsx            ← Routeur principal (BrowserRouter, toutes les routes)
│   ├── App.css            ← Styles globaux
│   ├── main.tsx           ← Point d'entrée React
│   └── index.css          ← Import Tailwind (base, components, utilities)
│
├── index.html             ← HTML racine (SPA)
├── vite.config.ts         ← Configuration Vite (base: /HomiByIsphers/)
├── tailwind.config.js     ← Palette, typographie, ombres, animations
├── tsconfig.json          ← Configuration TypeScript (strict mode)
├── eslint.config.js       ← Configuration ESLint
├── postcss.config.js      ← PostCSS (Tailwind + Autoprefixer)
├── vercel.json            ← Réécriture SPA Vercel
└── package.json           ← Dépendances npm
```

---

## 4. Explication fichier par fichier

### 4.1 Backend — Entités (`src/Entity/`)

#### `User.php` — Utilisateur
L'entité centrale du système. Chaque personne ayant un compte est un User.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` (auto) | Identifiant unique |
| `email` | `string` (unique) | Identifiant de connexion |
| `password` | `string` | Hash bcrypt/argon2 du mot de passe |
| `role` | `string` | `ROLE_ADMIN` ou `ROLE_USER` |
| `firstName`, `lastName` | `string` | Nom affiché dans l'interface |
| `isEmailVerified` | `bool` | Email vérifié via token |
| `emailVerificationToken` | `string?` | Token UUID envoyé par email |
| `emailVerificationTokenExpiresAt` | `DateTime?` | Expiration du token |
| `emailVerifiedAt` | `DateTime?` | Date de vérification |
| `createdAt`, `updatedAt` | `DateTime` | Horodatage (auto via lifecycle) |

**Relations** : Un User peut avoir N tâches assignées, N domiciles créés, N time logs, N factures, N notifications, 1 UserSettings.

**Lifecycle callbacks** : `@PrePersist` → set `createdAt`; `@PreUpdate` → set `updatedAt`.

#### `Domicile.php` — Propriété immobilière
Représente un bien immobilier géré par le propriétaire.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` | Identifiant |
| `name` | `string` | Nom du domicile (ex: "Appartement Paris 15e") |
| `address` | `string` | Adresse complète |
| `city` | `string?` | Ville |
| `postalCode` | `string?` | Code postal |
| `phone` | `string?` | Téléphone de contact |
| `notes` | `text?` | Notes libres |
| `createdBy` | `ManyToOne → User` | **Le propriétaire** qui a créé ce domicile |
| `createdAt`, `updatedAt` | `DateTime` | Horodatage auto |

**Relations** : Un Domicile a N tâches, N exécuteurs (via DomicileExecutor), N factures, N budgets mensuels, N templates récurrents.

#### `Task.php` — Tâche
Unité de travail assignée à un exécuteur dans un domicile.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` | Identifiant |
| `title` | `string` | Titre de la tâche |
| `description` | `text?` | Description détaillée |
| `status` | `string` | `TODO`, `IN_PROGRESS`, ou `COMPLETED` |
| `startTime` | `DateTime?` | Date/heure de début prévue |
| `endTime` | `DateTime?` | Date/heure de fin prévue |
| `actualStartTime` | `DateTime?` | Début réel (quand l'exécuteur démarre) |
| `actualEndTime` | `DateTime?` | Fin réelle (quand la tâche est terminée) |
| `assignedTo` | `ManyToOne → User` | L'exécuteur chargé de cette tâche |
| `domicile` | `ManyToOne → Domicile` | Le domicile concerné |

**Relations** : Une Task a N time logs, 1 review possible, N entrées d'historique.

#### `DomicileExecutor.php` — Affectation exécuteur ↔ domicile
Table de jonction avec données supplémentaires.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` | Identifiant |
| `domicile` | `ManyToOne → Domicile` | Le domicile |
| `executor` | `ManyToOne → User` | L'exécuteur affecté |
| `hourlyRate` | `decimal(10,2)` | **Taux horaire** de cet exécuteur pour ce domicile |

> **Pourquoi une entité et pas un ManyToMany ?** Parce que le `hourlyRate` est propre à chaque couple (domicile, exécuteur). Un même exécuteur peut avoir un taux différent selon le domicile.

#### `TaskTimeLog.php` — Log de temps de travail
Enregistre une période de travail sur une tâche.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` | Identifiant |
| `task` | `ManyToOne → Task` | Tâche concernée |
| `executor` | `ManyToOne → User` | Qui a travaillé |
| `startTime` | `DateTime` | Début du créneau |
| `endTime` | `DateTime` | Fin du créneau |
| `hoursWorked` | `decimal(10,2)` | **Calculé automatiquement** : `(endTime - startTime) / 3600` |
| `notes` | `text?` | Notes de l'exécuteur |
| `status` | `string` | `PENDING` → `APPROVED` ou `REJECTED` |
| `validatedBy` | `ManyToOne → User?` | L'admin qui a validé/rejeté |
| `validatedAt` | `DateTime?` | Date de validation |

**Lifecycle** : `@PrePersist` / `@PreUpdate` → recalcule `hoursWorked` automatiquement.

#### `Invoice.php` — Facture
Facture générée à partir des time logs approuvés.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `int` | Identifiant |
| `invoiceNumber` | `string` (unique) | Format `INV-YYYYMM-NNNN` (auto-généré) |
| `domicile` | `ManyToOne → Domicile` | Domicile facturé |
| `executor` | `ManyToOne → User` | Exécuteur facturé |
| `periodStart` | `DateTime` | Début de la période couverte |
| `periodEnd` | `DateTime` | Fin de la période |
| `totalHours` | `decimal(10,2)` | Total des heures approuvées |
| `hourlyRate` | `decimal(10,2)` | Taux horaire appliqué |
| `subtotal` | `decimal(10,2)` | `totalHours × hourlyRate` |
| `taxRate` | `decimal(5,2)` | Taux de TVA (ex: 21.00%) |
| `taxAmount` | `decimal(10,2)` | `subtotal × taxRate / 100` |
| `total` | `decimal(10,2)` | `subtotal + taxAmount` |
| `status` | `string` | `DRAFT` → `SENT` → `PAID` (ou `OVERDUE` / `CANCELLED`) |
| `dueDate` | `DateTime?` | Date d'échéance (auto: +30 jours) |
| `paidDate` | `DateTime?` | Date de paiement effectif |

**Calculs automatiques** : `@PrePersist` / `@PreUpdate` → recalcule `subtotal`, `taxAmount`, `total`.

#### `MonthlyBudget.php` — Budget mensuel par domicile
Permet au propriétaire de fixer un budget par domicile/mois.

| Champ | Type | Rôle |
|---|---|---|
| `domicile` | `ManyToOne → Domicile` | Domicile concerné |
| `year` | `int` | Année |
| `month` | `int` | Mois (1-12) |
| `budgetAmount` | `decimal(10,2)` | Montant budgété |

**Contrainte d'unicité** : `(domicile_id, year, month)` — un seul budget par domicile/mois.

#### `RecurringTaskTemplate.php` — Modèle de tâche récurrente
Définit un template pour générer automatiquement des tâches.

| Champ | Type | Rôle |
|---|---|---|
| `title`, `description` | `string` | Titre/description du template |
| `frequency` | `string` | `daily`, `weekly`, `biweekly`, `monthly` |
| `daysOfWeek` | `json?` | Jours de la semaine (ex: `[1, 3, 5]` pour Lun/Mer/Ven) |
| `startDate`, `endDate` | `DateTime` | Période d'activité du template |
| `isActive` | `bool` | Actif / inactif |
| `domicile` | `ManyToOne → Domicile` | Domicile cible |
| `assignedTo` | `ManyToOne → User` | Exécuteur par défaut |

**Méthode métier** : `shouldGenerateForDate(DateTime $date): bool` — détermine si une tâche doit être générée pour une date donnée, selon la fréquence et les jours configurés.

#### `TaskReview.php` — Avis sur une tâche terminée

| Champ | Type | Rôle |
|---|---|---|
| `task` | `OneToOne → Task` | La tâche évaluée |
| `reviewer` | `ManyToOne → User` | Le propriétaire qui évalue |
| `rating` | `int` | Note de 1 à 5 |
| `comment` | `text?` | Commentaire optionnel |

#### `TaskHistory.php` — Historique d'une tâche

| Champ | Type | Rôle |
|---|---|---|
| `task` | `ManyToOne → Task` | Tâche concernée |
| `user` | `ManyToOne → User` | Qui a effectué l'action |
| `action` | `TaskActionType` (enum) | CREATED, STARTED, COMPLETED, POSTPONED, REASSIGNED |
| `timestamp` | `DateTime` | Quand |

#### Entités secondaires

| Entité | Rôle |
|---|---|
| `Activity` | Journal d'activité de l'utilisateur |
| `Badge` | Badges/récompenses gamification |
| `Content` | Contenu administrable (CMS basique) |
| `Favorite` | Éléments mis en favoris |
| `LogEntry` | Logs système (admin) |
| `Notification` | Notifications in-app |
| `PendingEmail` | Queue d'emails en attente d'envoi |
| `RefreshToken` | Tokens de rafraîchissement JWT |
| `SupportMessage` | Messages de support/assistance |
| `UserSettings` | Paramètres utilisateur (thème, langue, 2FA, notifications) |

---

### 4.2 Backend — Contrôleurs (`src/Controller/`)

Chaque contrôleur est une classe PHP qui reçoit les requêtes HTTP, les valide, délègue au Service, et retourne une réponse JSON.

#### `AuthController.php` — Authentification (`/api/auth`)

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Crée un compte. Reçoit email, password, firstName, lastName, role. Valide via `RegisterRequest` DTO. Hash le mot de passe. Retourne le token JWT. |
| `/api/auth/login` | `POST` | Authentifie l'utilisateur. Vérifie email + password. Génère un JWT + refresh token. Retourne token + données utilisateur. |
| `/api/auth/logout` | `POST` | Déconnexion (invalidation côté client). |
| `/api/auth/me` | `GET` | Retourne les données de l'utilisateur connecté (décode le JWT). |
| `/api/auth/verify-email/{token}` | `GET` | Vérifie l'email via le token envoyé par mail. |
| `/api/auth/resend-verification` | `POST` | Renvoie l'email de vérification. |

#### `TaskController.php` — Gestion des tâches (`/api/tasks`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/tasks` | `GET` | ALL | Liste les tâches. **Admin** : toutes les tâches de ses domiciles. **Exécuteur** : seulement ses tâches assignées. Filtrage par status, domicile. |
| `/api/tasks/{id}` | `GET` | ALL | Détail d'une tâche. |
| `/api/tasks` | `POST` | ADMIN | Créer une tâche. Assigne un exécuteur, lie à un domicile. |
| `/api/tasks/{id}` | `PUT` | ADMIN | Modifier une tâche. Si l'exécuteur change → log REASSIGNED. |
| `/api/tasks/{id}` | `DELETE` | ADMIN | Supprimer une tâche. |
| `/api/tasks/{id}/start` | `PATCH` | ALL | L'exécuteur démarre la tâche → `actualStartTime = now()`, status = `IN_PROGRESS`. |
| `/api/tasks/{id}/complete` | `PATCH` | ALL | L'exécuteur termine → `actualEndTime = now()`, status = `COMPLETED`. |
| `/api/tasks/{id}/finish` | `POST` | ALL | Variante de complétion. |
| `/api/tasks/{id}/postpone` | `POST` | ALL | Remet la tâche en attente. |

#### `DomicileController.php` — Gestion des domiciles (`/api/domiciles`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/domiciles` | `GET` | ADMIN | Liste les domiciles de l'admin connecté (scopé par `createdBy`). |
| `/api/domiciles/{id}` | `GET` | ADMIN | Détail d'un domicile. |
| `/api/domiciles` | `POST` | ADMIN | Créer un domicile. |
| `/api/domiciles/{id}` | `PUT` | ADMIN | Modifier. |
| `/api/domiciles/{id}` | `DELETE` | ADMIN | Supprimer — **bloqué** si des tâches existent (prévention perte de données). |
| `/api/domiciles/my/list` | `GET` | ALL | Liste des domiciles auxquels l'utilisateur est affecté (comme exécuteur). |
| `/api/domiciles/{id}/executors` | `POST` | ADMIN | Ajouter un exécuteur au domicile (avec taux horaire). |
| `/api/domiciles/{id}/executors` | `GET` | ADMIN | Lister les exécuteurs d'un domicile. |
| `/api/domiciles/{id}/executors/{executorId}` | `DELETE` | ADMIN | Retirer un exécuteur. |

#### `TimeTrackingController.php` — Suivi du temps (`/api/time-logs`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/time-logs` | `POST` | USER | Soumettre un log de temps (start/end/notes). Calcul auto des heures. Status = PENDING. |
| `/api/time-logs` | `GET` | USER | Mes logs de temps (filtrable par status). |
| `/api/time-logs/{id}` | `GET` | OWN/ADMIN | Détail d'un log. |
| `/api/time-logs/{id}` | `PATCH` | OWN | Modifier un log (seulement si PENDING). |
| `/api/time-logs/{id}` | `DELETE` | OWN | Supprimer (seulement si PENDING). |
| `/api/time-logs/{id}/approve` | `PATCH` | ADMIN | Approuver → status = APPROVED, validatedBy = admin. |
| `/api/time-logs/{id}/reject` | `PATCH` | ADMIN | Rejeter → status = REJECTED, validatedBy = admin. |
| `/api/time-logs/stats/executor` | `GET` | USER | Statistiques personnelles (heures totales, taux approbation). |
| `/api/time-logs/admin/pending` | `GET` | ADMIN | Liste des logs en attente de validation. |
| `/api/time-logs/admin/stats` | `GET` | ADMIN | Statistiques globales (heures par exécuteur, pendantes/approuvées/rejetées). |

#### `InvoiceController.php` — Facturation (`/api/invoices`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/invoices` | `POST` | ADMIN | **Génère une facture** à partir des time logs approuvés d'une période. Calcule automatiquement : totalHours, subtotal, taxes, total. Numérotation auto `INV-YYYYMM-NNNN`. |
| `/api/invoices` | `GET` | ALL | Liste des factures (admin: toutes, exécuteur: les siennes). Filtrable par status. |
| `/api/invoices/{id}` | `GET` | OWN/ADMIN | Détail d'une facture. |
| `/api/invoices/{id}` | `PATCH` | ADMIN | Modifier (si DRAFT ou SENT). |
| `/api/invoices/{id}/send` | `PATCH` | ADMIN | Marquer comme envoyée → status = SENT. |
| `/api/invoices/{id}/pay` | `PATCH` | ADMIN | Marquer comme payée → status = PAID, paidDate = now(). |
| `/api/invoices/{id}/cancel` | `PATCH` | ADMIN | Annuler → status = CANCELLED. |
| `/api/invoices/{id}` | `DELETE` | ADMIN | Supprimer (seulement si DRAFT). |
| `/api/invoices/stats/all` | `GET` | ADMIN | Statistiques par status (nombre + montants). |
| `/api/invoices/stats/totals` | `GET` | ADMIN | Totaux : facturé / payé / en attente / en retard. |
| `/api/invoices/overdue` | `GET` | ADMIN | Factures en retard de paiement. |

#### `BudgetController.php` — Budgets (`/api/budgets`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/budgets/overview` | `GET` | ADMIN | Vue d'ensemble budgétaire par domicile/mois. Utilise du **SQL brut** pour calculer coûts réels vs budget prévu, avec projections mensuelles. |
| `/api/budgets/today` | `GET` | ADMIN | Coût du jour en cours. SQL brut pour les heures travaillées aujourd'hui × taux horaires. |
| `/api/budgets` | `POST` | ADMIN | Définir/modifier le budget d'un domicile pour un mois. |

#### `RecurringTaskController.php` — Tâches récurrentes (`/api/recurring-tasks`)

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/recurring-tasks` | `GET` | ADMIN | Lister les templates des domiciles de l'admin. |
| `/api/recurring-tasks` | `POST` | ADMIN | Créer un template récurrent. |
| `/api/recurring-tasks/{id}` | `PUT` | ADMIN | Modifier un template. |
| `/api/recurring-tasks/{id}` | `DELETE` | ADMIN | Supprimer un template. |
| `/api/recurring-tasks/{id}/toggle` | `PATCH` | ADMIN | Activer/désactiver un template. |
| `/api/recurring-tasks/generate` | `POST` | ADMIN | **Générer les tâches** pour une date donnée. Évalue `shouldGenerateForDate()` sur chaque template actif. |

#### `PerformanceController.php` & `SmartEstimateController.php`

| Endpoint | Méthode | Accès | Description |
|---|---|---|---|
| `/api/performance` | `GET` | USER | Dashboard de performance : nombre de tâches, vitesse, activité hebdomadaire, taux de ponctualité, note moyenne, streak, répartition par domicile. **SQL brut** avec calculs complexes. |
| `/api/smart-estimate` | `GET` | USER | Estimation intelligente de durée d'une tâche basée sur l'historique (domicile + exécuteur + tâches similaires). |
| `/api/smart-estimate/check-overrun` | `GET` | USER | Vérifie si le temps en cours dépasse l'estimation. |

#### Autres contrôleurs

| Contrôleur | Endpoints | Rôle |
|---|---|---|
| `UserController` | CRUD `/api/users` | Gestion des utilisateurs (admin: liste/supprime) |
| `ActivityController` | `GET /api/activity` | Journal d'activité |
| `BadgesController` | `GET /api/badges` | Badges/récompenses |
| `ContentController` | CRUD `/api/admin/content` | CMS basique (admin) |
| `NotificationController` | CRUD `/api/notifications` | Notifications in-app + marquer lu |
| `SearchController` | `GET /api/search` | Recherche globale (tâches/users/domiciles) scopée par rôle |
| `SettingsController` | `GET/PUT /api/settings` | Paramètres utilisateur (thème, langue, 2FA) |
| `SupportController` | CRUD `/api/support` | Tickets de support |
| `TaskHistoryController` | `GET /api/task-history/{id}` | Historique d'actions d'une tâche |
| `TaskReviewController` | CRUD `/api/reviews` | Avis/notes sur les tâches |
| `TwoFAController` | `/api/2fa` | Activation/désactivation 2FA |
| `ExportController` | `/api/export` | Export des données personnelles (JSON) |
| `HealthController` | `/api/health` | Health check (teste DB) |
| `InternalCronController` | `/internal/run-email-cron` | Trigger HTTP pour envoyer les emails en attente |

---

### 4.3 Backend — Services (`src/Service/`)

Les services contiennent la **logique métier**. Ils sont injectés dans les contrôleurs via l'autowiring Symfony.

#### `TaskService.php`

```
Méthodes principales :
├── createTask(CreateTaskRequest, User)     → Crée la tâche + log CREATED
├── updateTask(id, UpdateTaskRequest, User) → Modifie + log REASSIGNED si exécuteur change
├── finishTask(id, User)                    → Status COMPLETED + log COMPLETED
├── postponeTask(id, User)                  → Status reporte + log POSTPONED
├── reassignTask(id, newUserId)             → Change l'exécuteur
└── listTasks(User, filters)                → Pagination + filtres (admin/exécuteur scopé)
```

#### `InvoiceService.php`

```
Méthodes principales :
├── generateInvoice(domicile, executor, periodStart, periodEnd)
│   → Somme les time logs APPROVED de la période
│   → Calcule : totalHours × hourlyRate = subtotal
│   → Applique : taxRate → taxAmount + total
│   → Auto-génère : INV-YYYYMM-NNNN
│   → DueDate = +30 jours
│
├── sendInvoice(invoice)    → Status SENT
├── markAsPaid(invoice)     → Status PAID + paidDate
├── cancelInvoice(invoice)  → Status CANCELLED
├── updateOverdueInvoices() → Batch : SENT + dépassé → OVERDUE
├── getTotalsByStatus()     → Agrégation par status (count + sum)
├── getTotalsSummary()      → Grands totaux : facturé/payé/en attente/en retard
├── canView(invoice, user)  → Admin ou exécuteur concerné
├── canModify(invoice)      → Seulement DRAFT ou SENT
└── deleteInvoice(invoice)  → Seulement DRAFT
```

#### `TimeTrackingService.php`

```
Méthodes principales :
├── createTimeLog(data, executor)  → Status PENDING, calcul auto des heures
├── updateTimeLog(log, data)       → Seulement si PENDING
├── approveTimeLog(log, admin)     → Status APPROVED + validatedBy
├── rejectTimeLog(log, admin)      → Status REJECTED + validatedBy
├── calculateTotalHours(task)      → Somme heures approuvées d'une tâche
├── getExecutorLogs(executor)      → Filtrage par exécuteur
├── getAdminStats()                → Stats globales (heures, pending/approved/rejected)
├── canModify(log, user)           → PENDING + propriétaire du log
└── canView(log, user)             → Admin ou propriétaire
```

#### `DomicileService.php`

```
Méthodes principales :
├── CRUD complet avec vérification de propriété (createdBy)
├── addExecutor(domicile, userId, hourlyRate)   → Crée DomicileExecutor
├── removeExecutor(domicile, executorId)        → Supprime junction
└── deleteDomicile  → BLOQUE si des tâches existent (prévention perte de données)
```

#### `MailjetService.php`

```
→ Envoie des emails via l'API Mailjet v3.1
→ Configuration : MAILJET_API_KEY, MAILJET_SECRET_KEY, MAILJET_SENDER_EMAIL
→ Appel API brut (pas Symfony Mailer) — contrôle total
```

#### `EmailQueue.php`

```
→ Queue en mémoire (tableau de closures/emails)
→ Alimentée pendant le cycle de vie de la requête
→ Consommée par TerminateListener APRÈS l'envoi de la réponse HTTP
→ Persistée en base (PendingEmail)
→ Envoi réel par la commande CLI app:send-pending-emails (cron)
  ou par InternalCronController (trigger HTTP)
```

#### `RefreshTokenService.php`

```
├── generate(User)            → Crée un token random (128 hex), TTL = 7 jours
├── validate(tokenString)     → Lookup + vérification expiration
└── invalidateUserTokens(User) → Supprime tous les refresh tokens d'un user
```

#### `UserService.php` & `TaskHistoryService.php`

```
UserService   → CRUD utilisateurs, hashing mot de passe, authentification
TaskHistory   → log(Task, User, ActionType) / getTaskHistory(taskId)
```

---

### 4.4 Backend — Sécurité (`src/Security/`)

#### `JwtAuthenticator.php`
Classe qui intercepte chaque requête API et vérifie le JWT.

```php
// Logique simplifiée :
1. supports(Request) → Vérifie si l'URL commence par /api/ 
   et n'est PAS /api/auth/* et a un header Authorization
   
2. authenticate(Request) →
   a. Extrait le token du header "Authorization: Bearer xxx"
   b. Appelle JwtTokenProvider::validate(token)
   c. Extrait le claim user_id
   d. Charge le User depuis la base
   e. Retourne un Passport authentifié
   
3. onAuthenticationFailure() → Retourne JSON {"error": "..."} avec status 401
```

#### `JwtTokenProvider.php`
Crée et valide les JWT.

```php
// Création (lors du login) :
→ Algorithme : HMAC SHA256
→ Secret : APP_SECRET (variable d'environnement)
→ Claims : user_id, email, role
→ Expiration : configurable via JWT_EXPIRATION env var

// Validation (à chaque requête) :
→ Vérifie la signature (HMAC SHA256)
→ Vérifie l'expiration (LooseValidAt)
→ Retourne les claims si valide
```

---

### 4.5 Backend — Event Listeners (`src/EventListener/`)

#### `CorsListener.php`
Gère les requêtes Cross-Origin (CORS). Priorité haute.

```
→ Requêtes OPTIONS (preflight) : Retourne 204 avec les headers CORS
→ Toutes les autres requêtes /api/* : Ajoute les headers CORS à la réponse
→ Headers : Access-Control-Allow-Origin, Allow-Methods, Allow-Headers, Allow-Credentials
```

#### `ExceptionListener.php`
Convertit les exceptions PHP en réponses JSON pour les routes `/api/*`.

```
→ En développement : message + trace complète
→ En production : message générique (masque les détails internes)
→ Status HTTP adapté selon le type d'exception
```

#### `TerminateListener.php`
S'exécute **après** l'envoi de la réponse HTTP (événement `kernel.terminate`).

```
→ Drain la EmailQueue en mémoire
→ Persiste chaque email comme PendingEmail en base de données
→ L'envoi réel se fait ensuite via la commande cron
→ Avantage : ne ralentit jamais la réponse HTTP
```

---

### 4.6 Backend — DTOs (`src/DTO/`)

| DTO | Champs | Validation |
|---|---|---|
| `LoginRequest` | `email`, `password` | `@Email`, `@NotBlank` |
| `RegisterRequest` | `email`, `password`, `firstName`, `lastName`, `role` | `@Email`, min 8 chars password, `@NotBlank`, max 100 names |
| `AuthResponse` | `token`, `expiresIn`, `userId`, `email`, `role`, `firstName`, `lastName` | — (output) |
| `CreateTaskRequest` | `title`, `description`, `status`, `userId` | `@NotBlank`, min 3 title |
| `UpdateTaskRequest` | `title`, `description`, `status` | Tous optionnels |

> Les DTOs assurent que les données entrantes sont **validées avant** d'atteindre la logique métier. Symfony Validator + annotations PHP 8.

---

### 4.7 Frontend — Services (`src/services/`)

#### `api.ts` — Client HTTP central

```typescript
// Configuration :
→ Axios instance avec baseURL = VITE_API_BASE_URL
→ Timeout : 60 secondes

// Intercepteur de requête :
→ Récupère le token depuis localStorage
→ Ajoute le header "Authorization: Bearer {token}"

// Intercepteur de réponse :
→ Retry automatique : 2 tentatives pour erreurs réseau/timeout/5xx
→ Sur erreur 401 : supprime le token + redirige vers /login
→ Gestion centralisée des erreurs
```

#### `auth.service.ts` — Authentification

```typescript
login(email, password)
→ POST /api/auth/login
→ Reçoit {token, user}
→ Stocke dans localStorage : token + user
→ Configure le header Axios pour les requêtes suivantes

logout()
→ POST /api/auth/logout
→ Nettoie localStorage
→ Redirige vers /login

register(email, password, firstName, lastName, role)
→ POST /api/auth/register

isAuthenticated()
→ Vérifie : token existe + non expiré (decode JWT côté client)
```

#### `timerPersistence.service.ts` — Persistance du chronomètre

Ce service **n'appelle aucune API**. Il utilise uniquement `localStorage` pour persister l'état du chronomètre actif, garantissant que le timer survit à une fermeture de page ou un changement de route.

```typescript
Clé localStorage : "homi_active_timer"

Fonctions :
├── startPersistedTimer(taskId)      → Sauvegarde début du timer
├── tickPersistedTimer()             → Met à jour le temps écoulé
├── pausePersistedTimer()            → Met en pause
├── resumePersistedTimer()           → Reprend
├── freezePersistedTimer()           → Gèle (avant fermeture)
├── clearPersistedTimer()            → Supprime le timer
├── getPersistedTimer()              → Lit l'état courant
├── hasActiveTimer()                 → Vérifie si un timer est actif
├── getActiveTimerTaskId()           → Retourne l'ID de la tâche en cours
├── computeElapsedSeconds()          → Calcule le temps écoulé depuis le début
└── restorePersistedTimerFromServer() → Restaure l'état après reconnexion
```

#### `spellcheck.ts` — Correction orthographique

```typescript
→ Appelle l'API LanguageTool (https://api.languagetool.org/v2/check)
→ Détecte les erreurs d'orthographe ET de grammaire
→ Supporte : FR, EN, ES, DE, NL, PT, IT, PL, ZH
→ Cache des résultats (TTL: 1 minute) pour éviter les appels redondants
→ Rate limiting : 1.5s minimum entre les requêtes
→ Utilise la distance de Levenshtein pour classer les suggestions
```

---

### 4.8 Frontend — Stores Zustand (`src/stores/`)

#### `authStore.ts` — État d'authentification

```typescript
État :
├── user: User | null          // Utilisateur connecté
├── isAuthenticated: boolean   // Connecté ou non
├── isLoading: boolean         // Chargement en cours
└── error: string | null       // Message d'erreur

Actions :
├── login(email, password)     → Appelle authService.login + stocke user
├── register(...)              → Appelle authService.register
├── logout()                   → Nettoie tout (token, user, timer)
├── setUser(user)              → Met à jour l'utilisateur
└── clearError()               → Efface l'erreur

Middleware : persist (Zustand)
→ Persiste user + isAuthenticated dans localStorage (clé: "auth-storage")
→ Restaure automatiquement au chargement de l'application
```

#### `taskStore.ts` — État des tâches

```typescript
État :
├── tasks: Task[]              // Toutes les tâches chargées
├── stats: TaskStats | null    // Statistiques calculées côté client
├── isLoading: boolean
└── error: string | null

Actions :
├── fetchTasks()               → GET /api/tasks → stocke + recalcule stats
├── createTask(form)           → POST /api/tasks + refresh liste
├── startTask(id)              → PATCH /api/tasks/{id}/start
├── completeTask(id)           → PATCH /api/tasks/{id}/complete
├── updateTask(id, form)       → PUT /api/tasks/{id}
└── deleteTask(id)             → DELETE /api/tasks/{id}

Stats calculées (computeStats) :
→ totalTasks, completedTasks, pendingTasks, inProgressTasks
→ Calcul local depuis le tableau tasks (pas d'appel API séparé)
```

#### `domicileStore.ts` — État des domiciles

```typescript
État :
├── domiciles: Domicile[]
├── isLoading: boolean
└── error: string | null

Actions :
├── fetchDomiciles()           → GET /api/domiciles
├── createDomicile(form)       → POST /api/domiciles
└── deleteDomicile(id)         → DELETE /api/domiciles/{id}
```

---

### 4.9 Frontend — Pages (`src/pages/`)

#### Pages publiques (sans authentification)

| Page | Route | Fonctionnalité |
|---|---|---|
| `LoginPage` | `/login` | Formulaire email/password. Appelle `authStore.login()`. Redirige vers `/dashboard` si succès. |
| `RegisterPage` | `/register` | Formulaire d'inscription avec sélection de rôle (Admin/Exécuteur). Appelle `authStore.register()`. |
| `VerifyEmailPage` | `/verify-email/:token` | Appelle `GET /api/auth/verify-email/{token}`. Affiche succès/erreur. |
| `ResendVerificationPage` | `/resend-verification` | Formulaire email pour renvoyer le lien de vérification. |

#### Pages privées (utilisateur connecté)

| Page | Route | Fonctionnalité |
|---|---|---|
| `DashboardPage` | `/dashboard` | Tableau de bord : StatsCards (tâches total/en cours/terminées/en attente), liste des tâches récentes, actions rapides. Utilise `PageWrapper`, `StatsGrid`, `StatsCard`, `StatusDot`, `EmptyState`. |
| `TasksPage` | `/tasks` | Liste complète des tâches avec filtres. Boutons démarrer/terminer. Possibilité de laisser un avis (TaskReview). |
| `TaskTimerPage` | `/tasks/:taskId/timer` | **Chronomètre actif** pour une tâche. Affiche le temps écoulé en temps réel. Persiste via `timerPersistence.service`. Utilise `SmartEstimate` pour estimer la durée. À la fin, soumet automatiquement un TimeLog. |
| `MyTimeLogsPage` | `/my-time-logs` | Mes logs de temps avec statistiques (heures totales, taux d'approbation). |
| `ManualTimeLogPage` | `/my-time-logs/manual` | Saisie manuelle d'un log de temps (date début/fin + notes). |
| `MyInvoicesPage` | `/my-invoices` | Mes factures en tant qu'exécuteur. |
| `ProfilePage` | `/profile` | Voir/modifier profil (nom, prénom), changer mot de passe. |
| `NotificationsPage` | `/notifications` | Liste des notifications, marquer comme lu. |
| `PerformancePage` | `/performance` | Dashboard de performance : graphiques, métriques, streak. |
| `SettingsPage` | `/settings` | Paramètres : thème, langue, notifications. |
| `SearchPage` | `/search` | Recherche globale (tâches, utilisateurs, domiciles). |
| `BadgesPage` | `/badges` | Badges de récompense / gamification. |
| `OnboardingPage` | `/onboarding` | Wizard d'accueil pour les nouveaux utilisateurs. |
| `SupportPage` | `/support` | Créer/voir des tickets de support. |
| `FavoritesPage` | `/favorites` | Éléments mis en favoris. |
| `ActivityPage` | `/activity` | Journal d'activité personnel. |
| `ExportDataPage` | `/export` | Exporter ses données personnelles (RGPD). |
| `TwoFAPage` | `/twofa` | Activer/désactiver l'authentification 2 facteurs. |

#### Pages admin (ROLE_ADMIN uniquement)

| Page | Route | Fonctionnalité |
|---|---|---|
| `CreateTaskPage` | `/create-task` | Formulaire de création de tâche : titre, description, domicile, exécuteur, dates. Spell-check intégré. |
| `CreateDomicilePage` | `/create-domicile` | Formulaire de création de domicile. |
| `DomicilesPage` | `/domiciles` | Liste/gestion des domiciles. |
| `AdminUsersPage` | `/admin/users` | Gestion des utilisateurs (liste, modification, suppression). |
| `AdminTimeLogsPage` | `/admin/time-logs` | **Validation des temps** : approuver ou rejeter les logs soumis. |
| `AdminInvoicesPage` | `/admin/invoices` | Gestion des factures : voir, envoyer, marquer payé, annuler. Statistiques. |
| `CreateInvoicePage` | `/admin/invoices/create` | Formulaire de création de facture (sélection domicile, exécuteur, période). |
| `RecurringTasksPage` | `/recurring-tasks` | Gestion des templates de tâches récurrentes. Génération manuelle. |
| `BudgetPage` | `/budgets` | Gestion du budget par domicile/mois. Vue d'ensemble + coût du jour. |
| `AdminLogsPage` | `/admin/logs` | Logs système. |
| `AdminContentPage` | `/admin/content` | CMS basique pour le contenu de l'application. |
| `AdminStatsPage` | `/admin/stats` | Statistiques globales (users, tâches, domiciles, factures). |

---

### 4.10 Frontend — Composants partagés (`src/components/`)

#### `common/`

| Composant | Props clés | Description |
|---|---|---|
| `Button` | `variant`, `size`, `isLoading`, `fullWidth` | Bouton universel. Variants : primary (bleu), secondary (gris), success (vert), danger (rouge), outline. Affiche un spinner si `isLoading`. |
| `Card` | `gradient`, `hover`, `padding` | Conteneur carte. Peut avoir un gradient de fond et un effet hover. |
| `Input` | `label`, `error`, `helperText` | Champ texte stylisé avec label, message d'erreur, et texte d'aide. |
| `PasswordInput` | Hérite de `Input` | Champ mot de passe avec bouton œil pour montrer/cacher. |
| `LoadingSpinner` | `size` (sm/md/lg) | Spinner SVG animé pour les états de chargement. |
| `LanguageSwitcher` | — | Dropdown pour changer la langue. Affiche les drapeaux des 5 langues. |
| `SpellCheckInput` | Hérite de `Input` | Input avec vérification orthographique en temps réel (LanguageTool API). Souligne les erreurs, propose des corrections. |
| `SpellCheckTextarea` | Hérite de `textarea` | Textarea avec les mêmes capacités de spell-check. |

#### `data-display/`

| Composant | Props clés | Description |
|---|---|---|
| `StatsCard` | `label`, `value`, `icon`, `subtitle`, `gradient` | Carte de statistique avec gradient. Utilisée dans le dashboard pour afficher les compteurs. |
| `StatsGrid` | `columns`, `children` | Grille responsive pour disposer les StatsCards (2/3/4 colonnes selon l'écran). |

#### `feedback/`

| Composant | Props clés | Description |
|---|---|---|
| `EmptyState` | `icon`, `title`, `description`, `action` | Placeholder quand une liste est vide. Icône + texte + bouton d'action optionnel. |
| `ErrorAlert` | `message`, `onDismiss` | Bannière d'erreur rouge avec bouton de fermeture. |
| `StatusBadge` | `status`, `type` | Badge coloré pour les status (task: TODO/IN_PROGRESS/COMPLETED, invoice: DRAFT/SENT/PAID/OVERDUE/CANCELLED, timeLog: PENDING/APPROVED/REJECTED). |
| `StatusDot` | `status` | Point coloré correspondant au status (vert/jaune/rouge/gris). |

#### `layout/`

| Composant | Props clés | Description |
|---|---|---|
| `PageWrapper` | `title`, `isLoading`, `error` | Encapsule `MainLayout` + spinner de chargement + ErrorAlert. Élimine le code boilerplate répété dans chaque page. |

#### Composants racine

| Composant | Description |
|---|---|
| `ProtectedRoute` | 3 guards de route : `PrivateRoute` (vérifie auth + redirige vers timer actif), `PublicRoute` (redirige vers dashboard si connecté), `AdminRoute` (vérifie ROLE_ADMIN) |
| `ErrorBoundary` | Error boundary React (class component). Capture les erreurs non gérées, affiche un écran de fallback avec bouton "réessayer" et "retour accueil". |

---

### 4.11 Frontend — Hooks personnalisés (`src/hooks/`)

| Hook | Paramètres | Retour | Description |
|---|---|---|---|
| `useAsyncData<T>` | `fetchFn`, options (`immediate`, `initialData`, `deps`, `onSuccess`, `onError`) | `{ data, isLoading, error, refetch, setData }` | Hook générique pour les appels API asynchrones. Remplace le pattern loading/error/useEffect répété dans chaque page. |
| `useSpellCheck` | `text`, `lang` | `{ corrections, isChecking, check(), correctAll(), correctOne(), dismiss() }` | Vérification orthographique temps réel. Appelle LanguageTool API avec debounce. Retourne les erreurs et les suggestions de correction. |
| `useDarkMode` | — | `{ isDarkMode, toggle() }` | Détecte la préférence système (prefers-color-scheme), ajoute/retire la classe `.dark` sur le HTML. Persiste en localStorage. |
| `useSessionTimeout` | `timeout`, `onTimeout` | — | Décompte d'inactivité. Reset sur mousemove/keydown. Appelle `onTimeout` quand le temps est écoulé. |
| `useNetworkStatus` | `onOnline`, `onOffline` | — | Écoute les événements `online`/`offline` du navigateur. |
| `useDocumentVisibility` | `onVisible`, `onHidden` | — | Écoute `visibilitychange`. Utile pour arrêter des timers quand l'onglet est caché. |
| `useKeyboardShortcuts` | `shortcuts: Record<string, handler>` | — | Enregistre des raccourcis clavier globaux. |
| `usePageTitle` | `title: string` | — | Met à jour `document.title` avec format "Title \| Homi". |
| `useResponsive` | — | — | Ajoute `data-width` attribute au body pour les media queries CSS. |
| `useAccessibility` | — | — | Configure `tabindex` et `aria-label` sur le body. |
| `useErrorBoundary` | — | — | Écouteur global `window.onerror` pour capturer les erreurs non gérées. |

---

### 4.12 Frontend — Types TypeScript (`src/types/`)

Le système de types est organisé par domaine métier. Chaque fichier définit les interfaces et types d'un domaine précis.

| Fichier | Types définis | Utilisation |
|---|---|---|
| `auth.ts` | `UserRole` (`ROLE_USER` \| `ROLE_ADMIN`), `UserRoles` (enum objet), `User`, `LoginCredentials`, `AuthResponse` | Stores, services auth, guards de route |
| `task.ts` | `TaskStatus` (`TODO`/`IN_PROGRESS`/`COMPLETED`), `Task`, `TaskStats`, `CreateTaskForm`, `UpdateTaskForm` | Pages tâches, store tâches |
| `domicile.ts` | `Domicile`, `CreateDomicileForm` | Pages domiciles, store domiciles |
| `invoice.ts` | `InvoiceStatus` (5 statuts), `Invoice`, `InvoiceStats`, `CreateInvoiceForm` | Pages factures |
| `timeTracking.ts` | `TimeLogStatus`, `TimeLog`, `AdminTimeLogStats`, `PersistedTimer` | Pages time logs, timer |
| `budget.ts` | `BudgetOverview`, `DomicileBudget`, `TodayCost`, `MonthlyBudgetData` | Page budget |
| `performance.ts` | `PerformanceData` (tasks, speed, onTimeRate, rating, streak, weeklyActivity, domicileBreakdown) | Page performance |
| `recurringTask.ts` | `RecurringTaskTemplate`, `CreateRecurringTaskForm` | Page tâches récurrentes |
| `smartEstimate.ts` | `SmartEstimateResult`, `OverrunCheck` | Page timer |
| `taskReview.ts` | `TaskReviewData`, `ExecutorReviewStats` | Page tâches (avis) |
| `api.ts` | `ApiResponse<T>`, `ApiError` | Services, hooks |
| `index.ts` | Barrel re-export de tous les fichiers | Import centralisé |

---

### 4.13 Frontend — Configuration

#### `vite.config.ts`
```
→ Base path : /HomiByIsphers/ (pour GitHub Pages)
→ Plugin : @vitejs/plugin-react
→ URL API via .env : VITE_API_BASE_URL
```

#### `tailwind.config.js` (162 lignes)
```
→ Dark mode : stratégie par classe (.dark)
→ Palette custom : primary (bleu), success (vert), surface (gris neutre)
→ Typographie : Inter + system fallbacks
→ Ombres custom : xs/soft/card/elevated/float/overlay/glow
→ Animations : fade-in, scale-in, slide-in, shimmer, pulse-subtle
→ Grille 8pt (spacing system)
→ Transitions : smooth, bounce-sm
```

#### `tsconfig.app.json`
```
→ Target : ES2022
→ Module : ESNext
→ JSX : react-jsx
→ Strict mode activé
→ noUnusedLocals, noUnusedParameters
```

---

## 5. Fonctions critiques

### 5.1 Flux d'authentification JWT (critique #1)

C'est le mécanisme qui sécurise **toute l'application**. Sans lui, aucune API ne fonctionne.

```
INSCRIPTION :
1. Frontend : RegisterPage → authStore.register() → POST /api/auth/register
2. Backend  : RegisterRequest DTO valide les champs
3. Backend  : UserService.createUser() hash le mot de passe (bcrypt)
4. Backend  : Persiste User + génère emailVerificationToken
5. Backend  : EmailQueue.add(verification email)
6. Backend  : Retourne le JWT directement

CONNEXION :
1. Frontend : LoginPage → authStore.login() → POST /api/auth/login
2. Backend  : UserService.authenticate(email, password) vérifie credentials
3. Backend  : JwtTokenProvider.generate(user) crée le JWT :
   - Header : {"alg": "HS256"}
   - Payload : {"user_id": 42, "email": "...", "role": "ROLE_ADMIN", "exp": ...}
   - Signature : HMAC-SHA256(header.payload, APP_SECRET)
4. Backend  : RefreshTokenService.generate(user) crée un refresh token
5. Backend  : Retourne {token, expiresIn, userId, email, role, firstName, lastName}
6. Frontend : Stocke token + user dans localStorage
7. Frontend : Configure l'intercepteur Axios pour les requêtes suivantes

REQUÊTE AUTHENTIFIÉE :
1. Frontend : api.get('/tasks') → intercepteur ajoute "Authorization: Bearer <token>"
2. Backend  : JwtAuthenticator.supports() → détecte le header Bearer
3. Backend  : JwtAuthenticator.authenticate() →
   a. Extrait le token du header
   b. JwtTokenProvider.validate() vérifie signature + expiration
   c. Extrait user_id du payload
   d. UserRepository.find(user_id) charge l'User
   e. Crée un SelfValidatingPassport authentifié
4. Backend  : Le contrôleur s'exécute avec l'utilisateur injecté
5. Backend  : Retourne la réponse JSON
```

### 5.2 Cycle de vie d'une tâche (critique #2)

C'est le cœur métier de l'application — la raison d'être de Homi.

```
CRÉATION (Admin) :
1. CreateTaskPage → taskStore.createTask()
2. POST /api/tasks {title, description, domicileId, assignedToId, startTime, endTime}
3. TaskService.createTask() :
   a. Valide CreateTaskRequest DTO
   b. Crée Task avec status = TODO
   c. TaskHistoryService.log(CREATED)
   d. Persiste en base
4. La tâche apparaît dans le dashboard de l'exécuteur assigné

DÉMARRAGE (Exécuteur) :
5. TasksPage → "Démarrer" → taskStore.startTask(id)
6. PATCH /api/tasks/{id}/start
7. TaskController :
   a. task.status = IN_PROGRESS
   b. task.actualStartTime = new DateTime()
   c. TaskHistoryService.log(STARTED)
8. Frontend : redirige vers TaskTimerPage

TIMER (Exécuteur) :
9.  TaskTimerPage charge → timerPersistence.startPersistedTimer(taskId)
10. Timer tourne en temps réel (setInterval 1s)
11. Chaque tick : timerPersistence.tickPersistedTimer()
12. SmartEstimate vérifie si le temps dépasse l'estimation
13. Si fermeture de page : timer persiste dans localStorage
14. Si reconnexion : PrivateRoute détecte le timer → redirige vers TimerPage

COMPLÉTION (Exécuteur) :
15. "Terminer" → taskStore.completeTask(id) → PATCH /api/tasks/{id}/complete
16. TaskController :
    a. task.status = COMPLETED
    b. task.actualEndTime = new DateTime()
    c. TaskHistoryService.log(COMPLETED)
17. TaskTimerPage soumet automatiquement un TimeLog :
    → POST /api/time-logs {taskId, startTime, endTime, notes}
    → TimeTrackingService.createTimeLog() calcule hoursWorked auto
    → Status = PENDING (en attente de validation admin)
18. timerPersistence.clearPersistedTimer()
```

### 5.3 Pipeline de facturation (critique #3)

Le flux complet depuis le travail jusqu'au paiement.

```
ÉTAPE 1 — SOUMISSION DU TEMPS
- L'exécuteur termine une tâche → TimeLog créé (PENDING)
- Ou : saisie manuelle via ManualTimeLogPage

ÉTAPE 2 — VALIDATION (Admin)
- AdminTimeLogsPage → Admin voit les logs PENDING
- "Approuver" → PATCH /api/time-logs/{id}/approve → APPROVED
- "Rejeter"  → PATCH /api/time-logs/{id}/reject  → REJECTED

ÉTAPE 3 — GÉNÉRATION DE FACTURE (Admin)
- CreateInvoicePage → sélectionne domicile, exécuteur, période
- POST /api/invoices :
  1. InvoiceService.generateInvoice() :
     a. Récupère les time logs APPROVED de la période
     b. Somme les heures : totalHours = Σ hoursWorked
     c. Récupère hourlyRate depuis DomicileExecutor (taux horaire)
     d. Calcule : subtotal = totalHours × hourlyRate
     e. Calcule : taxAmount = subtotal × taxRate / 100
     f. Calcule : total = subtotal + taxAmount
     g. Génère le numéro : INV-YYYYMM-NNNN (séquentiel)
     h. DueDate = +30 jours
  2. Status = DRAFT

ÉTAPE 4 — ENVOI
- "Envoyer" → PATCH /api/invoices/{id}/send → Status = SENT

ÉTAPE 5 — PAIEMENT
- "Marquer payé" → PATCH /api/invoices/{id}/pay
  → Status = PAID, paidDate = now()

ÉTAPE 5bis — RETARD
- InvoiceService.updateOverdueInvoices() (batch)
  → Factures SENT dont dueDate < now() → Status = OVERDUE
```

### 5.4 Système de correction orthographique (critique #4)

Fonctionnalité innovante intégrée dans tous les formulaires de saisie de texte.

```
Architecture :
SpellCheckInput/Textarea (composant)
  → useSpellCheck (hook)
    → spellcheck.ts (utilitaire)
      → API LanguageTool externe (https://api.languagetool.org/v2/check)

Flux :
1. L'utilisateur tape du texte
2. Debounce (1.5s) → spellCheckAsync(text, lang)
3. Requête POST → LanguageTool API
4. Réponse : liste d'erreurs avec position, message, suggestions
5. Le hook met à jour les corrections dans le state
6. Le composant souligne les erreurs en rouge
7. Au clic sur une erreur : affiche les suggestions
8. "Corriger" → applySingleCorrection() remplace le texte
9. "Tout corriger" → applyCorrections() applique toutes les corrections

Optimisations :
→ Cache des résultats (1 minute TTL) : évite de re-checker le même texte
→ Rate limiting : 1.5s minimum entre deux requêtes API
→ Levenshtein distance : trie les suggestions par pertinence
→ 9 langues supportées : FR, EN, ES, DE, NL, PT, IT, PL, ZH
```

### 5.5 Persistance du timer (critique #5)

Garantit que le chronomètre ne se perd jamais, même si l'utilisateur ferme l'onglet.

```
Mécanisme :
1. DÉMARRAGE : startPersistedTimer(taskId)
   → Sauvegarde {taskId, startedAt, status: 'running'} dans localStorage

2. EN COURS : tickPersistedTimer()
   → Met à jour elapsedSeconds toutes les secondes

3. FERMETURE DE PAGE : beforeunload event
   → freezePersistedTimer() → sauvegarde l'état exact + timestamp de freeze

4. RETOUR SUR L'APPLICATION :
   → PrivateRoute détecte hasActiveTimer() = true
   → Redirige vers /tasks/{taskId}/timer
   → computeElapsedSeconds() calcule le temps total (incluant le temps d'absence)
   → Le timer reprend là où il en était

5. RECONNEXION APRÈS LOGOUT :
   → restorePersistedTimerFromServer()
   → Vérifie que la tâche est toujours IN_PROGRESS côté serveur
   → Si oui : restaure le timer / Si non : nettoie

6. COMPLÉTION :
   → clearPersistedTimer() → supprime de localStorage
   → Time log soumis automatiquement au backend
```

---

## 6. Flux de fonctionnement

### 6.1 Flux global — Parcours propriétaire (Admin)

```
1. INSCRIPTION : /register → rôle ADMIN → /dashboard
2. CRÉATION DOMICILE : /create-domicile → nom, adresse
3. AJOUT EXÉCUTEUR : /domiciles → ajouter exécuteur avec taux horaire
4. CRÉATION TÂCHE : /create-task → titre, description, domicile, exécuteur, dates
5. SUIVI : /dashboard → voit les tâches en cours
6. VALIDATION TEMPS : /admin/time-logs → approuver/rejeter les heures
7. FACTURATION : /admin/invoices/create → génère facture depuis heures approuvées
8. BUDGET : /budgets → fixe le budget mensuel, voit les projections
9. STATISTIQUES : /admin/stats → vue d'ensemble
```

### 6.2 Flux global — Parcours exécuteur

```
1. INSCRIPTION : /register → rôle USER → /dashboard
2. TÂCHES : /tasks → voit ses tâches assignées
3. DÉMARRER : clic "Démarrer" → redirigé vers /tasks/{id}/timer
4. TIMER : chronomètre en temps réel, estimation SmartEstimate
5. TERMINER : clic "Terminer" → time log soumis automatiquement
6. MES TEMPS : /my-time-logs → voit ses logs (PENDING/APPROVED/REJECTED)
7. MES FACTURES : /my-invoices → voit ses factures
8. PERFORMANCE : /performance → metrics, streak, note moyenne
```

### 6.3 Flux de données — Requête API typique

```
FRONTEND                                          BACKEND
═════════                                         ═════════
                                                  
Page mount                                        
  ↓                                               
Store.fetchData()                                 
  ↓                                               
Service.getData()                                 
  ↓                                               
api.get('/endpoint')                              
  ↓ Intercepteur ajoute Bearer token              
  ↓                                               
  ═══════════════ HTTPS ════════════════>          
                                                  nginx
                                                  ↓ reverse proxy
                                                  PHP-FPM
                                                  ↓
                                                  Kernel → Router
                                                  ↓
                                                  JwtAuthenticator
                                                  ↓ valide JWT
                                                  Controller
                                                  ↓ valide + mappe
                                                  Service
                                                  ↓ logique métier
                                                  Repository → Doctrine
                                                  ↓ SQL
                                                  PostgreSQL
                                                  ↓ résultats
                                                  Entity objects
                                                  ↓ sérialisation
                                                  JSON Response
  <════════════════ HTTPS ═════════════            
  ↓                                               
api.get() retourne data                           
  ↓                                               
Store.setData(data)                               
  ↓                                               
React re-render avec nouvelles données            
  ↓                                               
Page affiche les données                          
```

### 6.4 Flux email asynchrone

```
1. Action déclenchante (ex: inscription)
   ↓
2. Controller ajoute email à EmailQueue (in-memory)
   ↓
3. Réponse HTTP envoyée au client (rapide ! pas de blocage)
   ↓
4. TerminateListener (post-response) :
   → Drain EmailQueue
   → Persiste chaque email comme PendingEmail en base
   ↓
5. Cron job (toutes les X minutes) OU HTTP trigger :
   → SendPendingEmailsCommand / InternalCronController
   → Charge les PendingEmail non envoyés
   → MailjetService.send() pour chacun
   → Marque comme envoyé (ou erreur avec retry)
```

---

## 7. Choix techniques et justifications

### 7.1 Pourquoi React + TypeScript ?

| Critère | Justification |
|---|---|
| **React** | Écosystème le plus large (NPM), recrutement facilité, composants réutilisables, virtual DOM performant |
| **TypeScript** | Détection d'erreurs à la compilation, autocomplétion IDE, documentation vivante via les types, maintenabilité long terme |
| **React 19** | Dernière version avec Concurrent Mode, Server Components ready, meilleure performance |

### 7.2 Pourquoi Symfony ?

| Critère | Justification |
|---|---|
| **Maturité** | Framework PHP le plus structuré, conventions strictes, documentation exhaustive |
| **Doctrine ORM** | Mapping objet-relationnel puissant, migrations automatiques, lifecycle callbacks |
| **Sécurité** | Firewall intégré, password hashing, CSRF, validation robuste |
| **DI Container** | Injection de dépendances automatique (autowiring), testabilité |
| **Écosystème** | NelmioCorsBundle, API Platform, Messenger — packages prêts à l'emploi |

### 7.3 Pourquoi JWT custom et pas des sessions ?

| Critère | Justification |
|---|---|
| **Stateless** | Pas de session côté serveur → scalabilité horizontale (plusieurs instances backend possibles) |
| **SPA** | Le frontend est une app séparée (pas sur le même domaine) → cookies de session ne fonctionnent pas en cross-origin |
| **Mobile-ready** | JWT fonctionne avec n'importe quel client (web, mobile, API) |
| **Custom vs package** | Contrôle total sur les claims, l'expiration, le format — pas de dépendance à LexikJWT |
| **HMAC SHA256** | Suffisamment sécurisé pour une API interne, plus simple que RSA (pas de gestion de clés publiques/privées) |

### 7.4 Pourquoi PostgreSQL ?

| Critère | Justification |
|---|---|
| **ACID** | Transactions fiables pour les opérations financières (factures, budgets) |
| **JSON natif** | Type `jsonb` pour les champs flexibles (daysOfWeek des tâches récurrentes) |
| **Performance** | Requêtes complexes avec window functions (utilisées dans Performance et Budget) |
| **Render** | PostgreSQL managé sur Render → backup automatique, scaling facile |

### 7.5 Pourquoi Zustand et pas Redux ?

| Critère | Justification |
|---|---|
| **Simplicité** | API minimale (create + useStore), pas de boilerplate (actions, reducers, types) |
| **Performance** | Abonnements granulaires, pas de re-render global |
| **Taille** | ~2KB vs ~7KB pour Redux Toolkit |
| **Persistance** | Middleware `persist` intégré (localStorage) en une ligne |
| **3 stores suffisent** | auth, tasks, domiciles — pas besoin d'un système plus complexe |

### 7.6 Pourquoi Tailwind CSS ?

| Critère | Justification |
|---|---|
| **Utility-first** | Pas de CSS custom à maintenir, tout est dans les classes HTML |
| **Design system** | Configuration centralisée (palette, ombres, animations) dans `tailwind.config.js` |
| **Purge** | Build final ne contient que les classes utilisées → CSS minimal |
| **Dark mode** | Stratégie par classe (`.dark`) intégrée |
| **Responsive** | Préfixes `sm:`, `md:`, `lg:`, `xl:` pour le responsive design |

### 7.7 Pourquoi Vite et pas Webpack ?

| Critère | Justification |
|---|---|
| **Vitesse** | Hot Module Replacement instantané (ESBuild), build 10-100x plus rapide |
| **Configuration** | Quasi-zéro configuration vs Webpack qui nécessite des dizaines de lignes |
| **ESM natif** | Utilise les modules ES natifs du navigateur en dev |
| **Écosystème** | Devenu le standard pour les projets React modernes |

### 7.8 Pourquoi un pipeline email asynchrone ?

| Critère | Justification |
|---|---|
| **Performance** | L'envoi d'email (appel API Mailjet) prend 200-500ms. Sans queue, chaque inscription/action bloquait la réponse HTTP. |
| **Fiabilité** | Si Mailjet est down, les emails sont en base et seront réenvoyés au prochain cron. |
| **Scalabilité** | Le cron peut traiter des centaines d'emails en batch. |
| **UX** | L'utilisateur n'attend pas l'envoi de l'email pour obtenir sa réponse. |

### 7.9 Pourquoi Docker ?

| Critère | Justification |
|---|---|
| **Reproductibilité** | Même environnement en dev et en production |
| **Déploiement** | `docker build` + `docker push` → Render déploie automatiquement |
| **Multi-process** | Supervisor gère PHP-FPM + nginx dans un seul container |
| **Isolation** | Pas de conflit de versions PHP sur la machine hôte |

### 7.10 Pourquoi i18next avec 5 langues ?

| Critère | Justification |
|---|---|
| **Marché cible** | Application utilisable en Europe (FR, EN, ES, DE) + Asie (ZH) |
| **Facilité** | Fichiers JSON simples, pas de compilation |
| **Détection** | `i18next-browser-languagedetector` détecte automatiquement la langue du navigateur |
| **Fallback** | Si une traduction manque, fallback vers FR (langue principale) |

---

## 8. Points sensibles du projet

### 8.1 Sécurité

#### ⚠️ Pas de blacklist JWT
Le logout **ne révoque pas** le token côté serveur. Le token reste valide jusqu'à son expiration naturelle. 

**Impact** : Si un token est volé, il est utilisable jusqu'à expiration.  
**Mitigation** : Expiration courte (configurable via `JWT_EXPIRATION`). Le refresh token existe en base mais n'est pas exposé via API.

#### ⚠️ Pas de rate limiting sur les routes d'authentification
Les endpoints `/api/auth/login` et `/api/auth/register` n'ont pas de limitation de débit.

**Impact** : Vulnérabilité au brute force.  
**Mitigation possible** : Ajouter un rate limiter Symfony (`framework.rate_limiter`).

#### ⚠️ 2FA non enforced
Le `TwoFAController` sauvegarde un flag dans UserSettings, mais **aucun middleware** ne vérifie ce flag pendant le login.

**Impact** : L'utilisateur peut activer le 2FA mais il n'est jamais vérifié.  
**Mitigation** : Ajouter une vérification dans `AuthController.login()`.

#### ⚠️ Contrôleurs de debug en production
`DebugController` et `MailTestController` sont accessibles en production (protégés par `ROLE_ADMIN` mais existent).

**Mitigation** : Conditionner sur l'environnement (`kernel.environment`).

### 8.2 Base de données

#### ⚠️ Cascades de suppression incomplètes
La suppression d'un User peut laisser des orphelins dans `Activity`, `Favorite`, `LogEntry`.

**Impact** : Données orphelines en base.  
**Mitigation** : Ajouter `cascade: ["remove"]` sur les relations OneToMany ou gérer dans le service.

#### ⚠️ Cohérence des noms de colonnes
L'entité Notification utilise le champ `read` (PHP) mais la migration crée un index sur `is_read`.

**Impact** : Potentiel crash sur la migration ou index inutilisé.  
**Mitigation** : Vérifier l'alignement entre les noms d'attributs et les noms de colonnes.

### 8.3 Architecture

#### ⚠️ SQL brut dans les contrôleurs
`BudgetController` et `PerformanceController` contiennent du SQL brut directement dans le contrôleur.

**Impact** : Viole la séparation des couches (le contrôleur ne devrait pas connaître le SQL).  
**Mitigation** : Déplacer les requêtes SQL dans les Repositories correspondants.

#### ⚠️ API Platform installé mais non utilisé
API Platform est configuré mais **aucune entité** ne porte l'attribut `#[ApiResource]`. Tous les endpoints sont des contrôleurs manuels.

**Impact** : Dépendance inutile (poids du bundle).  
**Choix assumé** : Contrôle total sur les endpoints → plus de flexibilité, mais plus de code à maintenir.

#### ⚠️ Messenger en mode synchrone
Le Messenger Symfony route `SendEmailMessage` et `SendVerificationEmailMessage` vers le transport `sync`, ce qui annule l'avantage de l'asynchrone.

**Mitigation** : Le pipeline `EmailQueue → PendingEmail → Cron` compense ce problème car l'envoi réel est asynchrone via le cron/HTTP trigger.

### 8.4 Frontend

#### ⚠️ Appels API directs dans certaines pages
Certaines pages appellent `api.get('/endpoint')` directement au lieu de passer par un service dédié (ex: `ActivityPage`, `NotificationsPage`, `SettingsPage`, etc.).

**Impact** : Moins maintenable, logique d'API dispersée.  
**Mitigation** : Créer des services dédiés pour chaque domaine (notifications.service.ts, settings.service.ts, etc.).

#### ⚠️ Hooks non exportés
Seuls 2 des 11 hooks sont exportés dans le barrel `hooks/index.ts`.

**Impact** : Les autres hooks doivent être importés avec des chemins relatifs.  
**Mitigation** : Ajouter tous les hooks au barrel export.

#### ⚠️ Dossiers vides
`components/dashboard/`, `components/forms/`, `contexts/` sont des dossiers vides.

**Impact** : Confusion pour un développeur qui rejoint le projet.  
**Mitigation** : Supprimer ou implémenter.

#### ⚠️ react-toastify non déclaré
`utils/notifications.ts` importe `react-toastify` qui n'est pas dans `package.json`.

**Impact** : Risque de crash si le package est absent.  
**Mitigation** : Ajouter `react-toastify` dans les dépendances ou remplacer par une solution alternative.

### 8.5 Déploiement

#### ⚠️ CORS configuré avec origines spécifiques
`nelmio_cors.yaml` autorise `localhost:5173`, `localhost:3000`, `lahatrar.github.io`.

**Impact** : Si le domaine de production change, il faut mettre à jour la config.  
**Bonne pratique** : Utiliser une variable d'environnement pour les origines autorisées.

#### ⚠️ Migration automatique au démarrage Docker
Le Dockerfile exécute `doctrine:migrations:migrate --no-interaction` au démarrage.

**Impact** : Si une migration échoue, le conteneur ne démarre pas.  
**Bonne pratique acceptable** : Pour un petit projet, c'est pragmatique. En production à grande échelle, il faudrait un job de migration séparé.

---

## Annexes

### A. Résumé des endpoints par module

| Module | Endpoints | Méthodes |
|---|---|---|
| Auth | 6 | POST, GET |
| Tasks | 9 | GET, POST, PUT, DELETE, PATCH |
| Domiciles | 9 | GET, POST, PUT, DELETE |
| Users | 4 | GET, PUT, DELETE |
| Time Tracking | 10 | GET, POST, PATCH, DELETE |
| Invoices | 12 | GET, POST, PATCH, DELETE |
| Budgets | 3 | GET, POST |
| Recurring Tasks | 6 | GET, POST, PUT, DELETE, PATCH |
| Performance | 4 | GET |
| Other | ~19 | CRUD mixte |
| **TOTAL** | **~82** | — |

### B. Variables d'environnement critiques

| Variable | Utilisation |
|---|---|
| `APP_SECRET` | Secret JWT (doit être long et aléatoire en production) |
| `DATABASE_URL` | Connection PostgreSQL |
| `JWT_EXPIRATION` | Durée de vie des tokens (secondes) |
| `MAILJET_API_KEY` | Clé API Mailjet |
| `MAILJET_SECRET_KEY` | Clé secrète Mailjet |
| `MAILJET_SENDER_EMAIL` | Email d'envoi |
| `MAILJET_SENDER_NAME` | Nom affiché dans les emails |
| `CRON_SECRET` | Token pour le trigger HTTP du cron email |
| `VITE_API_BASE_URL` | URL de l'API backend (côté frontend) |
| `VITE_ENV_LABEL` | Label d'environnement (dev/staging/prod) |

### C. Commandes utiles

```bash
# Backend — Développement
cd homi_backend
composer install                              # Installer dépendances
php bin/console doctrine:migrations:migrate   # Appliquer migrations
php bin/console cache:clear                   # Vider le cache
php bin/console app:send-pending-emails       # Envoyer emails en attente

# Backend — Docker
docker compose up -d                          # Lancer en local
docker compose logs -f                        # Voir les logs

# Frontend — Développement
cd homi_frontend
npm install                                   # Installer dépendances
npm run dev                                   # Serveur dev (localhost:5173)
npm run build                                 # Build production
npx tsc --noEmit                              # Vérifier les types TypeScript

# Frontend — Déploiement GitHub Pages
npm run build                                 # Génère dist/
# Copier dist/ vers la branche gh-pages
```

### D. Structure de la base de données

| Table | Colonnes clés | Indexes |
|---|---|---|
| `user` | id, email (unique), role, password, firstName, lastName, isEmailVerified | email_verification_token, role, is_email_verified |
| `domicile` | id, name, address, city, postalCode, createdBy (FK) | created_by_id, name |
| `task` | id, title, status, startTime, endTime, actualStartTime, actualEndTime, assignedTo (FK), domicile (FK) | status, created_at, start_time, assigned_to_id |
| `domicile_executor` | id, domicile (FK), executor (FK), hourlyRate | UNIQUE(domicile_id, executor_id) |
| `task_time_log` | id, task (FK), executor (FK), startTime, endTime, hoursWorked, status, validatedBy | executor_id, status, start_time |
| `invoice` | id, invoiceNumber (unique), domicile (FK), executor (FK), totalHours, hourlyRate, subtotal, taxRate, taxAmount, total, status, dueDate | status, executor_id, domicile_id, created_at, due_date |
| `monthly_budget` | id, domicile (FK), year, month, budgetAmount | UNIQUE(domicile_id, year, month) |
| `recurring_task_template` | id, title, frequency, daysOfWeek, startDate, endDate, isActive, domicile (FK), assignedTo (FK) | — |
| `task_review` | id, task (FK, unique), reviewer (FK), rating, comment | — |
| `task_history` | id, task (FK), user (FK), action, timestamp | task_id |
| `notification` | id, user (FK), title, message, read | user_id, is_read |
| `refresh_token` | id, user (FK), token, expiresAt | expires_at, user_id |
| `pending_email` | id, recipient, subject, body, sentAt, failureReason | status |
| `activity` | id, user (FK), type, data, createdAt | user_id, created_at |
| `user_settings` | id, user (FK), theme, language, notifications, twoFA | — |

---

> **Ce document couvre l'intégralité du projet Homi. Chaque section peut être approfondie lors de la soutenance en se référant directement au code source.**
