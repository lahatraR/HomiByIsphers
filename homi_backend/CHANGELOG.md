# Changelog - Backend Homi

## [1.0.0] - 2025-01-12

### 🔒 Sécurité
- **MAJOR**: Implémenté JWT (JSON Web Tokens) pour l'authentification
  - Endpoint `/api/auth/login` et `/api/auth/register`
  - Token expiration configurable (3600s par défaut)
  - Signature HMAC-SHA256
- **MAJOR**: Changé password hashing de `password_hash()` à `UserPasswordHasherInterface` (Argon2id)
- **MAJOR**: Ajouté contrôle d'accès (`#[IsGranted]`) sur tous les endpoints
- **MAJOR**: Implémenté validation stricte des mots de passe (min 8 chars + complexity)
- Ajouté `JwtAuthenticator` pour l'authentification JWT
- Ajouté `JwtTokenProvider` pour la gestion des tokens
- Ajouté validation email stricte avec regex
- Ajouté validation des DTOs avec `Symfony\Validator`
- Corrected security configuration (entity provider au lieu de users_in_memory)

### 🗄️ Base de Données
- **BREAKING**: Ajouté migration pour corriger `end_time` (nullable)
- **BREAKING**: Ajouté migration pour `UNIQUE` constraint sur email
- Créé `TaskStatus` enum (created, in_progress, completed, postponed)
- Créé `TaskActionType` enum (replaced magic numbers 1,2,3,5)
- Validé l'intégrité des foreign keys

### 🛣️ API & Routes
- **BREAKING**: Corrigé `DomicileController` - était sur `/api/tasks/{id}`, maintenant `/api/domiciles`
- Ajouté `AuthController` avec endpoints login/register
- Refactorisé `UserController` - ajouté GET list (admin), corrigé permissions
- Refactorisé `TaskController` - ajouté validations, permissions
- Refactorisé `DomicileController` - ajouté validations, permissions
- Implémenté proper HTTP status codes (201, 400, 401, 403, 404, 500)

### ✅ Validation
- Créé `LoginRequest` DTO avec validations
- Créé `RegisterRequest` DTO avec règles de complexité
- Créé `CreateTaskRequest` DTO
- Créé `AuthResponse` DTO
- Ajouté validation de dates (ISO 8601)
- Ajouté error messages cohérents en français

### 🏗️ Architecture
- Refactorisé `UserService` - utilise `UserPasswordHasherInterface`
- Refactorisé `TaskHistoryService` - support des enums
- Implémenté `ExceptionListener` pour gestion d'erreurs global
- User entity implémente `UserInterface` et `PasswordAuthenticatedUserInterface`
- Ajouté DTOs pour validation des entrées

### 📝 Configuration
- Mise à jour `config/packages/security.yaml` pour JWT
- Ajouté paramètres JWT dans `config/services.yaml`
- Ajouté `.env.example` avec tous les paramètres
- Mise à jour `.env` avec APP_SECRET et JWT_EXPIRATION
- Configuré pagination par défaut (20 limit, 100 max)

### 📚 Documentation
- Créé `README.md` - guide installation et utilisation (130+ lignes)
- Créé `SECURITY.md` - politique de sécurité (180+ lignes)
- Créé `IMPROVEMENTS.md` - détail des changements (300+ lignes)
- Créé `DEPLOYMENT_CHECKLIST.md` - checklist production (200+ lignes)
- Créé `QUICKSTART.md` - démarrage rapide (150+ lignes)
- Créé `PROJECT_STRUCTURE.md` - structure du projet (200+ lignes)
- Créé `AUDIT_SUMMARY.md` - résumé audit (200+ lignes)
- Créé `AUDIT_CHECKLIST.md` - checklist final (150+ lignes)

### ✅ Tests
- Créé `tests/Service/UserServiceTest.php` - tests complets du service utilisateur
- Configuré PHPUnit avec mocks
- Test cases: createUser, getUser, authenticate, etc

### 🔧 Dépendances
- Ajouté `lcobucci/jwt` pour JWT support
- Ajouté `symfony/security-bundle` (security-bundle)
- Ajouté `symfony/uid` pour UUIDs (optionnel)

### 🐛 Bugs Fixes
- Corrigé route conflict dans `DomicileController`
- Corrigé exception `json_decode` sans try-catch
- Corrigé validation des dates sans try-catch
- Corrigé configuration sécurité inactive
- Corrigé permission checks manquants
- Corrigé validation d'email manquante
- Corrigé complexité password absente

### 📊 Logging
- Configué Monolog pour fichiers rotatifs
- Ajouté logging par environnement (dev/test/prod)
- Implémenté format JSON pour parsing (ELK ready)

### 🎯 Autres
- Ajouté strict type hints sur toutes les propriétés
- Remplacé magic numbers par enums
- Amélioré structure du code (SOLID principles)
- Ajouté commentaires explicatifs
- Validé structure selon standards Symfony 8.0

---

## Migration depuis 0.1.0

### Breaking Changes

1. **Authentification**: Passer de `None` à `JWT`
   - Tous les requests doivent inclure `Authorization: Bearer {token}`
   
2. **Routes**: `/api/tasks/{id}` pour domicile → `/api/domiciles/{id}`
   - Mettre à jour les liens client

3. **Password**: `password_hash()` → `UserPasswordHasherInterface`
   - Hacher les passwords existants: `php bin/console security:hash-password`

### Upgrade Steps

```bash
# 1. Télécharger le nouveau code
git pull origin main

# 2. Installer dépendances
composer install

# 3. Exécuter migrations
php bin/console doctrine:migrations:migrate

# 4. Tester l'API
curl -X POST http://localhost:8000/api/auth/login

# 5. Vérifier les logs
tail -f var/log/dev.log
```

---

## Versions Future

### v1.1.0 (Planned)
- [ ] Pagination robuste
- [ ] Health check endpoint
- [ ] Rate limiting (Redis)
- [ ] Tests coverage 70%
- [ ] Swagger/OpenAPI docs

### v1.2.0 (Planned)
- [ ] Event sourcing
- [ ] Soft deletes
- [ ] Full text search
- [ ] Message queue

### v2.0.0 (Long term)
- [ ] GraphQL endpoint
- [ ] Multi-tenancy
- [ ] Notification system
- [ ] Mobile app sync

---

## Notes

- Tous les endpoints API maintenant retournent JSON cohérent
- Toutes les entités maintenant ont `created_at` et `updated_at`
- Tous les services utilise Dependency Injection
- Tous les controllers utilise type hints stricts
- Tous les DTOs utilise validation Symfony

---

**Release Date**: 12 Janvier 2025
**Status**: Production Ready ✅
**Previous Version**: Non-existent (First audit)
**Next Review**: 3 mois
