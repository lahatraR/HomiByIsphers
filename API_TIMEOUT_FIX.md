# Fix API Timeout & CORS Issues - Render Deployment

## Problem Description

The frontend was experiencing multiple connection errors when trying to connect to the backend on Render:
1. **Timeout errors**: "timeout of 10000ms exceeded" 
2. **404 errors**: on login endpoint
3. **CORS errors**: "The 'Access-Control-Allow-Origin' header contains multiple values"
4. Backend cold starts taking 30+ seconds on Render free tier

## Root Causes

1. **Timeout too short**: Frontend timeout was set to 10 seconds, but Render free tier can take 30-60 seconds for cold starts
2. **Missing root health endpoint**: Root path (/) returned 404, making it harder to verify backend status
3. **Poor error messaging**: Timeout errors weren't clearly communicated to users
4. **CORS double configuration**: Both NGINX and Nelmio CORS were adding headers, causing conflicts

## Solutions Applied

### 1. Frontend Changes (`homi_frontend/src/services/api.ts`)

**Increased API timeout from 10s to 60s:**
```typescript
timeout: 60000, // 60 seconds for Render cold starts
```

**Improved timeout error handling:**
```typescript
// Handle timeout errors
if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
  apiError.message = 'Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.';
  apiError.status = 408; // Request Timeout
}
```

### 2. Backend Changes

**Added root health check endpoint** (`homi_backend/src/Controller/HealthController.php`):
```php
#[Route('/', name: 'root_health', methods: ['GET', 'HEAD'])]
public function rootHealth(): JsonResponse
{
    return $this->json([
        'status' => 'ok',
        'service' => 'Homi Backend API',
        'timestamp' => date('c')
    ], Response::HTTP_OK);
}
```

**Updated security configuration** (`homi_backend/config/packages/security.yaml`):
- Added root firewall exception
- Added public access for root path

**Fixed CORS double configuration**:
- **Removed CORS headers from NGINX** (`homi_backend/docker/nginx.conf`): Deleted all `add_header 'Access-Control-*'` directives
- **Updated Nelmio CORS config** (`homi_backend/config/packages/nelmio_cors.yaml`): Changed path from `^/api/` to `^/` to cover all routes including root

## Testing the Fix

### Backend Health Check
```powershell
# Test root endpoint
Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/" -UseBasicParsing

# Test API health endpoint
Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/api/health" -UseBasicParsing

# Test login endpoint (should return 401 with invalid credentials)
$body = @{email="test@example.com"; password="test"} | ConvertTo-Json
Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/api/auth/login" `
  -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

### Expected Results
- Root endpoint: 200 OK with service info
- Health endpoint: 200 OK with status
- Login endpoint: 401 Unauthorized (if credentials are wrong)

## Deployment Steps

1. **Deploy Backend Changes:**
   ```bash
   cd homi_backend
   git add .
   git commit -m "fix: increase timeout handling and add root health endpoint"
   git push
   ```
   - Render will automatically deploy the changes
   - Wait for deployment to complete (check Render dashboard)

2. **Deploy Frontend Changes:**
   ```bash
   cd homi_frontend
   npm run build
   git add .
   git commit -m "fix: increase API timeout to 60s for Render cold starts"
   git push
   ```
   - GitHub Pages will automatically deploy

## Render Free Tier Considerations

### Cold Start Behavior
- **First request after sleep**: 30-60 seconds
- **Subsequent requests**: Fast (< 1 second)
- **Sleep timer**: 15 minutes of inactivity

### Best Practices
1. **Use keep-alive pings**: Consider implementing a cron job to ping the backend every 10 minutes
2. **Show loading indicators**: Display "Réveiller le serveur..." message for first login
3. **Implement retry logic**: Automatically retry failed requests once
4. **Monitor response times**: Use Render's dashboard to track cold start frequency

## Troubleshooting

### If timeout persists:

1. **Check backend status:**
   ```powershell
   Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/api/health" -UseBasicParsing
   ```

2. **Check Render logs:**
   - Go to Render dashboard
   - Select "homi-backend" service
   - View "Logs" tab
   - Look for startup errors or slow queries

3. **Verify environment variables:**
   - Check `FRONTEND_URL` matches GitHub Pages URL
   - Verify `DATABASE_URL` is correctly connected
   - Confirm `CORS_ALLOW_ORIGIN` allows your frontend domain

4. **Test locally:**
   ```bash
   cd homi_backend
   docker compose up
   ```
   Then test with `http://localhost:8000`

### If 404 errors persist:

1. **Check route configuration:**
   ```bash
   cd homi_backend
   php bin/console debug:router | grep auth
   ```

2. **Verify CORS settings:**
   - Check `config/packages/nelmio_cors.yaml`
   - Ensure frontend URL is whitelisted
   - **IMPORTANT**: Make sure NGINX doesn't add CORS headers (conflict with Nelmio)

3. **Test CORS manually:**
   ```powershell
   $headers = @{
     'Origin' = 'https://lahatrar.github.io'
     'Access-Control-Request-Method' = 'POST'
     'Access-Control-Request-Headers' = 'Content-Type, Authorization'
   }
   Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/api/auth/login" `
     -Method OPTIONS -Headers $headers -UseBasicParsing
   ```
   Should return 204 with proper CORS headers.

4. **Check nginx configuration:**
   - Verify `docker/nginx.conf` has NO `add_header 'Access-Control-*'` directives
   - Ensure all requests are routed to `index.php`

## Performance Optimization

### Future Improvements
1. **Upgrade to Render paid tier**: Eliminates cold starts
2. **Implement caching**: Redis for session/token caching
3. **Optimize database queries**: Add indexes, reduce N+1 queries
4. **Use CDN**: Cache static assets
5. **Implement request queuing**: Handle multiple simultaneous cold-start requests

## Monitoring

### Key Metrics to Track
- Average response time
- Cold start frequency
- 5xx error rate
- Timeout occurrence rate

### Recommended Tools
- Render Dashboard (built-in metrics)
- Sentry (error tracking)
- New Relic or DataDog (APM)
- UptimeRobot (uptime monitoring)

## Related Files
- [homi_frontend/src/services/api.ts](homi_frontend/src/services/api.ts)
- [homi_frontend/src/pages/LoginPage.tsx](homi_frontend/src/pages/LoginPage.tsx)
- [homi_backend/src/Controller/HealthController.php](homi_backend/src/Controller/HealthController.php)
- [homi_backend/config/packages/security.yaml](homi_backend/config/packages/security.yaml)
- [homi_backend/config/packages/nelmio_cors.yaml](homi_backend/config/packages/nelmio_cors.yaml) ⚠️ **CORS FIX**
- [homi_backend/docker/nginx.conf](homi_backend/docker/nginx.conf) ⚠️ **CORS FIX**
- [render.yaml](homi_backend/render.yaml)

## Status
✅ **Fixed** - Timeout and CORS issues resolved, ready for deployment

Last Updated: January 22, 2026
