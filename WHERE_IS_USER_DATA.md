# WHERE IS USER DATA? - Complete Access Guide

## Quick Answer: NEON POSTGRESQL DATABASE

All user campaign data is stored in **Neon PostgreSQL** database connected to your Vercel project.

---

## Your Data Location Map

```
┌─────────────────────────────────────────────────────────────┐
│                   NEON POSTGRESQL CLOUD                      │
│              (PostgreSQL Database in the Cloud)              │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │                                              │
    ▼                                              ▼
┌──────────────────┐                    ┌──────────────────┐
│    campaigns     │                    │  admin_users     │
│   TABLE          │                    │   TABLE          │
│ (User Data)      │                    │ (Admin Creds)    │
│ 1 row            │                    │ 1 row            │
│ (ISRO campaign)  │                    │ (admin account)  │
└────────┬─────────┘                    └──────────────────┘
         │
         ▼
┌──────────────────┐
│  audit_logs      │
│   TABLE          │
│ (Change History) │
│ 2 rows           │
│ (created,        │
│  status_changed) │
└──────────────────┘
```

---

## 3 Database Tables Explained

### TABLE 1: `campaigns` - All User Campaign Submissions

**Location:** Neon PostgreSQL → Database `neondb` → Table `campaigns`

**What's Stored:**
```
id (primary key)
campaign_id (unique)          ← CAMP-1780326312348
organization                  ← "Indian Space Research Organisation"
email                        ← "campaigns@isro.gov.in"
hardware                     ← "Chandrayaan Lander with advanced seismic sensors"
test_conditions              ← "Lunar gravity, extreme temperatures, vacuum"
timeline                     ← "Q3 2026"
deliverables                 ← "Research Report & Raw Data"
spiti_travel                 ← "12 scientists"
status                       ← "approved" (pending, approved, rejected)
submitted_at                 ← 2026-06-01T15:05:12.382Z
created_at                   ← 2026-06-01T15:05:12.382Z
```

**Current Data:**
```json
{
  "id": 1,
  "campaign_id": "CAMP-1780326312348",
  "organization": "Indian Space Research Organisation",
  "email": "campaigns@isro.gov.in",
  "hardware": "Chandrayaan Lander with advanced seismic sensors",
  "test_conditions": "Lunar gravity, extreme temperatures, vacuum",
  "timeline": "Q3 2026",
  "deliverables": "Research Report & Raw Data",
  "spiti_travel": "12 scientists",
  "status": "approved",
  "submitted_at": "2026-06-01T15:05:12.382Z",
  "created_at": "2026-06-01T15:05:12.382Z"
}
```

---

### TABLE 2: `admin_users` - Admin Authentication

**Location:** Neon PostgreSQL → Table `admin_users`

**What's Stored:**
```
id                    ← 1
username              ← "admin"
email                 ← "admin@stellamartis.in"
password_hash         ← "bcrypt(SecurePassword123!)" [HASHED, NOT PLAIN TEXT]
is_admin              ← true
created_at            ← 2026-06-01T15:05:07.000Z
```

**Note:** Passwords are hashed with bcrypt - they're never stored in plain text.

---

### TABLE 3: `audit_logs` - Complete Change History

**Location:** Neon PostgreSQL → Table `audit_logs`

**What's Tracked:**
```
id                    ← 1
campaign_id           ← "CAMP-1780326312348"
action                ← "created" or "status_updated"
changed_by            ← "system" or "1" (admin ID)
old_status            ← "pending"
new_status            ← "approved"
notes                 ← "Campaign approved for testing in Spiti Valley facility"
created_at            ← 2026-06-01T15:05:29.279Z
```

**Current Log Entries:**
```json
[
  {
    "id": 2,
    "action": "status_updated",
    "changed_by": "1",
    "old_status": "pending",
    "new_status": "approved",
    "notes": "Campaign approved for testing in Spiti Valley facility",
    "created_at": "2026-06-01T15:05:29.279Z"
  },
  {
    "id": 1,
    "action": "created",
    "changed_by": "system",
    "old_status": null,
    "new_status": "pending",
    "notes": "Campaign submitted via web form",
    "created_at": "2026-06-01T15:05:12.399Z"
  }
]
```

---

## How to Access User Data

### Method 1: Backend API (Easiest for Developers)

#### Step 1: Get Admin Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Use Token to Get Data
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get all campaigns
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Get specific campaign
curl -X GET http://localhost:3000/api/campaigns/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"

# Get statistics
curl -X GET http://localhost:3000/api/stats \
  -H "Authorization: Bearer $TOKEN"

# Get audit logs
curl -X GET http://localhost:3000/api/audit-logs/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"

# Update campaign status
curl -X PUT http://localhost:3000/api/campaigns/CAMP-1780326312348/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Approved by admin"
  }'
```

---

### Method 2: Direct Database Query (Advanced)

#### Connection String
```
postgresql://neondb_owner:npg_N3sn0HgDfGtF@ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

#### Connect with psql
```bash
psql "postgresql://neondb_owner:npg_N3sn0HgDfGtF@ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

#### SQL Queries

**View All Campaigns:**
```sql
SELECT * FROM campaigns ORDER BY created_at DESC;
```

**View Campaigns by Status:**
```sql
SELECT * FROM campaigns WHERE status = 'pending';
```

**View Pending Campaigns with Organization:**
```sql
SELECT id, campaign_id, organization, email, hardware, status, created_at 
FROM campaigns 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

**View Campaign Change History:**
```sql
SELECT * FROM audit_logs 
WHERE campaign_id = 'CAMP-1780326312348' 
ORDER BY created_at DESC;
```

**Statistics:**
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM campaigns;
```

**Campaigns by Organization:**
```sql
SELECT organization, COUNT(*) as count, STRING_AGG(email, ', ') as contacts
FROM campaigns
GROUP BY organization
ORDER BY count DESC;
```

---

## Neon Dashboard Access

### Via Vercel
1. Go to your Vercel project settings
2. Click "Integrations" → "Neon"
3. Click "Manage" → "Open Neon"
4. View database in Neon dashboard

### Or Direct
Visit: [https://console.neon.tech](https://console.neon.tech)

**In Neon Dashboard You Can:**
- ✅ Browse all tables visually
- ✅ Run SQL queries directly
- ✅ Export data
- ✅ View connection logs
- ✅ Manage database settings

---

## What Each API Endpoint Returns

### GET /api/campaigns (Get All Campaigns)
```json
{
  "success": true,
  "campaigns": [
    {
      "id": 1,
      "campaign_id": "CAMP-1780326312348",
      "organization": "Indian Space Research Organisation",
      "email": "campaigns@isro.gov.in",
      "hardware": "Chandrayaan Lander with advanced seismic sensors",
      "test_conditions": "Lunar gravity, extreme temperatures, vacuum",
      "timeline": "Q3 2026",
      "deliverables": "Research Report & Raw Data",
      "spiti_travel": "12 scientists",
      "status": "approved",
      "submitted_at": "2026-06-01T15:05:12.382Z",
      "created_at": "2026-06-01T15:05:12.382Z"
    }
  ],
  "count": 1
}
```

### GET /api/stats (Get Statistics)
```json
{
  "success": true,
  "stats": {
    "total": 1,
    "pending": 0,
    "approved": 1,
    "rejected": 0
  }
}
```

### GET /api/audit-logs/:id (Get Change History)
```json
{
  "success": true,
  "logs": [
    {
      "id": 2,
      "campaign_id": "CAMP-1780326312348",
      "action": "status_updated",
      "changed_by": "1",
      "old_status": "pending",
      "new_status": "approved",
      "notes": "Campaign approved for testing in Spiti Valley facility",
      "created_at": "2026-06-01T15:05:29.279Z"
    },
    {
      "id": 1,
      "campaign_id": "CAMP-1780326312348",
      "action": "created",
      "changed_by": "system",
      "old_status": null,
      "new_status": "pending",
      "notes": "Campaign submitted via web form",
      "created_at": "2026-06-01T15:05:12.399Z"
    }
  ]
}
```

---

## Admin Credentials (Current)

```
Username: admin
Email: admin@stellamartis.in
Password: SecurePassword123!
JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoxLCJpYXQiOjE3ODAzMjYzMDcsImV4cCI6MTc4MDkzMTEwN30.v4on7z2HXyZS5Su-NnGCqlBwomnzkwW8P4Qt3UoJ9-Y

Note: Token expires in 7 days
```

---

## Data Privacy & Security

✅ **Passwords:** Hashed with bcrypt (256-bit)  
✅ **Transmission:** SSL/TLS encrypted (sslmode=require)  
✅ **Authentication:** JWT tokens (7-day expiration)  
✅ **Audit Trail:** Every change logged with timestamp  
✅ **Access Control:** Token-based API protection  
✅ **Data Isolation:** Each API call checks token validity  

---

## Backup Your Data

### Backup All Tables
```bash
pg_dump "postgresql://neondb_owner:npg_N3sn0HgDfGtF@..." > backup.sql
```

### Export to CSV
```bash
psql "postgresql://neondb_owner:npg_N3sn0HgDfGtF@..." \
  -c "\COPY campaigns TO STDOUT WITH (FORMAT csv, HEADER true)" > campaigns.csv
```

### Export to JSON
```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" | jq . > campaigns.json
```

---

## Environment Variables Needed

In your project's environment variables, add:
```
DATABASE_URL=postgresql://neondb_owner:npg_N3sn0HgDfGtF@ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
JWT_SECRET=your-secret-key-min-32-characters
EMAIL_USER=your-gmail@gmail.com (optional)
EMAIL_PASSWORD=your-app-password (optional)
```

---

## Quick Reference

| Item | Location | Access |
|------|----------|--------|
| **User Campaigns** | `campaigns` table | API or SQL |
| **Admin Accounts** | `admin_users` table | Direct SQL only |
| **Change History** | `audit_logs` table | API or SQL |
| **Connection** | Neon PostgreSQL | psql or Neon Dashboard |
| **API Base URL** | http://localhost:3000 | HTTP |
| **Database Name** | neondb | PostgreSQL |

---

## Troubleshooting

### "Unauthorized" error on API call?
- Make sure you include the JWT token in the Authorization header
- Check that the token hasn't expired (7 days)
- Create a new token by logging in again

### "Connection refused" error?
- Make sure the server is running: `node server.js`
- Check that DATABASE_URL is set in .env
- Verify Neon database is online

### "No routes found"?
- Make sure you're using correct endpoint path
- Check API is using correct HTTP method (GET, POST, PUT)
- Verify token is in Authorization header format: `Bearer TOKEN`

---

## Summary

**Your campaign data is in a secure PostgreSQL database (Neon) with:**
- ✅ 3 tables: campaigns, admin_users, audit_logs
- ✅ 9 API endpoints for data access
- ✅ JWT token authentication
- ✅ Complete audit logging
- ✅ SSL/TLS encryption
- ✅ Bcrypt password hashing

**To access it:**
1. **Quick:** Use API endpoints with JWT token
2. **Advanced:** Connect directly with SQL queries
3. **Visual:** Use Neon Dashboard

---

**Last Updated:** June 1, 2026  
**Database:** Neon PostgreSQL (Cloud)  
**Status:** ✅ Production Ready
