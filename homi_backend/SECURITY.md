# Politique de sécurité

## Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans le backend Homi.

## Authentification et Autorisation

### JWT (JSON Web Tokens)

- **Algorithme:** HMAC-SHA256
- **Expiration:** 3600 secondes (configurable via JWT_EXPIRATION)
- **Signature:** Utilise APP_SECRET
- **Format:** `Authorization: Bearer {token}`

### Hachage des mots de passe

- **Algorithme:** Argon2id (plus sécurisé que bcrypt)
- **Coût:** Configuré pour équilibrer sécurité et performance
- **Stockage:** Jamais en clair

### Rôles

- `ROLE_USER` - Utilisateur standard
- `ROLE_ADMIN` - Administrateur avec accès complet
- `ROLE_EXECUTOR` - Exécutant de tâches

### Permissions

- Un utilisateur peut voir/modifier ses propres ressources
- Seul le propriétaire d'un domicile peut ajouter des exécutants
- Seul un admin peut lister tous les utilisateurs
- Seul l'exécutant d'une tâche peut la marquer comme terminée

## Validation des données

### Entrées

- Validation JSON avec Symfony Validator
- Email validé avec regex email stricte
- Mot de passe minimum 8 caractères avec complexité
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial (@$!%*?&)
- Dates validées au format ISO 8601

### Sorties

- Pas d'exposition de mot de passe en API
- Pas d'exposuredu stack trace en production
- Messages d'erreur génériques pour l'utilisateur
- Logs détaillés pour les administrateurs

## CORS (Cross-Origin Resource Sharing)

```yaml
nelmio_cors:
    paths:
        '^/api/':
            allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
            allow_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
            allow_headers: ['Content-Type', 'Authorization']
```

À configurer en production :
```env
CORS_ALLOW_ORIGIN='^https://yourdomain\.com$'
```

## Protection CSRF

- Activée pour les formulaires (non applicable aux tokens JWT)
- Headers de validation disponibles

## Sessions et Cookies

- Sessions désactivées pour API stateless
- Cookies HTTP-only si utilisés
- SameSite=Lax pour prévenir les attaques

## Base de données

### Contraintes

- Email UNIQUE sur la table user
- NOT NULL sur tous les champs sensibles
- Clés étrangères avec intégrité référentielle

### SQL Injection

- Utilisation de Doctrine ORM (paramètres bindés)
- Pas de requêtes SQL brutes en production
- Validations en base de données

### Confidentialité

- Pas de données sensibles en logs
- Passwords jamais affichés
- PII (Personally Identifiable Information) chiffré si possible

## Logging

### Niveaux

- DEBUG: En dev uniquement
- INFO: Actions importantes
- WARNING: Comportements suspects
- ERROR: Erreurs critiques

### Données loggées

✅ Authenfication (login/logout)
✅ Modifications de données (qui, quoi, quand)
✅ Erreurs et exceptions
✅ Accès refusé (403, 401)

❌ Pas de mots de passe
❌ Pas d'informations techniques sensibles
❌ Pas d'emails en production

## Headers de sécurité

À ajouter en production:

```php
return $response
    ->headers->set('X-Content-Type-Options', 'nosniff')
    ->headers->set('X-Frame-Options', 'DENY')
    ->headers->set('X-XSS-Protection', '1; mode=block')
    ->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

## Secrets et Configuration

### Variables sensibles

Ne jamais stocker en clair:
- APP_SECRET
- DATABASE_PASSWORD
- Clés API tierces
- Credentials SMTP

Utiliser Symfony Secrets:
```bash
php bin/console secrets:set DATABASE_PASSWORD
php bin/console secrets:list --reveal
```

### Rotation

- Changer APP_SECRET régulièrement
- Rotation des tokens au login
- Renouvellement des certificats SSL

## Gestion des erreurs

### Développement

Afficher les détails complets pour déboguer

### Production

Afficher des messages génériques:
```json
{
  "error": "Une erreur interne est survenue",
  "message": "Veuillez contacter le support"
}
```

Logs détaillés uniquement pour administrateurs

## Dépendances et mises à jour

### Audit

```bash
# Vérifier les vulnérabilités
composer audit

# Mettre à jour les dépendances
composer update
```

### Politique

- Surveiller Symfony Security Advisories
- Mises à jour mensuelles minimum
- Correctifs de sécurité appliqués immédiatement

## Tests de sécurité

### Avant déploiement

```bash
# Tests unitaires
php bin/phpunit

# Linter PHP
php bin/phpstan analyze src/

# Vérifier les dépendances
composer audit
```

### En production

- Monitoring continu des logs
- Alertes sur patterns suspects
- Backups réguliers testés

## Incident Security

En cas de breach potentiel:

1. **Isoler** le système affecté
2. **Enquêter** pour identifier la cause
3. **Mitiger** les dégâts immédiatement
4. **Notifier** les utilisateurs affectés
5. **Corriger** et déployer un patch
6. **Documenter** l'incident pour apprentissage

Contacts:
- Security Lead: [À définir]
- On-call: [À définir]

## Conformité

### RGPD (EU)

- ✅ Consentement pour cookies
- ✅ Droit à l'oubli (soft delete)
- ✅ Portabilité des données
- ✅ Notification de breach

### Audit

- Logs disponibles pour 90 jours
- Trace de qui a accédé à quoi
- Historique des modifications

## Ressources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Symfony Security](https://symfony.com/doc/current/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

**Dernière révision:** 12 Janvier 2025
**Version:** 1.0
