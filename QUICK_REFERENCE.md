# QUICK REFERENCE CARD

## 🚀 START HERE

**Read this file first: `SYSTEM_EXPLAINED.md`** (Complete explanation)

Then use this card for quick lookup.

---

## HOW IT WORKS (30 Second Overview)

```
User fills form → JavaScript validates → Sends to backend API
→ Server validates → Stores in Neon database → User gets Campaign ID
→ Admin can access via API/SQL/Dashboard
```

---

## WHERE IS USER DATA?

| Item | Location |
|------|----------|
| Database | Neon PostgreSQL (AWS us-east-1) |
| Tables | campaigns, admin_users, audit_logs |
| Connection | SSL/TLS encrypted |
| Backups | Daily automatic |
| Status | 24/7 running |

---

## HOW TO GET DATA (3 METHODS)

### Method 1: API (Easiest)

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"admin","password":"SecurePassword123!"}'
```

**Get campaigns:**
```bash
curl http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN"
```

### Method 2: SQL

**Connect:**
```bash
psql "postgresql://neondb_owner:npg_N3sn0HgDfGtF@ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Query:**
```sql
SELECT * FROM campaigns;
SELECT * FROM audit_logs WHERE campaign_id = 'CAMP-xxx';
SELECT status, COUNT(*) FROM campaigns GROUP BY status;
```

### Method 3: Dashboard

1. Vercel Settings → Integrations → Neon → Manage
2. Open Neon Dashboard
3. Browse tables visually

---

## ADMIN CREDENTIALS

```
Username: admin
Email: admin@stellamartis.in
Password: SecurePassword123!
```

---

## API ENDPOINTS

**Public (No Token):**
- `POST /api/campaigns` - Submit campaign
- `POST /api/auth/register` - Create admin
- `POST /api/auth/login` - Get token
- `GET /api/health` - Check status

**Protected (Need Token):**
- `GET /api/campaigns` - Get all
- `GET /api/campaigns/:id` - Get one
- `PUT /api/campaigns/:id/status` - Update
- `GET /api/stats` - Statistics
- `GET /api/audit-logs/:id` - History

---

## DATABASE TABLES

### campaigns
```
id, campaign_id, organization, email, hardware, 
test_conditions, timeline, deliverables, spiti_travel, 
status, created_at
```

### admin_users
```
id, username, email, password_hash, is_admin, created_at
```

### audit_logs
```
id, campaign_id, action, changed_by, 
old_status, new_status, notes, created_at
```

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| index.html | User form page |
| form-handler.js | Form validation |
| server.js | Backend API |
| admin.html | Admin dashboard |
| .env | Configuration |
| SYSTEM_EXPLAINED.md | This explanation |

---

## DOCUMENTATION FILES

| File | Read When |
|------|-----------|
| **SYSTEM_EXPLAINED.md** | Want complete explanation |
| WHERE_IS_USER_DATA.md | Want to understand data access |
| DATABASE_GUIDE.md | Need SQL queries & API details |
| BACKEND_SUMMARY.md | Want system architecture |
| README_FINAL.md | Need quick overview |

---

## COMMON TASKS

### Get all campaigns
```bash
TOKEN="your-jwt-token"
curl http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN"
```

### Get one campaign
```bash
curl http://localhost:3000/api/campaigns/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"
```

### Update campaign status
```bash
curl -X PUT http://localhost:3000/api/campaigns/CAMP-xxx/status \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"approved","notes":"Approved for testing"}'
```

### View campaign history
```bash
curl http://localhost:3000/api/audit-logs/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"
```

### Get statistics
```bash
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## DATABASE QUERY EXAMPLES

```sql
-- Get all campaigns
SELECT * FROM campaigns ORDER BY created_at DESC;

-- Get pending campaigns
SELECT * FROM campaigns WHERE status = 'pending';

-- Get campaign history
SELECT * FROM audit_logs WHERE campaign_id = 'CAMP-xxx';

-- Get statistics
SELECT status, COUNT(*) as count FROM campaigns GROUP BY status;

-- Get campaigns by organization
SELECT * FROM campaigns WHERE organization LIKE '%ISRO%';

-- Get campaigns by date range
SELECT * FROM campaigns 
WHERE created_at >= '2026-06-01' AND created_at <= '2026-06-30';

-- Get campaigns with 10+ scientists
SELECT * FROM campaigns WHERE CAST(spiti_travel AS INTEGER) >= 10;
```

---

## WHAT HAPPENS WHEN USER SUBMITS FORM

1. Form loads on `http://localhost:3000`
2. User fills fields
3. JavaScript validates (form-handler.js)
4. User clicks submit
5. Data sent to `POST /api/campaigns`
6. Server validates
7. Campaign ID generated (CAMP-{timestamp})
8. Data inserted into database
9. Audit log created
10. Success response to user
11. User sees Campaign ID
12. Email sent (optional)

---

## WHAT'S IN THE DATABASE NOW

**1 Campaign:**
- Campaign ID: CAMP-1780326312348
- Organization: Indian Space Research Organisation
- Email: campaigns@isro.gov.in
- Hardware: Chandrayaan Lander with sensors
- Status: approved
- Date: 2026-06-01 15:05:12

**1 Admin Account:**
- Username: admin
- Email: admin@stellamartis.in
- Password: (bcrypt hashed)

**2 Audit Entries:**
- Created: 2026-06-01 15:05:12
- Status updated: 2026-06-01 15:10:45

---

## SERVER STATUS

```
✅ Server:     Running on port 3000
✅ Database:   Neon PostgreSQL CONNECTED
✅ API:        9 endpoints working
✅ Auth:       JWT tokens active
✅ Backups:    Automatic daily
✅ Status:     PRODUCTION READY
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Can't login | Check credentials (admin/SecurePassword123!) |
| API returns 401 | Get JWT token from /api/auth/login |
| API returns 403 | Token expired, login again |
| No data in database | Check if form was submitted successfully |
| Email not sent | Check .env file for email config |

---

## NEXT STEPS

1. Read `SYSTEM_EXPLAINED.md` (complete guide)
2. Test API endpoints (use curl commands above)
3. Check Neon Dashboard to see data visually
4. Deploy to Vercel when ready
5. Monitor database for new submissions

---

## SUPPORT

**Question: How does form submission work?**
→ Read SYSTEM_EXPLAINED.md section "HOW IT WORKS"

**Question: Where is my data?**
→ Read SYSTEM_EXPLAINED.md section "WHERE YOUR DATA LIVES"

**Question: How do I get campaigns?**
→ Read this file section "HOW TO GET DATA"

**Question: How does authentication work?**
→ Read DATABASE_GUIDE.md section "Authentication"

**Question: How do I deploy?**
→ Read DEPLOYMENT_GUIDE.md
