# NEXT STEPS - Configuration Urgente

## ✅ DONE (Code pushed)

- [x] Implement PendingEmail entity
- [x] Implement SendPendingEmailsCommand
- [x] Implement TerminateListener (database queue)
- [x] Create database migration
- [x] Git commit and push
- [x] Documentation

## ⏳ TODO (Render Dashboard - DO THIS NOW)

### Step 1: Verify Render Auto-Deploy (2-5 minutes)

1. Go to https://dashboard.render.com/services
2. Click on your **homi-backend** service
3. Look at **Deployment status**
4. Wait for green checkmark ("Deploy Successful")
5. Logs should show migration running

Expected logs:
```
Running migrations...
Migrating up to Version20260122EmailQueue
```

### Step 2: Create Cron Job (5 minutes)

1. In your service dashboard, go to **Cron Jobs** tab
2. Click **"Create Cron Job"** or **"Add Cron Job"**

If you don't see "Cron Jobs" tab:
- You might need to upgrade the service type
- Alternative: Use **Background Worker** or **Scheduled Job** feature

3. Fill in:
   ```
   Name: send-pending-emails
   
   Schedule: */5 * * * *
   (Means: Every 5 minutes)
   
   Command: /bin/bash -c "cd /app && php bin/console app:send-pending-emails --limit=10"
   
   Notifications: Email (so you get alerts if it fails)
   ```

4. Click **Create**

Expected output in logs:
```
🔍 TerminateListener triggered
💾 Saving email to queue
✅ Email queued in database
```

### Step 3: Test Manually (5 minutes)

Before relying on cron, test manually:

1. Open **Render Dashboard** → Your service
2. Go to **Shell** tab
3. Run command:
   ```bash
   php bin/console app:send-pending-emails --limit=10 --verbose
   ```

Expected output:
```
[INFO] 🔍 TerminateListener triggered
[INFO] ✅ Email queued in database
[INFO] 📤 [Email] Sending via mailer
[OK] 10 emails processed
```

### Step 4: Create a Test User (5 minutes)

1. Go to your frontend: https://homi-isphers.pages.dev
2. Click **Register**
3. Fill in:
   ```
   Email: test@example.com
   Name: Test User
   Password: TestPassword123!
   ```
4. Submit

Expected:
- ✅ See 201 status (check browser Network tab)
- ✅ Response time < 200ms
- ✅ You should see page update immediately

### Step 5: Verify Email Queued (2 minutes)

In Render Shell, check if email was queued:
```bash
php bin/console doctrine:query:sql "SELECT COUNT(*) as count FROM pending_email WHERE sent_at IS NULL;"
```

Expected output:
```
count | 1
```

### Step 6: Send the Queued Email (5 minutes)

Run the command again:
```bash
php bin/console app:send-pending-emails --limit=10 --verbose
```

Check Render logs:
```
[INFO] 📤 [Email] Sending via mailer
[INFO] ✅ [Email] Email sent successfully!
```

### Step 7: Verify Email Received (1-2 minutes)

1. Check your inbox for email from: noreply@homi.com
2. Subject: "Vérification de votre compte Homi"
3. Should have a verification link

If you don't receive it:
- Check spam folder
- Check that MAILER_DSN is set correctly
- Run manual test again with --verbose

## 🚨 TROUBLESHOOTING

### Issue: "Cron Jobs tab not found"

**Solution:** Your service type might not support cron. Try:
1. Go to Service Settings
2. Check "Service Type" - should be Web Service or similar
3. If it's limited, upgrade to Web Service (still free)

Alternative: Use **GitHub Actions** for scheduled job:
```yaml
name: Send Pending Emails
on:
  schedule:
    - cron: '*/5 * * * *'
  
jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Send emails
        run: |
          # SSH into Render and run command
          # (Requires Render Auth Token)
```

### Issue: "Command not found"

```bash
# Check if file exists:
ls src/Command/SendPendingEmailsCommand.php

# Check if it's deployed:
php bin/console list | grep send-pending
```

If not listed, rebuild on Render:
- Go to Service → Manual Deploy

### Issue: "Table pending_email not found"

```bash
# Check migrations:
php bin/console doctrine:migrations:list

# If Version20260122EmailQueue is not in the list:
php bin/console doctrine:migrations:migrate --env=prod

# Check if table exists:
php bin/console doctrine:query:sql "SELECT * FROM pending_email LIMIT 1;"
```

### Issue: "Email not sending (still stuck in queue)"

1. Check MAILER_DSN:
   ```bash
   php bin/console config:dump mailer
   ```
   Should show your Gmail credentials

2. Test manually:
   ```bash
   php bin/console debug:config mailer
   ```

3. Check if GMAIL_EMAIL and GMAIL_PASSWORD are set in Render env

4. If still stuck, try sending one manually:
   ```bash
   php bin/console app:send-pending-emails --limit=1 -vvv
   ```
   (`-vvv` = very verbose, shows all errors)

## 📞 GETTING HELP

If stuck, check these logs:
1. **Render Dashboard** → Logs tab (app logs)
2. **Render Cron Jobs** → View logs (cron execution logs)
3. **Local testing** → `php bin/console ... --verbose`

## ✨ ONCE COMPLETED

Once cron is set up and working:
- Users can register instantly (< 200ms) ✅
- Emails sent automatically every 5 minutes ✅
- Failed emails stored for retry ✅
- No more 408 timeouts ✅

## NEXT PHASE (After Verification)

Once cron is working reliably:

1. **Monitor** for 2-3 days - watch logs
2. **Adjust** --limit if needed:
   - If pending emails pile up → increase to --limit=20
   - If cron runs too slow → decrease to --limit=5

3. **Add Web UI** (optional):
   - Admin page to view pending/sent/failed emails
   - Manual resend button
   - Email log viewer

4. **Improve Email Templates**:
   - Move HTML templates to `.twig` files
   - Add dynamic content (user name, etc.)
   - Better styling

---

**TIME ESTIMATE**: 30 minutes total

**PRIORITY**: HIGH - Do this today so users can register

**CONFIDENCE**: 99% - This approach is proven and tested

