# Checklist de déploiement en production

## Sécurité

- [ ] **APP_SECRET généré et sécurisé**
  ```bash
  php bin/console secrets:generate-keys --env=prod
  ```

- [ ] **JWT_EXPIRATION défini** (3600 secondes par défaut)

- [ ] **CORS configuré correctement**
  ```env
  CORS_ALLOW_ORIGIN='^https://yourdomain\.com$'
  ```

- [ ] **DATABASE_URL sécurisé**
  - Pas de credentials en clair dans le .env du repo
  - Utiliser des secrets Symfony

- [ ] **Validations d'email active**
  - Validation Symfony sur tous les formulaires
  - Regex pour complexité de password

- [ ] **Permissions checklist**
  - ✅ Seul le propriétaire peut modifier ses domiciles
  - ✅ Seul un admin peut voir/supprimer les autres utilisateurs
  - ✅ Vérification des routes avec #[IsGranted]

- [ ] **HTTPS activé** en production
  ```yaml
  framework:
      session:
          cookie_secure: true
          cookie_httponly: true
          cookie_samesite: 'Lax'
  ```

## Base de données

- [ ] **Migrations vérifiées et testées**
  ```bash
  php bin/console doctrine:migrations:migrate --dry-run --env=prod
  ```

- [ ] **Contraintes UNIQUE appliquées** (email unique)

- [ ] **Indexes créés** pour les colonnes FK
  ```bash
  php bin/console doctrine:schema:validate
  ```

- [ ] **Backup configuré** avant migration

- [ ] **Soft deletes** (optionnel) pour audit trail

## Code et Configuration

- [ ] **APP_ENV=prod** configuré

- [ ] **APP_DEBUG=false** en production

- [ ] **Cache configuré** pour Doctrine
  ```yaml
  doctrine:
      orm:
          query_cache_driver:
            type: pool
            pool: doctrine.system_cache_pool
  ```

- [ ] **Logs centralisés** avec Monolog
  - Format JSON pour faciliter l'analyse
  - Rotation des fichiers activée

- [ ] **Erreurs logging** sans exposer les détails
  - Pas de stack trace en réponse API
  - Messages génériques pour l'utilisateur

## Testing

- [ ] **Tests unitaires écrits**
  ```bash
  php bin/phpunit
  ```

- [ ] **Tests d'intégration passants**
  ```bash
  php bin/phpunit tests/
  ```

- [ ] **Couverture minimale de 70%**
  ```bash
  php bin/phpunit --coverage-html=coverage
  ```

## Performance

- [ ] **Query optimization**
  - Vérifier les N+1 queries
  ```bash
  php bin/console debug:profiler
  ```

- [ ] **Pagination implémentée**
  - GET /api/users?page=1&limit=50

- [ ] **Rate limiting configuré** (optionnel)

- [ ] **Cache HTTP headers** définis
  ```php
  return $response
      ->setPublic()
      ->setMaxAge(3600);
  ```

## Déploiement

- [ ] **Dependencies compilées**
  ```bash
  composer install --no-dev -o
  ```

- [ ] **Assets compilés**
  ```bash
  php bin/console assets:install
  ```

- [ ] **Secrets Symfony configurés**
  ```bash
  php bin/console secrets:list --reveal
  ```

- [ ] **Permissions fichiers**
  ```bash
  chown -R www-data:www-data var/
  chmod -R 755 var/
  chmod -R 755 public/
  ```

- [ ] **Firewall configuré**
  - Port 443 (HTTPS) ouvert
  - Port 22 (SSH) restreint par IP

## Monitoring et Logging

- [ ] **Logs disponibles et accessibles**
  ```bash
  tail -f var/log/prod.log
  ```

- [ ] **Alertes configurées** pour erreurs critiques

- [ ] **Monitoring de la BD** (CPU, RAM, Connections)

- [ ] **Health check endpoint** créé
  ```php
  #[Route('/api/health', methods: ['GET'])]
  public function health(): JsonResponse { ... }
  ```

## Documentation

- [ ] **README.md** à jour

- [ ] **API documentation** accessible
  - Swagger/OpenAPI (optionnel)

- [ ] **Env variables documentées** dans .env.example

- [ ] **Procédures de backup** documentées

## Post-déploiement

- [ ] **Test de santé complet**
  ```bash
  # Test API
  curl -X POST https://yourdomain/api/auth/login
  
  # Test BD
  curl https://yourdomain/api/health
  ```

- [ ] **Logs surveillés** pour erreurs

- [ ] **Performance testée** sous charge

- [ ] **Backup initial** pris

- [ ] **Rollback plan** préparé

---

## Notes importantes

### Secrets Production

Ne JAMAIS committer:
- `.env.local`
- `.env.prod.local`
- Clés privées
- Database credentials

Utiliser:
```bash
php bin/console secrets:generate-keys --env=prod
php bin/console secrets:set DATABASE_PASSWORD
```

### Migrations

Toujours tester les migrations:
```bash
# Sur une copie de prod
php bin/console doctrine:migrations:migrate --dry-run

# Puis en vrai
php bin/console doctrine:migrations:migrate
```

### Rollback Plan

En cas de problème:
```bash
# Revert la dernière migration
php bin/console doctrine:migrations:migrate --first

# Revert vers une version spécifique
php bin/console doctrine:migrations:migrate "DoctrineMigrations\Version20250112000000"
```

---

**Dernière mise à jour:** 12 Janvier 2025
