# 🧪 GUIDE DE TEST RAPIDE - Homi Project

**Date**: 20 Janvier 2026  
**Migrations**: ✅ Exécutées avec succès

---

## ✅ État Actuel

### Migrations Complètes:
```
✅ Version20260113132016 - Initial schema
✅ Version20260114090533 - Task updates
✅ Version20260119110439 - Domicile updates
✅ Version20260120125000 - task_time_log table
✅ Version20260120130000 - hourly_rate column
✅ Version20260120131000 - invoice table
```

### Backend:
- ✅ 2 nouvelles entités (TaskTimeLog, Invoice)
- ✅ 1 entity modifiée (DomicileExecutor + hourlyRate)
- ✅ 2 nouveaux services (TimeTrackingService, InvoiceService)
- ✅ 2 nouveaux controllers (TimeTrackingController, InvoiceController)
- ✅ 17 nouveaux endpoints REST

### Frontend:
- ✅ TaskTimerPage enhanced (soumission heures)
- ✅ AdminTimeLogsPage (validation logs)
- ✅ MyTimeLogsPage (vue executor)
- ✅ Navigation améliorée

---

## 🚀 TESTS À FAIRE MAINTENANT

### 1️⃣ Test Backend - Time Tracking

#### Setup:
1. Ouvre Postman ou Insomnia
2. Configure l'URL de base: `http://localhost:8000/api`

#### Test 1: Login Executor
```http
POST /auth/login
Content-Type: application/json

{
  "email": "executor@example.com",
  "password": "password"
}
```

**Attendu**: Token JWT dans la réponse
**Copie le token pour les tests suivants**

#### Test 2: Créer un Time Log
```http
POST /time-logs
Authorization: Bearer {ton_token}
Content-Type: application/json

{
  "taskId": 1,
  "startTime": "2026-01-20T10:00:00",
  "endTime": "2026-01-20T12:30:00",
  "notes": "Nettoyage complet effectué"
}
```

**Attendu**:
```json
{
  "id": 1,
  "taskId": 1,
  "hoursWorked": 2.5,
  "status": "PENDING",
  "createdAt": "2026-01-20 14:00:00"
}
```

#### Test 3: Lister ses Logs
```http
GET /time-logs
Authorization: Bearer {ton_token}
```

**Attendu**: Array avec le log créé

#### Test 4: Login Admin
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

#### Test 5: Voir Logs en Attente
```http
GET /time-logs/admin/pending
Authorization: Bearer {admin_token}
```

**Attendu**: Array avec les logs PENDING

#### Test 6: Approuver un Log
```http
PATCH /time-logs/1/approve
Authorization: Bearer {admin_token}
```

**Attendu**:
```json
{
  "id": 1,
  "status": "APPROVED",
  "message": "Time log approved successfully"
}
```

---

### 2️⃣ Test Backend - Invoicing

#### Test 1: Définir Tarif Horaire
⚠️ **Important**: Pour que la facturation marche, il faut d'abord définir le tarif!

```http
# D'abord, récupérer le domicile_executor ID
GET /domicile-executors
Authorization: Bearer {admin_token}

# Ensuite, mettre à jour (utilise l'ID récupéré)
PATCH /domicile-executors/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "hourlyRate": 15.50
}
```

#### Test 2: Générer une Facture
```http
POST /invoices
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "domicileId": 1,
  "executorId": 2,
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "taxRate": 20.0
}
```

**Attendu**:
```json
{
  "id": 1,
  "invoiceNumber": "INV-202601-0001",
  "domicile": { ... },
  "executor": { ... },
  "totalHours": 2.5,
  "hourlyRate": 15.50,
  "subtotal": 38.75,
  "taxAmount": 7.75,
  "total": 46.50,
  "status": "DRAFT",
  "dueDate": "2026-02-19"
}
```

#### Test 3: Lister Factures
```http
GET /invoices
Authorization: Bearer {admin_token}
```

#### Test 4: Marquer Payée
```http
PATCH /invoices/1/pay
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "paidDate": "2026-02-15"
}
```

---

### 3️⃣ Test Frontend

#### Test 1: TaskTimerPage (Executor)
1. Login comme executor
2. Va sur une tâche: `/tasks/1/timer`
3. Laisse le timer tourner quelques secondes
4. Clique "Complete Task"
5. ✅ Vérifie qu'un log apparaît dans `/my-time-logs`

#### Test 2: My Time Logs (Executor)
1. Va sur `/my-time-logs`
2. ✅ Vérifie que tu vois tes statistiques
3. Clique sur "Pending" filter
4. ✅ Vérifie que seuls les logs PENDING s'affichent
5. Clique sur "All"
6. ✅ Vérifie que tous les logs reviennent

#### Test 3: Admin Time Logs (Admin)
1. Logout executor, login admin
2. Va sur `/admin/time-logs`
3. ✅ Vérifie que tu vois les logs en attente
4. Clique "Approve" sur un log
5. ✅ Vérifie qu'il disparaît de la liste
6. Refresh la page
7. ✅ Vérifie qu'il ne revient pas

---

## ⚠️ Troubleshooting

### "Migration already executed"
**Solution**: C'est normal, les migrations ont déjà été faites ✅

### "Hourly rate not set"
**Cause**: Le tarif horaire n'est pas défini pour l'executor dans ce domicile  
**Solution**:
```http
# Trouver le domicile_executor
GET /domicile-executors

# Mettre à jour avec un tarif
PATCH /domicile-executors/{id}
{ "hourlyRate": 15.50 }
```

### "Task not found" lors de submitTimeLog
**Cause**: L'ID de la tâche n'existe pas  
**Solution**:
```http
# Lister les tâches
GET /tasks

# Utiliser un ID valide dans taskId
```

### "Executor not assigned to this task"
**Cause**: La tâche n'est pas assignée à l'executor  
**Solution**:
```http
# Vérifier l'assignation
GET /tasks/1

# La tâche doit avoir: "assignedTo": { "id": {ton_user_id} }
```

### Frontend: "Failed to submit time log"
1. Ouvre DevTools (F12)
2. Va dans l'onglet "Network"
3. Clique "Complete Task"
4. Regarde la requête `/api/time-logs`
5. Vérifie le statut (400, 401, 403, 500)
6. Lis le message d'erreur dans la réponse

---

## 📊 Vérification Base de Données

### Ouvrir PostgreSQL:
```bash
psql -U postgres -d homi_db
```

### Vérifier les tables:
```sql
-- Voir toutes les tables
\dt

-- Vérifier task_time_log
SELECT * FROM task_time_log;

-- Vérifier invoice
SELECT * FROM invoice;

-- Vérifier hourly_rate
SELECT id, executor_id, domicile_id, hourly_rate FROM domicile_executor;
```

### Requêtes utiles:
```sql
-- Logs en attente
SELECT * FROM task_time_log WHERE status = 'PENDING';

-- Logs approuvés
SELECT * FROM task_time_log WHERE status = 'APPROVED';

-- Factures draft
SELECT * FROM invoice WHERE status = 'DRAFT';

-- Total heures par executor
SELECT executor_id, SUM(hours_worked) as total
FROM task_time_log
WHERE status = 'APPROVED'
GROUP BY executor_id;
```

---

## ✅ Checklist Validation

### Backend:
- [ ] Login executor fonctionne
- [ ] Créer time log fonctionne
- [ ] Lister time logs fonctionne
- [ ] Admin peut voir logs pending
- [ ] Admin peut approuver logs
- [ ] Admin peut rejeter logs
- [ ] Génération facture fonctionne
- [ ] Calcul montants correct

### Frontend:
- [ ] TaskTimerPage soumet les heures
- [ ] MyTimeLogsPage affiche les logs
- [ ] Filtres fonctionnent
- [ ] AdminTimeLogsPage affiche pending
- [ ] Boutons Approve/Reject fonctionnent
- [ ] Navigation correcte (Admin vs Executor)

### Database:
- [ ] Table task_time_log existe
- [ ] Table invoice existe
- [ ] Colonne hourly_rate existe
- [ ] Indexes créés
- [ ] Foreign keys OK

---

## 🎯 Prochaine Étape

Si tous les tests passent ✅:
1. Commit tout le code
2. Push vers Git
3. Commencer **Semaine 3: Analytics & Reports**

Si des tests échouent ❌:
1. Note les erreurs
2. Lis les messages d'erreur
3. Vérifie la documentation
4. Demande de l'aide si besoin

---

**Status Actuel**: ✅ **READY TO TEST**  
**Effort**: Semaine 1 & 2 complètes (~18h dev)  
**Progression**: 75% du projet Bachelor
