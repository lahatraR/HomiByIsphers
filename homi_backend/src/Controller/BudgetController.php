<?php

namespace App\Controller;

use App\Entity\MonthlyBudget;
use App\Repository\MonthlyBudgetRepository;
use App\Repository\DomicileRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gestion des budgets mensuels par domicile + widget coût temps-réel.
 */
#[Route('/api/budgets')]
#[IsGranted('ROLE_ADMIN')]
class BudgetController extends AbstractController
{
    public function __construct(
        private MonthlyBudgetRepository $budgetRepo,
        private DomicileRepository $domicileRepo,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
    ) {}

    /**
     * Obtenir le résumé budget du mois en cours pour tous les domiciles de l'admin.
     * Inclut : budget défini, dépenses réelles, pourcentage consommé, projection.
     */
    #[Route('/overview', name: 'budget_overview', methods: ['GET'])]
    public function overview(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $year = $request->query->getInt('year', (int) date('Y'));
        $month = $request->query->getInt('month', (int) date('m'));

        $conn = $this->em->getConnection();

        // Récupérer tous les domiciles de l'admin avec les dépenses du mois
        $sql = "
            SELECT
                d.id as domicile_id,
                d.name as domicile_name,
                mb.budget_amount,
                COALESCE(spent.total_cost, 0) as spent_amount,
                COALESCE(spent.total_hours, 0) as total_hours_worked
            FROM domicile d
            LEFT JOIN monthly_budget mb ON mb.domicile_id = d.id
                AND mb.year = :year AND mb.month = :month
            LEFT JOIN (
                SELECT
                    t.domicile_id,
                    SUM(tl.hours_worked * COALESCE(de.hourly_rate, 25)) as total_cost,
                    SUM(tl.hours_worked) as total_hours
                FROM task_time_log tl
                JOIN task t ON t.id = tl.task_id
                LEFT JOIN domicile_executor de ON de.domicile_id = t.domicile_id AND de.executor_id = tl.executor_id
                WHERE tl.status = 'APPROVED'
                AND EXTRACT(YEAR FROM tl.start_time) = :year
                AND EXTRACT(MONTH FROM tl.start_time) = :month
                GROUP BY t.domicile_id
            ) spent ON spent.domicile_id = d.id
            WHERE d.created_by_id = :adminId
            ORDER BY d.name
        ";

        $results = $conn->fetchAllAssociative($sql, [
            'year' => $year,
            'month' => $month,
            'adminId' => $user->getId(),
        ]);

        $totalBudget = 0;
        $totalSpent = 0;
        $domiciles = [];

        // Calcul de projection : on est au jour X du mois, projeter sur le mois complet
        $daysInMonth = (int)(new \DateTime("$year-$month-01"))->format('t');
        $currentDay = min((int) date('j'), $daysInMonth);
        $projectionFactor = $currentDay > 0 ? $daysInMonth / $currentDay : 1;

        foreach ($results as $row) {
            $budget = $row['budget_amount'] ? (float) $row['budget_amount'] : null;
            $spent = (float) $row['spent_amount'];
            $projected = round($spent * $projectionFactor, 2);
            $percentUsed = $budget && $budget > 0 ? round(($spent / $budget) * 100) : null;

            $status = 'ok';
            if ($percentUsed !== null) {
                if ($percentUsed >= 100) $status = 'over';
                elseif ($percentUsed >= 80) $status = 'warning';
            }

            $domiciles[] = [
                'domicileId' => (int) $row['domicile_id'],
                'domicileName' => $row['domicile_name'],
                'budget' => $budget,
                'spent' => $spent,
                'hoursWorked' => round((float) $row['total_hours_worked'], 1),
                'projected' => $projected,
                'percentUsed' => $percentUsed,
                'status' => $status,
            ];

            if ($budget) $totalBudget += $budget;
            $totalSpent += $spent;
        }

        return $this->json([
            'year' => $year,
            'month' => $month,
            'totalBudget' => round($totalBudget, 2),
            'totalSpent' => round($totalSpent, 2),
            'totalProjected' => round($totalSpent * $projectionFactor, 2),
            'percentUsed' => $totalBudget > 0 ? round(($totalSpent / $totalBudget) * 100) : null,
            'domiciles' => $domiciles,
        ]);
    }

    /**
     * Coût temps-réel pour aujourd'hui.
     */
    #[Route('/today', name: 'budget_today', methods: ['GET'])]
    public function today(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $conn = $this->em->getConnection();

        $sql = "
            SELECT
                COALESCE(SUM(tl.hours_worked * COALESCE(de.hourly_rate, 25)), 0) as today_cost,
                COALESCE(SUM(tl.hours_worked), 0) as today_hours,
                COUNT(DISTINCT tl.task_id) as tasks_count
            FROM task_time_log tl
            JOIN task t ON t.id = tl.task_id
            JOIN domicile d ON d.id = t.domicile_id AND d.created_by_id = :adminId
            LEFT JOIN domicile_executor de ON de.domicile_id = t.domicile_id AND de.executor_id = tl.executor_id
            WHERE tl.status = 'APPROVED'
            AND DATE(tl.start_time) = CURRENT_DATE
        ";

        $result = $conn->fetchAssociative($sql, ['adminId' => $user->getId()]);

        return $this->json([
            'todayCost' => round((float) ($result['today_cost'] ?? 0), 2),
            'todayHours' => round((float) ($result['today_hours'] ?? 0), 1),
            'tasksCount' => (int) ($result['tasks_count'] ?? 0),
        ]);
    }

    /**
     * Définir / mettre à jour le budget d'un domicile pour un mois.
     */
    #[Route('', name: 'budget_set', methods: ['POST'])]
    public function setBudget(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
        }

        $domicile = $this->domicileRepo->find($data['domicileId'] ?? 0);
        if (!$domicile || $domicile->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Domicile introuvable'], Response::HTTP_NOT_FOUND);
        }

        $year = (int) ($data['year'] ?? date('Y'));
        $month = (int) ($data['month'] ?? date('m'));
        $amount = (float) ($data['budgetAmount'] ?? 0);

        // Chercher un budget existant ou en créer un nouveau
        $budget = $this->budgetRepo->findForDomicileMonth($domicile->getId(), $year, $month);

        if (!$budget) {
            $budget = new MonthlyBudget();
            $budget->setDomicile($domicile);
            $budget->setYear($year);
            $budget->setMonth($month);
            $budget->setCreatedBy($user);
            $this->em->persist($budget);
        }

        $budget->setBudgetAmount($amount);

        $errors = $this->validator->validate($budget);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return $this->json([
            'id' => $budget->getId(),
            'domicileId' => $domicile->getId(),
            'domicileName' => $domicile->getName(),
            'year' => $budget->getYear(),
            'month' => $budget->getMonth(),
            'budgetAmount' => $budget->getBudgetAmount(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Lister tous les budgets de l'admin.
     */
    #[Route('', name: 'budget_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $budgets = $this->budgetRepo->findByAdmin($user->getId());

        return $this->json(array_map(fn(MonthlyBudget $b) => [
            'id' => $b->getId(),
            'domicileId' => $b->getDomicile()?->getId(),
            'domicileName' => $b->getDomicile()?->getName(),
            'year' => $b->getYear(),
            'month' => $b->getMonth(),
            'budgetAmount' => $b->getBudgetAmount(),
        ], $budgets));
    }
}
