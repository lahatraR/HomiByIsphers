# 🛠️ PLAN D'IMPLÉMENTATION DÉTAILLÉ - Homi Domestic Service

## 📊 Résumé exécutif

Homi est une **plateforme de gestion de personnel domestique**:
- **Admin/Propriétaire**: Crée domiciles, assigne tâches, valide temps, génère factures
- **Executor/Domestique**: Exécute tâches, enregistre temps, voit ses gains

### État actuel
- ✅ Architecture de base (rôles, domiciles, tâches)
- ✅ Authentification JWT
- ✅ UI responsive
- ❌ **Manque critique**: Time tracking + Facturation

---

## 📋 ROADMAP DÉTAILLÉE

### **SEMAINE 1: Time Tracking Foundation**

#### Backend
```
1. Entity TaskTimeLog
   - id, taskId, executorId, startTime, endTime, hoursWorked
   - status: DRAFT | SUBMITTED | VALIDATED | REJECTED
   - notes, rejectionReason
   - timestamps

2. Controller TimeTrackingController
   GET    /api/tasks/{id}/time-logs          (lister temps)
   POST   /api/tasks/{id}/time-logs          (soumettre temps)
   PUT    /api/time-logs/{id}                (modifier temps)
   PATCH  /api/time-logs/{id}/validate       (valider - Admin only)
   PATCH  /api/time-logs/{id}/reject         (refuser)

3. DTOs
   - CreateTimeLogRequest
   - UpdateTimeLogRequest
   - TimeLogResponse

4. Services
   - TimeTrackingService
     * calculateHoursWorked()
     * validateSubmission()
     * checkPermissions()
```

#### Frontend
```
1. Page: TaskTimerPage.tsx (compléter)
   - Timer réel (démarrer/arrêter)
   - Affichage temps écoulé
   - Saisie temps manuel
   - Notes facultatives
   - Bouton "Soumettre"

2. Component: TimerWidget
   - Affichage HH:MM:SS
   - Boutons play/pause/stop
   - Reset

3. Store: timeTrackingStore.ts
   - État des timers actifs
   - Soumissions en attente
   - Historique temps

4. Service: timeTracking.service.ts
   - Endpoints API

5. Types: Ajouter à types/index.ts
   interface TimeLog {
     id: number;
     taskId: number;
     executorId: number;
     hoursWorked: number;
     status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED';
     notes?: string;
     createdAt: string;
     submittedAt?: string;
     validatedAt?: string;
   }
```

#### Migration
```sql
CREATE TABLE task_time_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  executor_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  hours_worked DECIMAL(5,2),
  status VARCHAR(20),
  notes TEXT,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  validated_at DATETIME,
  rejected_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES task(id),
  FOREIGN KEY (executor_id) REFERENCES user(id)
);
```

#### Tests
```
- TimeTrackingServiceTest
  * testCalculateHoursWorked()
  * testValidateSubmission()
  * testCheckExecutorPermission()
```

**Effort**: 3-4 jours

---

### **SEMAINE 2: Tarification & Rapports**

#### Backend
```
1. Modifier Entity DomicileExecutor
   - Ajouter: hourlyRate (DECIMAL 10,2)
   - Ajouter: createdAt si absent
   - Migration: ALTER TABLE domicile_executor ADD COLUMN hourly_rate DECIMAL(10,2)

2. Entity: InvoiceReport (nouvelle)
   - id, domicileId, executorId, period (YYYY-MM)
   - totalHours, totalCost, status
   - items: TaskTimeLog[]

3. Controller: ReportController
   GET    /api/reports/domicile/{id}         (Admin)
     - Résumé par mois/trimestre
     - Coûts totaux
     - Breakdown par executor
   
   GET    /api/reports/executor/{id}/earnings (Executor + Admin)
     - Mes heures ce mois
     - Mes gains estimés
     - Historique
   
   GET    /api/reports/domicile/{id}/pdf     (Admin)
     - Export PDF facture

4. Services
   - ReportService
     * generateDomicileReport()
     * calculateExecutorEarnings()
     * generateInvoicePDF()
   
   - PdfGeneratorService (utiliser TCPDF ou Dompdf)

5. DTOs
   - DomicileReportResponse
   - ExecutorEarningsResponse
   - InvoiceLineItem
```

#### Frontend
```
1. Page: ReportsPage.tsx (nouvelle)
   Admin voit:
   - List domiciles avec coûts totaux
   - Détail par domicile
   - Export PDF
   
   Executor voit:
   - Mes earnings ce mois
   - Temps validé vs en attente
   - Historique gains

2. Component: ReportCard
3. Component: EarningsChart
4. Service: reports.service.ts

5. Store: reportStore.ts
   - État rapports
   - Cache

6. Page: AdminTimeLogs.tsx (nouvelle)
   - Lister tous les time logs en attente
   - Valider/Refuser avec raison
   - Voir détails executor
```

#### Tests
```
- ReportServiceTest
  * testCalculateExecutorEarnings()
  * testValidateInvoiceData()
```

**Effort**: 3-4 jours

---

### **SEMAINE 3: Analytics & Dashboard Executor**

#### Backend
```
1. Controller: AnalyticsController
   GET    /api/analytics/executor/{id}/month        (stats perso)
   GET    /api/analytics/domicile/{id}/summary      (stats domicile)
   GET    /api/analytics/executor/{id}/productivity (tendances)

2. Services
   - AnalyticsService
     * getExecutorProductivity()
     * getDomicileStats()
     * detectAnomalies() (temps anormaux)

3. DTOs
   - ExecutorAnalyticsResponse
   - DomicileAnalyticsResponse
```

#### Frontend
```
1. Page: ExecutorDashboard.tsx (nouvelle)
   - Tâches assignées du jour
   - Temps enregistré aujourd'hui
   - Gains estimation
   - Calendrier avec heures
   - Historique récent

2. Page: AdminDashboard.tsx (refactor)
   - Domiciles avec coûts
   - Executors par domicile
   - Tâches par statut
   - Graphique tendance

3. Components:
   - AnalyticsCard
   - HoursChart (Chart.js)
   - EarningsWidget
   - ProductivityChart

4. Store: analyticsStore.ts

5. Dépendance: npm install chart.js react-chartjs-2
```

#### Tests
```
- AnalyticsServiceTest
```

**Effort**: 2-3 jours

---

### **SEMAINE 4: Notifications & Polish**

#### Backend
```
1. Entity: Notification (nouvelle)
   - id, userId, type (NEW_TASK, TIME_VALIDATED, etc)
   - message, isRead, createdAt

2. Controller: NotificationController
   GET    /api/notifications            (list)
   PATCH  /api/notifications/{id}/read  (marquer lu)
   DELETE /api/notifications/{id}

3. Service: NotificationService
   - createNotification()
   - sendNotifications()

4. EventListener: TaskAssignedListener
   - Crée notification quand task assignée
```

#### Frontend
```
1. Component: NotificationCenter
   - Bell icon avec badge count
   - List notifications
   - Mark as read

2. Store: notificationStore.ts

3. Service: notifications.service.ts

4. Toast notifications
   - Success: time submitted
   - Error: validation failed
```

**Effort**: 2 jours

---

### **SEMAINE 5-6: Tests & Deployment**

```
1. Tests unitaires manquants
2. Tests e2e (Cypress)
3. Documentation API (Postman collection)
4. Documentation utilisateur
5. Déploiement staging
6. Performance tests
```

**Effort**: 3-4 jours

---

## 🎯 DÉTAIL IMPLÉMENTATION SEMAINE 1

### Step 1: Créer Entity TaskTimeLog

```php
<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TaskTimeLogRepository::class)]
#[ORM\HasLifecycleCallbacks]
class TaskTimeLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['time-log:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['time-log:read'])]
    private ?Task $task = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['time-log:read'])]
    private ?User $executor = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['time-log:read', 'time-log:write'])]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $startTime = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read', 'time-log:write'])]
    private ?\DateTimeImmutable $endTime = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Groups(['time-log:read'])]
    private ?string $hoursWorked = null;

    #[ORM\Column(length: 20)]
    #[Groups(['time-log:read'])]
    private string $status = 'DRAFT'; // DRAFT, SUBMITTED, VALIDATED, REJECTED

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['time-log:read', 'time-log:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?string $rejectionReason = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $submittedAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['time-log:read'])]
    private ?\DateTimeImmutable $validatedAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    public function getId(): ?int { return $this->id; }
    public function getTask(): ?Task { return $this->task; }
    public function setTask(?Task $task): static { $this->task = $task; return $this; }
    public function getExecutor(): ?User { return $this->executor; }
    public function setExecutor(?User $executor): static { $this->executor = $executor; return $this; }
    // ... autres getters/setters
}
```

### Step 2: Créer Migration

```bash
cd homi_backend
php bin/console make:migration
# Vérifier et exécuter
php bin/console doctrine:migrations:migrate
```

### Step 3: Créer Repository

```bash
php bin/console make:repository TaskTimeLog
```

### Step 4: Créer TimeTrackingService

```php
<?php
namespace App\Service;

use App\Entity\TaskTimeLog;
use App\Repository\TaskTimeLogRepository;
use Doctrine\ORM\EntityManagerInterface;

class TimeTrackingService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TaskTimeLogRepository $repository
    ) {}

    public function calculateHoursWorked(TaskTimeLog $log): float
    {
        if (!$log->getEndTime()) {
            return 0;
        }
        
        $diff = $log->getEndTime()->diff($log->getStartTime());
        return $diff->h + ($diff->i / 60);
    }

    public function submitTimeLog(TaskTimeLog $log): TaskTimeLog
    {
        $log->setStatus('SUBMITTED');
        $log->setSubmittedAt(new \DateTimeImmutable());
        $log->setHoursWorked((string)$this->calculateHoursWorked($log));
        
        $this->entityManager->persist($log);
        $this->entityManager->flush();
        
        return $log;
    }
}
```

### Step 5: Créer TimeTrackingController

```bash
php bin/console make:controller TimeTrackingController
```

```php
<?php
namespace App\Controller;

use App\Entity\Task;
use App\Entity\TaskTimeLog;
use App\Repository\TaskRepository;
use App\Service\TimeTrackingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/tasks')]
class TimeTrackingController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TaskRepository $taskRepository,
        private TimeTrackingService $timeTrackingService
    ) {}

    #[Route('/{taskId}/time-logs', name: 'task_time_logs_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listTimeLogs(int $taskId): JsonResponse
    {
        $task = $this->taskRepository->find($taskId);
        if (!$task) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier l'accès
        if (!$this->hasTaskAccess($task)) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $logs = $this->entityManager->getRepository(TaskTimeLog::class)
            ->findBy(['task' => $task], ['createdAt' => 'DESC']);

        return $this->json($logs, Response::HTTP_OK, [], ['groups' => ['time-log:read']]);
    }

    #[Route('/{taskId}/time-logs', name: 'task_time_logs_create', methods: ['POST'])]
    #[IsGranted('ROLE_EXECUTOR')]
    public function createTimeLog(int $taskId, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($taskId);
        if (!$task) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        // Seul l'assigné peut créer
        if ($task->getAssignedTo() !== $this->getUser()) {
            return $this->json(['error' => 'Not assigned'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $log = new TaskTimeLog();
        $log->setTask($task);
        $log->setExecutor($this->getUser());
        $log->setStartTime(new \DateTimeImmutable($data['startTime']));
        
        if (isset($data['endTime'])) {
            $log->setEndTime(new \DateTimeImmutable($data['endTime']));
        }
        
        if (isset($data['notes'])) {
            $log->setNotes($data['notes']);
        }

        $log->setStatus('DRAFT');

        $this->entityManager->persist($log);
        $this->entityManager->flush();

        return $this->json($log, Response::HTTP_CREATED, [], ['groups' => ['time-log:read']]);
    }

    #[Route('/time-logs/{id}/submit', name: 'time_log_submit', methods: ['PATCH'])]
    #[IsGranted('ROLE_EXECUTOR')]
    public function submitTimeLog(TaskTimeLog $log): JsonResponse
    {
        // Vérifier propriété
        if ($log->getExecutor() !== $this->getUser()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $log = $this->timeTrackingService->submitTimeLog($log);

        return $this->json($log, Response::HTTP_OK, [], ['groups' => ['time-log:read']]);
    }

    #[Route('/time-logs/{id}/validate', name: 'time_log_validate', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function validateTimeLog(TaskTimeLog $log): JsonResponse
    {
        $log->setStatus('VALIDATED');
        $log->setValidatedAt(new \DateTimeImmutable());
        
        $this->entityManager->flush();

        return $this->json($log, Response::HTTP_OK, [], ['groups' => ['time-log:read']]);
    }

    private function hasTaskAccess(Task $task): bool
    {
        $user = $this->getUser();
        
        if ($this->isGranted('ROLE_ADMIN')) {
            return $task->getDomicile()?->getCreatedBy() === $user;
        }
        
        if ($this->isGranted('ROLE_EXECUTOR')) {
            return $task->getAssignedTo() === $user;
        }
        
        return false;
    }
}
```

---

## 📱 Frontend - Semaine 1

### TaskTimerPage.tsx (compléter)

```tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner } from '../components/common';

export const TaskTimerPage: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const { user } = useAuthStore();
    const { tasks } = useTaskStore();
    
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const task = tasks.find(t => t.id === parseInt(taskId || ''));

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleStart = () => setIsRunning(true);
    const handleStop = () => setIsRunning(false);
    const handleReset = () => {
        setSeconds(0);
        setIsRunning(false);
    };

    const handleSubmit = async () => {
        if (seconds === 0) {
            setError('Veuillez enregistrer du temps');
            return;
        }

        setIsLoading(true);
        try {
            // Appel API
            // await timeTrackingService.submitTimeLog(taskId, {
            //     hoursWorked: seconds / 3600,
            //     notes
            // });
            
            setIsRunning(false);
            setSeconds(0);
            setNotes('');
            // Navigate back
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!task) {
        return <MainLayout><p>Tâche non trouvée</p></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <h1 className="text-3xl font-bold mb-4">{task.title}</h1>
                    <p className="text-gray-600 mb-8">{task.description}</p>

                    {/* Timer Display */}
                    <div className="text-center mb-8">
                        <div className="text-6xl font-mono font-bold text-blue-600">
                            {formatTime(seconds)}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 justify-center mb-8">
                        {!isRunning ? (
                            <Button onClick={handleStart} variant="primary">
                                ▶ Démarrer
                            </Button>
                        ) : (
                            <Button onClick={handleStop} variant="warning">
                                ⏸ Arrêter
                            </Button>
                        )}
                        <Button onClick={handleReset} variant="secondary">
                            ↻ Réinitialiser
                        </Button>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Notes (optionnel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows={3}
                            placeholder="Détails du travail effectué..."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 p-3 mb-4 rounded">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || seconds === 0}
                        className="w-full"
                        variant="success"
                    >
                        {isLoading ? <LoadingSpinner /> : '📤 Soumettre'}
                    </Button>
                </Card>
            </div>
        </MainLayout>
    );
};
```

---

## ✅ Checklist Semaine 1

- [ ] Créer Entity `TaskTimeLog`
- [ ] Créer Migration
- [ ] Créer Repository
- [ ] Créer Service `TimeTrackingService`
- [ ] Créer Controller `TimeTrackingController`
- [ ] Créer DTOs
- [ ] Completer `TaskTimerPage.tsx`
- [ ] Créer `timeTracking.service.ts`
- [ ] Ajouter types TypeScript
- [ ] Tests unitaires
- [ ] Postman testing

**Estimation**: 3-4 jours

---

## 📊 Résultat attendu Semaine 1

✅ Executor peut:
- Accéder TaskTimerPage pour une tâche assignée
- Démarrer/Arrêter un timer
- Remplir notes optionnelles
- Soumettre le temps

✅ Admin peut:
- Voir tous les time logs soumis
- Voir détails (heures, notes, date)
- (Valider - implémenté Semaine 2)

✅ Backend:
- Enregistre temps avec statut
- Calcule heures automatiquement
- Valide permissions
- Timestamps complets

---

## 🎯 Metrics d'un Bachelor 3 standout

Après implémentation complète:
- ✅ Système de rôles granulaire (Propriétaire vs Domestique)
- ✅ Time tracking temps réel (timer + validation)
- ✅ Facturation automatique (temps × tarif)
- ✅ Rapports détaillés + PDF
- ✅ Analytics avec graphiques
- ✅ Notifications intelligentes
- ✅ UI responsive & polished
- ✅ Architecture maintenable
- ✅ Tests couvrage

**Pitch**: "J'ai créé une plateforme SaaS B2B de gestion domestique avec time tracking validé et facturation automatique - ce qui démarque vraiment mon projet."
