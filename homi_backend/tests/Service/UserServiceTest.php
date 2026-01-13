<?php

namespace App\Tests\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserServiceTest extends TestCase
{
    private UserService $userService;
    private $entityManager;
    private $userRepository;
    private $passwordHasher;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);

        $this->userService = new UserService(
            $this->entityManager,
            $this->userRepository,
            $this->passwordHasher
        );
    }

    public function testCreateUser(): void
    {
        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn('hashed_password');

        $this->entityManager
            ->expects($this->once())
            ->method('persist');

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $user = $this->userService->createUser('test@example.com', 'password', 'ROLE_USER');

        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('ROLE_USER', $user->getRole());
        $this->assertNotNull($user->getCreatedAt());
    }

    public function testGetUser(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');

        $this->userRepository
            ->expects($this->once())
            ->method('find')
            ->with(1)
            ->willReturn($user);

        $result = $this->userService->getUser(1);

        $this->assertEquals($user, $result);
    }

    public function testGetUserNotFound(): void
    {
        $this->userRepository
            ->expects($this->once())
            ->method('find')
            ->with(999)
            ->willReturn(null);

        $result = $this->userService->getUser(999);

        $this->assertNull($result);
    }

    public function testAuthenticate(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setPassword('hashed_password');

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'test@example.com'])
            ->willReturn($user);

        $this->passwordHasher
            ->expects($this->once())
            ->method('isPasswordValid')
            ->with($user, 'password')
            ->willReturn(true);

        $result = $this->userService->authenticate('test@example.com', 'password');

        $this->assertEquals($user, $result);
    }

    public function testAuthenticateWrongPassword(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'test@example.com'])
            ->willReturn($user);

        $this->passwordHasher
            ->expects($this->once())
            ->method('isPasswordValid')
            ->with($user, 'wrongpassword')
            ->willReturn(false);

        $result = $this->userService->authenticate('test@example.com', 'wrongpassword');

        $this->assertNull($result);
    }
}
