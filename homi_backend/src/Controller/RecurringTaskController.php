<?php

namespace App\Controller;

use App\Entity\RecurringTaskTemplate;
use App\Entity\Task;
use App\Repository\RecurringTaskTemplateRepository;
use App\Repository\DomicileRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/recurring-tasks')]
#[IsGranted('ROLE_ADMIN')]
class RecurringTaskController extends AbstractController
{
    public function __construct(
        private RecurringTaskTemplateRepository $templateRepo,
        private DomicileRepository $domicileRepo,
        private UserRepository $userRepo,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
    ) {}

    /**
     * Lister les templates de tâches récurrentes de l'admin.
     */
    #[Route('', name: 'recurring_tasks_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $templates = $this->templateRepo->findBy(
            ['createdBy' => $user],
            ['createdAt' => 'DESC']
        );

        return $this->json(array_map([$this, 'serializeTemplate'], $templates));
    }

    /**
     * Créer un template de tâche récurrente.
     */
    #[Route('', name: 'recurring_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'JSON invalide'], Response::HTTP_BAD_REQUEST);
        }

        $domicile = $this->domicileRepo->find($data['domicileId'] ?? 0);
        if (!$domicile) {
            return $this->json(['error' => 'Domicile introuvable'], Response::HTTP_NOT_FOUND);
        }

        $assignedTo = $this->userRepo->find($data['executorId'] ?? 0);
        if (!$assignedTo) {
            return $this->json(['error' => 'Exécuteur introuvable'], Response::HTTP_NOT_FOUND);
        }

        $template = new RecurringTaskTemplate();
        $template->setTitle($data['title'] ?? '');
        $template->setDescription($data['description'] ?? '');
        $template->setDomicile($domicile);
        $template->setAssignedTo($assignedTo);
        $template->setCreatedBy($user);
        $template->setFrequency($data['frequency'] ?? 'weekly');
        $template->setDaysOfWeek($data['daysOfWeek'] ?? null);
        $template->setPreferredStartTime($data['preferredStartTime'] ?? null);
        $template->setEstimatedDurationMinutes($data['estimatedDurationMinutes'] ?? null);
        $template->setStartDate(new \DateTimeImmutable($data['startDate'] ?? 'today'));
        $template->setEndDate(isset($data['endDate']) ? new \DateTimeImmutable($data['endDate']) : null);
        $template->setIsActive(true);

        $errors = $this->validator->validate($template);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($template);
        $this->em->flush();

        return $this->json($this->serializeTemplate($template), Response::HTTP_CREATED);
    }

    /**
     * Modifier un template.
     */
    #[Route('/{id}', name: 'recurring_tasks_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $template = $this->templateRepo->find($id);
        if (!$template || $template->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Template introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) $template->setTitle($data['title']);
        if (isset($data['description'])) $template->setDescription($data['description']);
        if (isset($data['frequency'])) $template->setFrequency($data['frequency']);
        if (isset($data['daysOfWeek'])) $template->setDaysOfWeek($data['daysOfWeek']);
        if (isset($data['preferredStartTime'])) $template->setPreferredStartTime($data['preferredStartTime']);
        if (isset($data['estimatedDurationMinutes'])) $template->setEstimatedDurationMinutes($data['estimatedDurationMinutes']);
        if (isset($data['isActive'])) $template->setIsActive($data['isActive']);
        if (isset($data['endDate'])) $template->setEndDate(new \DateTimeImmutable($data['endDate']));

        if (isset($data['executorId'])) {
            $assignedTo = $this->userRepo->find($data['executorId']);
            if ($assignedTo) $template->setAssignedTo($assignedTo);
        }

        $this->em->flush();

        return $this->json($this->serializeTemplate($template));
    }

    /**
     * Supprimer un template.
     */
    #[Route('/{id}', name: 'recurring_tasks_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $template = $this->templateRepo->find($id);
        if (!$template || $template->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Template introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($template);
        $this->em->flush();

        return $this->json(['message' => 'Template supprimé']);
    }

    /**
     * Activer / Désactiver un template.
     */
    #[Route('/{id}/toggle', name: 'recurring_tasks_toggle', methods: ['PATCH'])]
    public function toggle(int $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $template = $this->templateRepo->find($id);
        if (!$template || $template->getCreatedBy() !== $user) {
            return $this->json(['error' => 'Template introuvable'], Response::HTTP_NOT_FOUND);
        }

        $template->setIsActive(!$template->isActive());
        $this->em->flush();

        return $this->json($this->serializeTemplate($template));
    }

    /**
     * Générer manuellement les tâches pour aujourd'hui (ou une date donnée).
     */
    #[Route('/generate', name: 'recurring_tasks_generate', methods: ['POST'])]
    public function generate(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);
        $dateStr = $data['date'] ?? 'today';
        $targetDate = new \DateTimeImmutable($dateStr);

        $templates = $this->templateRepo->findBy(['createdBy' => $user, 'isActive' => true]);

        $generated = [];
        foreach ($templates as $template) {
            if (!$template->shouldGenerateForDate($targetDate)) {
                continue;
            }

            // Vérifier qu'une tâche n'a pas déjà été générée aujourd'hui pour ce template
            $dayStart = new \DateTimeImmutable($targetDate->format('Y-m-d') . ' 00:00:00');
            $dayEnd = new \DateTimeImmutable($targetDate->format('Y-m-d') . ' 23:59:59');
            $existing = $this->em->getRepository(Task::class)->createQueryBuilder('t')
                ->where('t.title = :title')
                ->andWhere('t.domicile = :domicile')
                ->andWhere('t.assignedTo = :assignedTo')
                ->andWhere('t.startTime BETWEEN :dayStart AND :dayEnd')
                ->setParameter('title', $template->getTitle())
                ->setParameter('domicile', $template->getDomicile())
                ->setParameter('assignedTo', $template->getAssignedTo())
                ->setParameter('dayStart', $dayStart)
                ->setParameter('dayEnd', $dayEnd)
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            if ($existing) continue;

            $task = new Task();
            $task->setTitle($template->getTitle());
            $task->setDescription($template->getDescription());
            $task->setDomicile($template->getDomicile());
            $task->setAssignedTo($template->getAssignedTo());

            // Définir les horaires prévus
            $startTime = $template->getPreferredStartTime()
                ? new \DateTimeImmutable($targetDate->format('Y-m-d') . ' ' . $template->getPreferredStartTime())
                : $targetDate;
            $task->setStartTime($startTime);

            if ($template->getEstimatedDurationMinutes()) {
                $endTime = $startTime->modify('+' . $template->getEstimatedDurationMinutes() . ' minutes');
                $task->setEndTime($endTime);
            }

            $this->em->persist($task);
            $template->setLastGeneratedAt(new \DateTimeImmutable());
            $generated[] = $task->getTitle();
        }

        $this->em->flush();

        return $this->json([
            'message' => count($generated) . ' tâche(s) générée(s)',
            'tasks' => $generated,
            'date' => $targetDate->format('Y-m-d'),
        ]);
    }

    private function serializeTemplate(RecurringTaskTemplate $t): array
    {
        return [
            'id' => $t->getId(),
            'title' => $t->getTitle(),
            'description' => $t->getDescription(),
            'domicile' => [
                'id' => $t->getDomicile()?->getId(),
                'name' => $t->getDomicile()?->getName(),
            ],
            'assignedTo' => [
                'id' => $t->getAssignedTo()?->getId(),
                'firstName' => $t->getAssignedTo()?->getFirstName(),
                'lastName' => $t->getAssignedTo()?->getLastName(),
                'email' => $t->getAssignedTo()?->getEmail(),
            ],
            'frequency' => $t->getFrequency(),
            'daysOfWeek' => $t->getDaysOfWeek(),
            'preferredStartTime' => $t->getPreferredStartTime(),
            'estimatedDurationMinutes' => $t->getEstimatedDurationMinutes(),
            'startDate' => $t->getStartDate()?->format('Y-m-d'),
            'endDate' => $t->getEndDate()?->format('Y-m-d'),
            'isActive' => $t->isActive(),
            'lastGeneratedAt' => $t->getLastGeneratedAt()?->format('c'),
            'createdAt' => $t->getCreatedAt()?->format('c'),
        ];
    }
}
