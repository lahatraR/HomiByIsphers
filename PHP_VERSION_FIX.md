# Fix PHP Version Mismatch - Composer Dependencies

## ❌ Problème Rencontré

```
Error: Your lock file does not contain a compatible set of packages.
- symfony/* v8.0.* requires php >=8.4
- Your php version (8.2.30) does not satisfy that requirement.
```

## 🔍 Cause du Problème

**Incompatibilité de version PHP** entre les environnements :

| Environnement | Version PHP | Status |
|---------------|-------------|--------|
| **Développement local** | 8.4 | ✅ OK |
| **Dockerfile (Render)** | 8.4 | ✅ OK |
| **GitHub Actions** | 8.2 | ❌ ERREUR |
| **composer.lock** | Généré avec 8.4 | - |

### Pourquoi ça pose problème ?

1. Le projet utilise **Symfony 8.0** qui requiert **PHP ≥8.4**
2. `composer.lock` a été généré avec PHP 8.4
3. GitHub Actions (CI/CD) utilisait PHP 8.2
4. Lors du `composer install`, les dépendances ne peuvent pas être installées

## ✅ Solution Appliquée

### Mise à jour de GitHub Actions

**Fichier**: `.github/workflows/backend-ci.yml`

**AVANT** :
```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '8.2'  # ❌ Trop vieux
```

**APRÈS** :
```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '8.4'  # ✅ Compatible avec Symfony 8
```

## 📋 Vérification des Versions

### composer.json
```json
{
  "require": {
    "php": ">=8.2",  // Accepte 8.2+, mais Symfony 8 demande 8.4+
    "symfony/framework-bundle": "8.0.*",  // Requiert PHP 8.4
    // ...
  }
}
```

### Dockerfile
```dockerfile
FROM php:8.4-fpm  # ✅ Correct
```

### GitHub Actions
```yaml
php-version: '8.4'  # ✅ Maintenant correct
```

## 🧪 Comment Tester

### 1. Vérifier la version PHP localement
```bash
cd homi_backend
php -v
# Devrait afficher: PHP 8.4.x
```

### 2. Vérifier composer.json
```bash
cd homi_backend
composer check-platform-reqs
```

### 3. Test GitHub Actions
Une fois pushé, GitHub Actions devrait réussir :
```bash
git add .github/workflows/backend-ci.yml
git commit -m "fix: update GitHub Actions to use PHP 8.4"
git push
```

Vérifiez sur : https://github.com/LahatRar/HomiByIsphers/actions

## 🔧 Si le Problème Persiste

### Option A: Forcer la régénération du lock file
```bash
cd homi_backend
composer update --lock
git add composer.lock
git commit -m "chore: regenerate composer.lock with PHP 8.4"
git push
```

### Option B: Downgrader à Symfony 7 (non recommandé)
Si vous ne pouvez pas utiliser PHP 8.4 partout :
```bash
cd homi_backend
composer require "symfony/framework-bundle:^7.0" --with-all-dependencies
composer require "symfony/security-bundle:^7.0" --with-all-dependencies
# etc pour tous les packages Symfony
```

**Note**: Symfony 7 requiert PHP ≥8.2, mais Symfony 8 offre de meilleures fonctionnalités.

## 📦 Packages Affectés

Packages requérant PHP 8.4 :
- **Symfony 8.0.\*** : Tous les composants
- **Doctrine** 3.2.2+
- **PHPUnit** 12.5+
- **Sebastian** packages (dépendances de PHPUnit)

Packages requérant PHP 8.3+ :
- **lcobucci/clock** 3.5.0
- PHPUnit et composants Sebastian

## 🎯 Configuration Recommandée

### Pour un projet Symfony 8

**Minimum** :
```json
{
  "require": {
    "php": ">=8.4"
  }
}
```

**Recommandé** :
```json
{
  "require": {
    "php": "^8.4"
  },
  "config": {
    "platform": {
      "php": "8.4"
    }
  }
}
```

## 🚨 Bonnes Pratiques

### 1. Cohérence des versions PHP
Assurez-vous que **toutes** les configurations utilisent la même version majeure :
- ✅ Dockerfile
- ✅ GitHub Actions
- ✅ composer.json
- ✅ Render (via Docker)
- ✅ Environnement local

### 2. Utiliser Docker en CI
Au lieu de setup-php, utilisez le même Dockerfile :
```yaml
- name: Build Docker image
  run: docker build -t backend ./homi_backend

- name: Run tests in Docker
  run: docker run backend php bin/phpunit
```

### 3. Documenter les prérequis
Dans le README :
```markdown
## Prérequis
- PHP 8.4+
- Composer 2.x
- PostgreSQL 16+
```

## 📝 Fichiers Modifiés

1. `.github/workflows/backend-ci.yml` - PHP 8.2 → 8.4

## 🔗 Ressources

- [Symfony 8 Requirements](https://symfony.com/doc/current/setup.html#technical-requirements)
- [PHP 8.4 Release Notes](https://www.php.net/releases/8.4/en.php)
- [Composer Platform Packages](https://getcomposer.org/doc/06-config.md#platform)

---

✅ **Status** : Corrigé - GitHub Actions utilise maintenant PHP 8.4
📅 **Date** : 22 janvier 2026
