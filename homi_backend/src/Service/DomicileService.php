<?php
namespace App\Service;

use App\Entity\Domicile;
use App\Entity\User;
use App\Entity\DomicileExecutor;
use App\Repository\DomicileRepository;
use Doctrine\ORM\EntityManagerInterface;

class DomicileService
{
    public function __construct(
        private EntityManagerInterface $em,
        private DomicileRepository $domicileRepository
    ) {
    }

    public function createDomicile(string $name, User $owner): Domicile
    {
        $domicile = new Domicile();
        $domicile->setName($name);
        $domicile->setCreatedBy($owner);
        $domicile->setCreatedAt(new \DateTimeImmutable());
        $domicile->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($domicile);
        $this->em->flush();

        return $domicile;
    }

    public function getDomicile(int $id): ?Domicile
    {
        return $this->domicileRepository->find($id);
    }

    public function updateDomicile(Domicile $domicile, string $name): Domicile
    {
        $domicile->setName($name);
        $domicile->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();
        return $domicile;
    }

    public function deleteDomicile(Domicile $domicile): void
    {
        $this->em->remove($domicile);
        $this->em->flush();
    }

    // Ajouter un exécutant à un domicile
    public function addExecutor(Domicile $domicile, User $executor): DomicileExecutor
    {
        $existing = $this->em->getRepository(DomicileExecutor::class)
            ->findOneBy(['domicile' => $domicile, 'executor' => $executor]);
        if ($existing) return $existing;

        $domExec = new DomicileExecutor();
        $domExec->setDomicile($domicile);
        $domExec->setExecutor($executor);
        $domExec->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($domExec);
        $this->em->flush();

        return $domExec;
    }

    // Supprimer un exécutant
    public function removeExecutor(Domicile $domicile, User $executor): void
    {
        $domExec = $this->em->getRepository(DomicileExecutor::class)
            ->findOneBy(['domicile' => $domicile, 'executor' => $executor]);
        if ($domExec) {
            $this->em->remove($domExec);
            $this->em->flush();
        }
    }
}
