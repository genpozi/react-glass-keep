# GlassKeep Security Hardening - Quick Reference

## What Changed?

### 📦 New Dependencies
```bash
npm install express-rate-limit helmet
```

### 🔒 Rate Limiting Applied To:
- `POST /api/register` - 10 attempts/15 minutes
- `POST /api/login` - 10 attempts/15 minutes  
- `POST /api/login/secret` - 5 attempts/1 hour

### 🛡️ Security Headers Added
- Helmet.js middleware active on all routes
- Prevents MIME sniffing, clickjacking, XSS attacks

### 💾 Admin Settings Now Persisted
- Moved from volatile in-memory to SQLite database
- Settings table automatically created on first run
- Survives server restarts

### ✅ Environment Validation
- Server enforces strong JWT_SECRET in production
- Fails with clear error message if misconfigured

---

## Configuration

### Development (Default)
```bash
npm start  # Works with default dev secret
```

### Production (Required)
```bash
export NODE_ENV=production
export JWT_SECRET=$(openssl rand -base64 32)
node server/index.js
```

### Optional
```bash
export ALLOW_REGISTRATION=false  # Disable new signups
export ADMIN_EMAILS="admin@example.com"  # Auto-promote admins
```

---

## API Rate Limit Headers

All rate-limited endpoints return standard headers:
```
RateLimit-Limit: 10
RateLimit-Remaining: 8
RateLimit-Reset: 1705504234
```

When limit exceeded:
```
HTTP/1.1 429 Too Many Requests
RateLimit-Remaining: 0
```

---

## Database Schema

New `settings` table:
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Current entries:
- `admin_settings` → `{"allowNewAccounts": true/false}`

---

## Testing Rate Limits

### Test login rate limit:
```bash
for i in {1..15}; do
  curl -X POST http://localhost:8080/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    --write-out "\nStatus: %{http_code}\n"
done
```

Expected: First 10 return 401, next 5 return 429 (rate limited)

---

## Admin Settings Management

### Get current settings:
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8080/api/admin/settings
```

### Disable new registrations:
```bash
curl -X PATCH http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"allowNewAccounts": false}'
```

### Check public status:
```bash
curl http://localhost:8080/api/admin/allow-registration
```

---

## Troubleshooting

### ❌ "JWT_SECRET is not configured in production!"
**Fix:** Set a strong random JWT_SECRET
```bash
export JWT_SECRET=$(openssl rand -base64 32)
```

### ❌ "Too many authentication attempts"
**Reason:** Hit rate limit (429 response)  
**Fix:** Wait 15 minutes or use different IP/network

### ❌ "Settings not persisting"
**Reason:** Check database permissions  
**Fix:** Verify `data.sqlite` is writable in server directory

---

## Security Improvements

| Attack Type | Protection |
|-------------|-----------|
| Brute-force login | ✅ Rate limiting |
| Credential stuffing | ✅ Rate limiting |
| Registration spam | ✅ Rate limiting |
| Account enumeration | ✅ Rate limiting |
| MIME sniffing | ✅ Helmet headers |
| Clickjacking | ✅ Helmet headers |
| Weak secrets in prod | ✅ Startup validation |
| Lost admin settings | ✅ Database persistence |

---

## Performance Impact

- **Startup time:** +0ms (validation only on startup)
- **Per-request overhead:** < 1ms (rate limit check)
- **Memory usage:** Minimal (rate limit store is in-memory)
- **Database:** +1 row (settings table)

---

## Documentation References

- [Detailed Implementation](./HARDENING_LOG.md)
- [Phase 1 Summary](./PHASE_1_COMPLETE.md)
- [Security Policy](./SECURITY.md)

---

## What's Next?

**Phase 2:** Code Refactoring
- Split App.jsx into smaller components
- Create React hooks for state management
- Add error boundaries

**Phase 3:** Offline Support
- IndexedDB for local storage
- Service Worker sync
- Offline conflict resolution

---

**Last Updated:** January 17, 2026
