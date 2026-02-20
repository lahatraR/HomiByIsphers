# 🚀 QUICK START - À Implémenter

## Situation
✅ Backend & Frontend de base = Bon  
❌ Time Tracking = Manque (c'est le cœur!)  
❌ Tarification = Manque  
❌ Analytics = Basique  

---

## 📋 TODO List Priorisé

### 🔴 SEMAINE 1: Backend Time Tracking (COMMENCER ICI!)

**Backend - Day 1-5:**
```
[ ] Créer src/Entity/TaskTimeLog.php
[ ] Créer migration (php bin/console make:migration)
[ ] Créer src/Service/TimeTrackingService.php
[ ] Créer src/Controller/TimeTrackingController.php
[ ] Endpoints:
    POST   /api/tasks/{id}/time-logs         (créer/soumettre)
    GET    /api/tasks/{id}/time-logs         (lister)
    PATCH  /api/time-logs/{id}/validate      (valider - admin)
    PATCH  /api/time-logs/{id}/reject        (refuser)
[ ] Tests Postman
```

**Frontend - Minimal (Day 5):**
```
[ ] Créer src/services/timeTracking.service.ts
    - submitTimeLog() endpoint
[ ] Modifier TaskTimerPage.tsx
    - Ajouter bouton "Submit" après Complete
    - Appeler l'API pour sauvegarder
    - Afficher confirmation
[ ] Ajouter types TimeLog à src/types/index.ts
```

**Test - Day 5:**
```
[ ] Postman: Tester tous les endpoints
[ ] Frontend: Timer fonctionne
[ ] Backend: Heures calculées correctement
```

---

### 🟡 SEMAINE 2: Tarification

**Backend:**
```
[ ] Ajouter hourlyRate à DomicileExecutor entity
[ ] Créer src/Service/ReportService.php
[ ] Créer src/Controller/ReportController.php
[ ] Endpoints:
    GET /api/reports/domicile/{id}      (Admin - résumé coûts)
    GET /api/reports/executor/{id}      (Executor - mes gains)
    GET /api/reports/{id}/pdf           (PDF facture)
```

**Frontend:**
```
[ ] Créer src/pages/ReportsPage.tsx
[ ] Créer src/stores/reportStore.ts
[ ] Créer src/services/reports.service.ts
[ ] Component: ReportCard
[ ] PDF download button
```

---

### 🟢 SEMAINE 3: Analytics

**Backend:**
```
[ ] Créer src/Service/AnalyticsService.php
[ ] Créer src/Controller/AnalyticsController.php
[ ] Endpoints pour stats
```

**Frontend:**
```
[ ] Créer src/pages/ExecutorDashboard.tsx (NEW!)
[ ] Refactor DashboardPage pour AdminDashboard
[ ] npm install chart.js react-chartjs-2
[ ] Components: HoursChart, EarningsChart
[ ] Store: analyticsStore
```

---

### 🔵 SEMAINE 4: Notifications (Optionnel)

```
[ ] Entity Notification
[ ] Service NotificationService
[ ] Component NotificationCenter
[ ] Toast alerts
```

---

## 📊 Fichiers à Modifier vs Créer

### Modifier (peu)
- `src/types/index.ts` - Ajouter TimeLog
- `homi_backend/src/Entity/DomicileExecutor.php` - Ajouter hourlyRate
- `homi_frontend/src/pages/DashboardPage.tsx` - Split en Admin + Executor

### Créer (beaucoup)
```
Semaine 1:
- 2 controllers backend
- 3 pages/components frontend
- 2-3 services
- 2 stores

Semaine 2:
- 1-2 controllers backend
- 1-2 pages frontend
- 1-2 services
- 1 store

Semaine 3:
- 1 controller backend
- 2-3 pages frontend
- 2-3 components
- 1 store
```

---

## 🎯 Estimé Final

| Semaine | Travail | Jours |
|---------|---------|-------|
| 1 | Time Tracking | 5 |
| 2 | Tarification | 4 |
| 3 | Analytics | 3 |
| 4 | Notifications | 2 |
| 5-6 | Tests + Deploy | 4 |
| **TOTAL** | | **18 jours** |

À ~3 jours/semaine = **6 semaines**

---

## ✨ Resultat Final

**De**: App basique gestion tâches  
**À**: Plateforme SaaS B2B avec time tracking + facturation

**Pitch Bachelor 3**:
> "Plateforme gestion personnel domestique avec:
> - Time tracking validé
> - Facturation automatique
> - Analytics avancées
> - Full stack React/Symfony/PostgreSQL"

---

## 🚀 Démarrer Maintenant

**Step 1**: Lire `IMPLEMENTATION_PLAN.md` (code détaillé)  
**Step 2**: Créer Entity TaskTimeLog  
**Step 3**: Migration DB  
**Step 4**: Service + Controller  
**Step 5**: Tests Postman  
**Step 6**: Frontend Timer  

💪 **À toi de jouer!**
