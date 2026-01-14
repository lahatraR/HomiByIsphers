# Guide de Test API avec Postman

## Prérequis

1. **Postman installé** : Téléchargez depuis https://www.postman.com/downloads/
2. **Serveur Symfony lancé** : 
   ```bash
   php bin/console cache:clear
   symfony server:start
   ```
   Ou :
   ```bash
   php -S localhost:8000 -t public
   ```
3. **Base de données configurée** :
   ```bash
   php bin/console doctrine:database:create
   php bin/console doctrine:migrations:migrate
   ```

---

## Configuration Postman

### Créer une nouvelle Collection
1. Ouvrir Postman
2. Cliquer sur "New" → "Collection"
3. Nommer la collection : "Homi Backend API"
4. Ajouter une variable d'environnement :
   - Variable : `base_url`
   - Valeur : `http://localhost:8000/api`

---

## Tests des Endpoints

### 1. Inscription d'un utilisateur (Register)

**Méthode** : `POST`  
**URL** : `{{base_url}}/auth/register`  
**Headers** :
```
Content-Type: application/json
```

**Body** (raw JSON) :
```json
{
    "email": "test@example.com",
    "password": "Password123!",
    "role": "ROLE_USER"
}
```

**Réponse attendue** (201 Created) :
```json
{
    "message": "Utilisateur créé avec succès",
    "user": {
        "id": 1,
        "email": "test@example.com",
        "role": "ROLE_USER",
        "createdAt": "2026-01-12T10:30:00+00:00"
    }
}
```

**Tests à vérifier** :
- ✅ Status code : 201
- ✅ L'email est correct
- ✅ Le rôle est "ROLE_USER"
- ✅ Un ID est généré

---

### 2. Connexion (Login)

**Méthode** : `POST`  
**URL** : `{{base_url}}/auth/login`  
**Headers** :
```
Content-Type: application/json
```

**Body** (raw JSON) :
```json
{
    "email": "test@example.com",
    "password": "Password123!"
}
```

**Réponse attendue** (200 OK) :
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
        "id": 1,
        "email": "test@example.com",
        "role": "ROLE_USER"
    },
    "expiresIn": 3600
}
```

**Actions après le test** :
1. Copier le `token` de la réponse
2. Créer une variable d'environnement dans Postman :
   - Variable : `auth_token`
   - Valeur : (coller le token)

Ou ajouter un script dans l'onglet "Tests" :
```javascript
pm.test("Save token", function() {
    var jsonData = pm.response.json();
    pm.environment.set("auth_token", jsonData.token);
});
```

---

### 3. Récupérer le profil utilisateur (Protected Route)

**Méthode** : `GET`  
**URL** : `{{base_url}}/users/1`  
**Headers** :
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Réponse attendue** (200 OK) :
```json
{
    "id": 1,
    "email": "test@example.com",
    "role": "ROLE_USER",
    "createdAt": "2026-01-12T10:30:00+00:00"
}
```

**Tests à vérifier** :
- ✅ Status code : 200
- ✅ Les données utilisateur sont retournées

---

### 4. Test d'erreur - Login avec mauvais mot de passe

**Méthode** : `POST`  
**URL** : `{{base_url}}/auth/login`  
**Body** :
```json
{
    "email": "test@example.com",
    "password": "wrongpassword"
}
```

**Réponse attendue** (401 Unauthorized) :
```json
{
    "error": "Identifiants invalides"
}
```

---

### 5. Test d'erreur - Accès sans token

**Méthode** : `GET`  
**URL** : `{{base_url}}/users/1`  
**Headers** :
```
Content-Type: application/json
```
(PAS de Authorization header)

**Réponse attendue** (401 Unauthorized) :
```json
{
    "error": "Authentication failed",
    "message": "Invalid JWT token"
}
```

---

### 6. Inscription d'un Admin

**Méthode** : `POST`  
**URL** : `{{base_url}}/auth/register`  
**Body** :
```json
{
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "ROLE_ADMIN"
}
```

**Réponse attendue** (201 Created)

Puis se connecter avec ce compte admin pour obtenir un token admin.

---

## Scénarios de Test Complets

### Scénario 1 : Cycle complet utilisateur
1. ✅ Register un nouvel utilisateur
2. ✅ Login avec cet utilisateur
3. ✅ Récupérer son profil avec le token
4. ✅ Essayer d'accéder sans token (doit échouer)

### Scénario 2 : Gestion des erreurs
1. ✅ Login avec email inexistant
2. ✅ Login avec mauvais mot de passe
3. ✅ Register avec email déjà existant
4. ✅ Accéder à une route protégée sans token

---

## Scripts Postman pour Automatisation

### Dans l'onglet "Tests" de la requête Login :
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("auth_token", jsonData.token);
});

pm.test("Response has user data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.exist;
    pm.expect(jsonData.user.email).to.exist;
});
```

### Dans l'onglet "Tests" de la requête Register :
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("User created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.eql("Utilisateur créé avec succès");
    pm.expect(jsonData.user.id).to.exist;
});
```

---

## Codes de Statut HTTP

| Code | Signification | Quand l'utiliser           |
| ---- | ------------- | -------------------------- |
| 200  | OK            | Requête réussie            |
| 201  | Created       | Ressource créée (register) |
| 400  | Bad Request   | Données invalides          |
| 401  | Unauthorized  | Non authentifié            |
| 403  | Forbidden     | Pas les permissions        |
| 404  | Not Found     | Ressource inexistante      |
| 500  | Server Error  | Erreur serveur             |

---

## Dépannage

### Le serveur ne répond pas
```bash
# Vérifier que le serveur tourne
symfony server:status

# Redémarrer le serveur
symfony server:stop
symfony server:start
```

### Erreur 500
```bash
# Vider le cache
php bin/console cache:clear

# Vérifier les logs
tail -f var/log/dev.log
```

### Token invalide
- Vérifier que le token n'a pas expiré (3600 secondes par défaut)
- Se reconnecter pour obtenir un nouveau token
- Vérifier que le header Authorization est bien formaté : `Bearer {token}`

### Base de données
```bash
# Réinitialiser la base
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

---

## Collection Postman à Importer

Créez un fichier `Homi_API.postman_collection.json` :

```json
{
    "info": {
        "name": "Homi Backend API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Auth",
            "item": [
                {
                    "name": "Register",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"email\": \"test@example.com\",\n    \"password\": \"Password123!\",\n    \"role\": \"ROLE_USER\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/auth/register",
                            "host": ["{{base_url}}"],
                            "path": ["auth", "register"]
                        }
                    }
                },
                {
                    "name": "Login",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"email\": \"test@example.com\",\n    \"password\": \"Password123!\"\n}"
                        },
                        "url": {
                            "raw": "{{base_url}}/auth/login",
                            "host": ["{{base_url}}"],
                            "path": ["auth", "login"]
                        }
                    }
                }
            ]
        },
        {
            "name": "Users",
            "item": [
                {
                    "name": "Get User",
                    "request": {
                        "method": "GET",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{auth_token}}"
                            }
                        ],
                        "url": {
                            "raw": "{{base_url}}/users/1",
                            "host": ["{{base_url}}"],
                            "path": ["users", "1"]
                        }
                    }
                }
            ]
        }
    ]
}
```

**Pour importer** :
1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner le fichier JSON
4. La collection sera prête à l'emploi

---
## Checklist Complète de Tests
✅ Authentification
 Register user
 Register admin
 Login user
 Login admin
 Login avec mauvais mot de passe
 Register avec email existant
✅ Utilisateurs
 Get user profile (owner)
 Get user profile (admin)
 List users (admin only)
 Update user profile
 Delete user (admin only)
 Access denied (user trying admin route)
✅ Domiciles
 Create domicile
 List user domiciles
 Get domicile details
 Update domicile
 Delete domicile
 Add executor
 List executors
 Remove executor
 Access denied (non-owner/executor)
✅ Tâches
 Create task
 List tasks
 Filter tasks by domicile
 Filter tasks by status
 Get task details
 Update task
 Update task status only
 Assign task to user
 Delete task
 Access denied (non-authorized user)
✅ Tests d'Erreurs
 401 - No token
 401 - Invalid token
 401 - Expired token
 403 - Insufficient permissions
 404 - Resource not found
 400 - Invalid data
 400 - Validation errors
 
## Checklist Finale

- [ ] Serveur Symfony démarré
- [ ] Base de données créée et migrée
- [ ] Postman installé et configuré
- [ ] Variable `base_url` définie
- [ ] Test Register réussi
- [ ] Test Login réussi
- [ ] Token sauvegardé
- [ ] Test route protégée réussi
- [ ] Tests d'erreur validés

**Bon test ! 🚀**