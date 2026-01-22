# Configuration du Cron Job Render

## Problème Résolu

✅ **Les emails ne bloquent plus la réponse HTTP**

- **Avant**: Registration prenait 60+ secondes (408 timeout)
- **Après**: Registration prend <200ms
- **Les emails**: Enqueued en base et envoyés async via cron

## Architecture

```
1. Frontend → POST /auth/register
2. Backend (110ms):
   - Crée l'utilisateur
   - Enqueue en PendingEmail table
   - Retourne 201 OK immédiatement
3. Render cron (toutes les 5 minutes):
   - Exécute: app:send-pending-emails --limit=10
   - Envoie les emails de la queue
   - Marque comme sentAt ou failureReason
```

## Configuration sur Render

### 1. Créer le Cron Job

1. Aller dans **Dashboard Render** → **Backend Service**
2. Aller à l'onglet **Cron Jobs**
3. Cliquer sur **Add Cron Job**

**Configuration:**
```
Schedule: */5 * * * *
(toutes les 5 minutes)

Command:
/bin/bash -c "cd /app && php bin/console app:send-pending-emails --limit=10"

Notifications: Email (pour les erreurs)
```

### 2. Alternative: Scheduled Job

Si "Cron Jobs" n'existe pas, utiliser un **Scheduled Job**:

1. Dashboard → Service
2. **Environment** → **Create Scheduled Job**

```
Name: send-pending-emails
Schedule: */5 * * * *
Command: php bin/console app:send-pending-emails --limit=10
Runtime: Node
```

### 3. Tester Manuellement

Pour vérifier que ça marche, on peut tester en créant un utilisateur:

```bash
# Sur Render shell:
php bin/console app:send-pending-emails --limit=10 --verbose
```

## Logs

Les emails envoyés apparaîtront dans:
- **Render Dashboard** → Service → Logs
- Ou: `php bin/console app:send-pending-emails --verbose`

Exemple de log:
```
💾 Saving email to queue
✅ Email queued in database
🔍 [Email] Looking up user
📤 [Email] Sending via mailer
✅ [Email] Email sent successfully!
```

## Monitoring

### Vérifier les emails en attente:

```php
// Dans un command ou controller:
$pendingEmails = $em->getRepository(PendingEmail::class)->findPending();
echo count($pendingEmails) . " emails pending";
```

### Vérifier les échecs:

```php
$failedEmails = $em->getRepository(PendingEmail::class)->findFailed();
foreach ($failedEmails as $email) {
    echo $email->getEmail() . ": " . $email->getFailureReason();
}
```

## Paramètres du Command

```bash
# Envoyer jusqu'à 20 emails
php bin/console app:send-pending-emails --limit=20

# Verbose mode (affiche les logs détaillés)
php bin/console app:send-pending-emails --verbose

# Sec mode (silencieux)
php bin/console app:send-pending-emails --no-interaction
```

## Recommandations

1. **Fréquence**: Tous les 5 minutes (--limit=10)
   - Bonne balance entre latence et performance
   
2. **Limite**: 10 emails par run
   - Suffisant pour la plupart des cas
   - Évite les timeouts longs
   
3. **Monitoring**: Vérifier les logs chaque jour
   - S'il y a des échecs, augmenter le --limit
   - S'il y a du backlash, diminuer la fréquence

## Troubleshooting

### "Command not found"

Vérifier que le fichier existe:
```bash
ls src/Command/SendPendingEmailsCommand.php
```

### "Table pending_email not found"

La migration n'a pas été exécutée. Sur Render, les migrations se lancent auto-magiquement, mais tu peux forcer:
```bash
php bin/console doctrine:migrations:migrate --env=prod
```

### Aucun email envoyé

1. Vérifier qu'il y a des emails en attente:
```php
$count = $em->getRepository(PendingEmail::class)->findPending();
```

2. Vérifier le MAILER_DSN:
```bash
php bin/console config:dump mailer
```

3. Envoyer un test:
```bash
php bin/console app:send-pending-emails --limit=1 --verbose
```

## Prochaines Étapes

1. ✅ Push les changements (DONE)
2. ⏳ Render redéploie automatiquement (2-5 min)
3. ⏳ Créer le cron job sur Render
4. ⏳ Tester: Register → Check logs → Vérifier email reçu (5 min max)
5. ⏳ Monitorer les premiers jours
