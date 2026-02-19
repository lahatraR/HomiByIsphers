<?php

namespace App\Controller;

use App\Repository\TaskTimeLogRepository;
use App\Repository\TaskRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * SmartEstimate : Prédiction intelligente de durée basée sur l'historique.
 */
#[Route('/api/smart-estimate')]
#[IsGranted('ROLE_USER')]
class SmartEstimateController extends AbstractController
{
    public function __construct(
        private TaskTimeLogRepository $timeLogRepo,
        private TaskRepository $taskRepo,
    ) {}

    /**
     * Estime la durée d'une tâche basée sur l'historique.
     *
     * Algorithme :
     *  1. Chercher les time logs approuvés pour des tâches du MÊME domicile
     *  2. Si pas assez de données, élargir à toutes les tâches de l'exécuteur
     *  3. Calculer : moyenne, médiane, min, max
     *  4. Retourner avec un score de confiance (basé sur le nombre d'échantillons)
     */
    #[Route('', name: 'smart_estimate', methods: ['GET'])]
    public function estimate(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $domicileId = $request->query->getInt('domicileId', 0);
        $executorId = $request->query->getInt('executorId', 0);
        $taskId = $request->query->getInt('taskId', 0);

        $conn = $this->timeLogRepo->getEntityManager()->getConnection();

        // 1. Time logs pour des tâches du même domicile (si spécifié)
        $params = [];
        $conditions = ["tl.status = 'APPROVED'"];

        if ($domicileId > 0) {
            $conditions[] = 't.domicile_id = :domicileId';
            $params['domicileId'] = $domicileId;
        }
        if ($executorId > 0) {
            $conditions[] = 'tl.executor_id = :executorId';
            $params['executorId'] = $executorId;
        }

        $where = implode(' AND ', $conditions);

        $sql = "
            SELECT 
                tl.hours_worked,
                t.title as task_title,
                t.domicile_id
            FROM task_time_log tl
            JOIN task t ON t.id = tl.task_id
            WHERE {$where}
            ORDER BY tl.created_at DESC
            LIMIT 50
        ";

        $rows = $conn->fetchAllAssociative($sql, $params);

        if (count($rows) === 0) {
            // Fallback : toutes les tâches approuvées, tous domiciles
            $fallbackSql = "
                SELECT tl.hours_worked
                FROM task_time_log tl
                WHERE tl.status = 'APPROVED'
                ORDER BY tl.created_at DESC
                LIMIT 50
            ";
            $rows = $conn->fetchAllAssociative($fallbackSql);
        }

        if (count($rows) === 0) {
            return $this->json([
                'estimatedHours' => null,
                'estimatedSeconds' => null,
                'confidence' => 'none',
                'basedOn' => 0,
                'message' => 'Pas assez de données pour estimer',
            ]);
        }

        $hours = array_map(fn($r) => (float) $r['hours_worked'], $rows);
        sort($hours);

        $count = count($hours);
        $avg = array_sum($hours) / $count;
        $median = $count % 2 === 0
            ? ($hours[$count / 2 - 1] + $hours[$count / 2]) / 2
            : $hours[(int) floor($count / 2)];

        // Score de confiance
        $confidence = match (true) {
            $count >= 10 => 'high',
            $count >= 3 => 'medium',
            default => 'low',
        };

        return $this->json([
            'estimatedHours' => round($avg, 2),
            'estimatedSeconds' => (int) round($avg * 3600),
            'medianHours' => round($median, 2),
            'minHours' => round(min($hours), 2),
            'maxHours' => round(max($hours), 2),
            'confidence' => $confidence,
            'basedOn' => $count,
        ]);
    }

    /**
     * Vérifie si le timer actuel dépasse l'estimation et retourne un avertissement.
     */
    #[Route('/check-overrun', name: 'smart_estimate_check', methods: ['GET'])]
    public function checkOverrun(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $taskId = $request->query->getInt('taskId', 0);
        $currentSeconds = $request->query->getInt('currentSeconds', 0);

        if ($taskId === 0) {
            return $this->json(['error' => 'taskId requis'], Response::HTTP_BAD_REQUEST);
        }

        $task = $this->taskRepo->find($taskId);
        if (!$task) {
            return $this->json(['error' => 'Tâche introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Calculer l'estimation pour le domicile de cette tâche
        $domicileId = $task->getDomicile()?->getId() ?? 0;

        $conn = $this->timeLogRepo->getEntityManager()->getConnection();
        $sql = "
            SELECT AVG(tl.hours_worked) as avg_hours, COUNT(*) as sample_count
            FROM task_time_log tl
            JOIN task t ON t.id = tl.task_id
            WHERE tl.status = 'APPROVED'
            AND t.domicile_id = :domicileId
        ";
        $result = $conn->fetchAssociative($sql, ['domicileId' => $domicileId]);

        if (!$result || (int) $result['sample_count'] < 2) {
            return $this->json(['overrun' => false, 'message' => 'Pas assez de données']);
        }

        $estimatedSeconds = (float) $result['avg_hours'] * 3600;
        $threshold = $estimatedSeconds * 1.2; // 120%

        $overrun = $currentSeconds > $threshold;
        $percentOver = $estimatedSeconds > 0
            ? round(($currentSeconds / $estimatedSeconds - 1) * 100)
            : 0;

        return $this->json([
            'overrun' => $overrun,
            'estimatedSeconds' => (int) $estimatedSeconds,
            'currentSeconds' => $currentSeconds,
            'percentOver' => max(0, $percentOver),
            'message' => $overrun
                ? "Vous dépassez la durée habituelle de {$percentOver}%"
                : null,
        ]);
    }
}
