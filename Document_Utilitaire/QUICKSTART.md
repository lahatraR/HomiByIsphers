# 🚀 Quick Start - Backend Homi

## 5 minutes installation

### Étape 1: Dépendances
```bash
composer install
```

### Étape 2: Configuration
```bash
cp .env.example .env.local
# Éditer .env.local si besoin (DB, JWT_EXPIRATION, etc)
```

### Étape 3: Base de données
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### Étape 4: Démarrer le serveur
```bash
php bin/console server:start
# ou
symfony serve
```

Le serveur est maintenant sur `http://localhost:8000`

---

## Tester l'API en 2 minutes

### 1. Créer un compte

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "role": "ROLE_USER"
  }'
```

**Réponse:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expiresIn": 3600,
  "userId": 1,
  "email": "user@example.com",
  "role": "ROLE_USER"
}
```

Copier le `token` pour les prochaines requêtes.

### 2. Se connecter

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### 3. Créer un domicile

```bash
curl -X POST http://localhost:8000/api/domiciles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Mon appartement"
  }'
```

### 4. Récupérer un domicile

```bash
curl -X GET http://localhost:8000/api/domiciles/1 \
  -H "Authorization: Bearer {TOKEN}"
```

### 5. Créer une tâche

Créer d'abord un 2ème utilisateur pour l'assigner.

```bash
# 1. Créer un exécutant
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "executor@example.com",
    "password": "Password123!",
    "role": "ROLE_USER"
  }'
# Réponse: userId = 2

# 2. Créer une tâche
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_OWNER}" \
  -d '{
    "title": "Nettoyer la cuisine",
    "description": "Nettoyer à fond la cuisine",
    "domicile_id": 1,
    "executor_id": 2,
    "start_time": "2025-01-15T10:00:00"
  }'
```

---

## 📋 Endpoints courants

```bash
# Authentification
POST   /api/auth/register          Inscription
POST   /api/auth/login             Connexion

# Utilisateurs
GET    /api/users/{id}             Mon profil
PUT    /api/users/{id}             Modifier mon profil
GET    /api/users                  Lister tous (admin)
DELETE /api/users/{id}             Supprimer (admin)

# Domiciles
POST   /api/domiciles              Créer
GET    /api/domiciles/{id}         Récupérer
PUT    /api/domiciles/{id}         Modifier
DELETE /api/domiciles/{id}         Supprimer
POST   /api/domiciles/{id}/executors/{uid}      Ajouter exécutant
DELETE /api/domiciles/{id}/executors/{uid}      Enlever

# Tâches
POST   /api/tasks                  Créer
GET    /api/tasks/{id}             Récupérer
DELETE /api/tasks/{id}             Supprimer
POST   /api/tasks/{id}/finish      Terminer
POST   /api/tasks/{id}/postpone    Repporter
POST   /api/tasks/{id}/reassign    Réassigner
```

---

## 🐛 Déboguer

### Logs
```bash
tail -f var/log/dev.log
```

### Routes disponibles
```bash
php bin/console debug:router
```

### Entités mappées
```bash
php bin/console doctrine:mapping:info
```

### Tests
```bash
php bin/phpunit
```

---

## 🔑 Credential de test

```
Email:    user@example.com
Password: Password123!
```

---

## 💡 Tips

1. **Ajouter `-v` pour plus de détails**
   ```bash
   php bin/console debug:router -v
   ```

2. **Réinitialiser la DB**
   ```bash
   php bin/console doctrine:database:drop --force
   php bin/console doctrine:database:create
   php bin/console doctrine:migrations:migrate
   ```

3. **Voir les queries SQL**
   ```bash
   php bin/console debug:config doctrine
   ```

4. **Validateur**
   ```bash
   php bin/console debug:validator
   ```

---

## 📚 Documentation complète

- [README.md](README.md) - Guide détaillé
- [SECURITY.md](SECURITY.md) - Sécurité
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Changements
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Production
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Structure

---

## ⚠️ Erreurs courants

| Erreur | Solution |
|--------|----------|
| `Doctrine\DBAL\Exception\ConnectionException` | Vérifier DATABASE_URL dans .env |
| `JWT token invalid` | Token expiré ou invalide, refaire login |
| `Access denied` | Ajouter `Authorization: Bearer {token}` |
| `Validation failed` | Vérifier les données envoyées |
| `Entity not found` | ID n'existe pas |

---

**Dernière mise à jour:** 12 Janvier 2025
**Version:** 1.0 Production-Ready
