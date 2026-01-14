# API Homi Backend - Documentation

## Vue d'ensemble

API REST pour la gestion des domiciles, des tâches et des utilisateurs.

## Configuration requise

- PHP 8.4+
- PostgreSQL 16
- Composer

## Installation

### 1. Cloner et installer les dépendances

```bash
composer install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos paramètres :

```env
APP_ENV=dev
APP_SECRET=GenerateAVerySecureSecretHere
DATABASE_URL="postgresql://user:password@localhost:5432/homi_db?serverVersion=16"
JWT_EXPIRATION=3600
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
```

### 3. Créer la base de données et les tables

```bash
# Créer la base
php bin/console doctrine:database:create

# Exécuter les migrations
php bin/console doctrine:migrations:migrate
```

### 4. Démarrer le serveur

```bash
php bin/console server:start
# ou
symfony serve
```

## Authentification

L'API utilise **JWT (JSON Web Tokens)** pour l'authentification.

### Endpoints d'authentification

#### Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "ROLE_USER"
}
```

**Réponse (201 Created):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expiresIn": 3600,
  "userId": 1,
  "email": "user@example.com",
  "role": "ROLE_USER"
}
```

#### Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Utiliser le token

Ajouter le header `Authorization` à toutes les requêtes :

```http
Authorization: Bearer {token}
```

## API Endpoints

### Utilisateurs

#### Récupérer mon profil

```http
GET /api/users/{id}
Authorization: Bearer {token}
```

#### Mettre à jour mon profil

```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

#### Lister tous les utilisateurs (admin only)

```http
GET /api/users
Authorization: Bearer {token}
```

### Domiciles

#### Créer un domicile

```http
POST /api/domiciles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mon appartement"
}
```

#### Récupérer un domicile

```http
GET /api/domiciles/{id}
Authorization: Bearer {token}
```

#### Mettre à jour un domicile

```http
PUT /api/domiciles/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nouvel nom"
}
```

#### Supprimer un domicile

```http
DELETE /api/domiciles/{id}
Authorization: Bearer {token}
```

#### Ajouter un exécutant

```http
POST /api/domiciles/{id}/executors
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 2
}
```

#### Supprimer un exécutant

```http
DELETE /api/domiciles/{id}/executors/{user_id}
Authorization: Bearer {token}
```

### Tâches

#### Créer une tâche

```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Nettoyer la cuisine",
  "description": "Nettoyer à fond",
  "domicile_id": 1,
  "executor_id": 2,
  "start_time": "2025-01-15T10:00:00"
}
```

#### Récupérer une tâche

```http
GET /api/tasks/{id}
Authorization: Bearer {token}
```

#### Terminer une tâche

```http
POST /api/tasks/{id}/finish
Authorization: Bearer {token}
```

#### Reporter une tâche

```http
POST /api/tasks/{id}/postpone
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_start_time": "2025-01-20T10:00:00"
}
```

#### Réassigner une tâche

```http
POST /api/tasks/{id}/reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_executor_id": 3
}
```

#### Supprimer une tâche

```http
DELETE /api/tasks/{id}
Authorization: Bearer {token}
```

## Sécurité

### Bonnes pratiques implémentées

✅ **Authentification JWT** - Tokens sécurisés avec expiration
✅ **Hash de mot de passe** - Argon2id (sécurisé par défaut)
✅ **Validation d'entrée** - Tous les champs sont validés
✅ **Contrôle d'accès** - Vérification des permissions par endpoint
✅ **CORS configuré** - Limité aux domaines autorisés
✅ **Gestion d'erreurs** - Messages cohérents, pas d'exposition d'infos
✅ **Migrations versionnées** - Suivi des changements de DB
✅ **Logs centralisés** - Monolog pour le monitoring

### Configuration pour la production

1. **Mettre à jour APP_SECRET**
```bash
php bin/console secrets:generate-keys --env=prod
```

2. **Configurer HTTPS**
```yaml
# config/packages/security.yaml
framework:
    session:
        cookie_secure: true
        cookie_httponly: true
        cookie_samesite: 'Lax'
```

3. **Limiter CORS**
```env
CORS_ALLOW_ORIGIN='^https://yourdomain\.com$'
```

4. **Activer le mode prod**
```env
APP_ENV=prod
APP_DEBUG=false
```

## Tests

### Lancer les tests

```bash
php bin/phpunit
```

### Ajouter des tests

```bash
# Créer un test
php bin/console make:test

# Exécuter avec couverture
php bin/phpunit --coverage-html=coverage
```

## Déploiement

### Préparation

```bash
# Compiler l'environnement
composer dump-env prod

# Installer sans dev
composer install --no-dev -o

# Lancer les migrations
php bin/console doctrine:migrations:migrate --env=prod

# Vider le cache
php bin/console cache:clear --env=prod
```

### Fichiers importants

- `.env.example` - Variables d'environnement à configurer
- `migrations/` - Historique des modifications DB
- `config/` - Configuration Symfony
- `src/` - Code applicatif

## Troubleshooting

### Erreur de connexion BD

```bash
# Vérifier la connexion
php bin/console dbal:run-sql "SELECT 1"

# Recréer la BD
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### Réinitialiser les clés JWT

```bash
php bin/console secrets:generate-keys --rotate --force
```

## Support

Pour les questions ou bugs, ouvrir une issue.

## Licence

Propriétaire

---

**Version:** 1.0.0  
**Dernière mise à jour:** 12 Janvier 2025
