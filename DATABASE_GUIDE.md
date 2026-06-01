# STELLA MARTIS - DATABASE & USER DATA GUIDE

## Overview

All user campaign submissions are now stored in **Neon PostgreSQL** database. This replaces the JSON file-based system with a production-ready, scalable database solution.

---

## Database Tables

### 1. **campaigns** - All User Campaign Submissions
**Where:** Neon PostgreSQL  
**Purpose:** Stores all campaign requests from users

```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id VARCHAR(255) UNIQUE,     -- Unique ID like "CAMP-1780325537927"
  organization VARCHAR(255),            -- User's organization name
  email VARCHAR(255),                   -- User's contact email
  hardware TEXT,                        -- Hardware description to be tested
  test_conditions VARCHAR(255),         -- Critical test conditions
  timeline VARCHAR(100),                -- Preferred timeline
  deliverables VARCHAR(255),            -- Type of deliverables needed
  spiti_travel VARCHAR(100),            -- Team size for Spiti travel
  status VARCHAR(50),                   -- Status: pending, approved, rejected
  submitted_at TIMESTAMP,               -- When campaign was submitted
  created_at TIMESTAMP                  -- Record creation time
);
```

**Sample Query to View All User Data:**
```sql
SELECT * FROM campaigns ORDER BY created_at DESC;
```

---

### 2. **admin_users** - Admin Access Control
**Where:** Neon PostgreSQL  
**Purpose:** Stores admin credentials for dashboard access

```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,         -- Admin username
  email VARCHAR(255) UNIQUE,            -- Admin email
  password_hash VARCHAR(255),           -- Hashed password (bcrypt)
  is_admin BOOLEAN,                     -- Admin flag
  created_at TIMESTAMP                  -- Account creation time
);
```

**Note:** Passwords are hashed with bcrypt and never stored in plain text.

---

### 3. **audit_logs** - Complete Change History
**Where:** Neon PostgreSQL  
**Purpose:** Tracks all changes made to campaigns for accountability

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  campaign_id VARCHAR(255),             -- Which campaign was changed
  action VARCHAR(100),                  -- Action performed (created, status_updated, etc.)
  changed_by VARCHAR(100),              -- Who made the change (admin ID or "system")
  old_status VARCHAR(50),               -- Previous status
  new_status VARCHAR(50),               -- New status
  notes TEXT,                           -- Additional notes about the change
  created_at TIMESTAMP                  -- When change was made
);
```

**Sample Query to View Campaign History:**
```sql
SELECT * FROM audit_logs WHERE campaign_id = 'CAMP-1780325537927' ORDER BY created_at DESC;
```

---

## Accessing User Data

### Option 1: Via Backend API (Recommended)

#### Get All Campaigns
```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "campaigns": [
    {
      "id": 1,
      "campaign_id": "CAMP-1780325537927",
      "organization": "Test University",
      "email": "test@university.edu",
      "hardware": "Experimental Mars rover...",
      "status": "pending",
      "created_at": "2024-06-01T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### Get Specific Campaign
```bash
curl -X GET http://localhost:3000/api/campaigns/CAMP-1780325537927 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Campaign Statistics
```bash
curl -X GET http://localhost:3000/api/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "pending": 5,
    "approved": 3,
    "rejected": 2
  }
}
```

#### Get Audit Logs for Campaign
```bash
curl -X GET http://localhost:3000/api/audit-logs/CAMP-1780325537927 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Option 2: Direct Database Access

#### Connect to Neon Database
Using psql:
```bash
psql "YOUR_DATABASE_URL"
```

#### Query All Campaigns
```sql
SELECT id, campaign_id, organization, email, hardware, status, created_at 
FROM campaigns 
ORDER BY created_at DESC;
```

#### Query Campaigns by Status
```sql
SELECT * FROM campaigns 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

#### Query Campaigns by Email Domain
```sql
SELECT * FROM campaigns 
WHERE email LIKE '%@university.edu' 
ORDER BY created_at DESC;
```

#### View Change History for Campaign
```sql
SELECT * FROM audit_logs 
WHERE campaign_id = 'CAMP-1780325537927' 
ORDER BY created_at DESC;
```

---

## Authentication & Security

### Admin Login Flow

1. **Register Admin Account:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@stellamartis.in",
    "password": "secure-password-here"
  }'
```

2. **Login to Get JWT Token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure-password-here"
  }'
```

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@stellamartis.in"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

3. **Use Token for API Requests:**
```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Data Flow Diagram

```
User submits campaign form
        ↓
Frontend form validation
        ↓
POST /api/campaigns (public)
        ↓
Backend validation
        ↓
INSERT into 'campaigns' table
        ↓
INSERT into 'audit_logs' table (action: 'created')
        ↓
Send confirmation email to user
        ↓
Return campaign ID to user
        ↓
Admin views campaigns via /api/campaigns (with JWT token)
        ↓
Admin updates status via PUT /api/campaigns/:id/status
        ↓
New entry in 'audit_logs' table (action: 'status_updated')
```

---

## Environment Variables Required

### In Vercel Project Settings (Vars section):

```
DATABASE_URL=postgresql://user:password@endpoint/dbname
JWT_SECRET=your-secret-key-min-32-characters
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
ADMIN_EMAIL=admin@stellamartis.in
PORT=3000
NODE_ENV=development
```

---

## Backend API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/campaigns | No | Submit campaign |
| GET | /api/campaigns | Yes | List all campaigns |
| GET | /api/campaigns/:id | Yes | Get specific campaign |
| PUT | /api/campaigns/:id/status | Yes | Update campaign status |
| POST | /api/auth/register | No | Create admin account |
| POST | /api/auth/login | No | Login to get JWT token |
| GET | /api/audit-logs/:id | Yes | Get campaign history |
| GET | /api/stats | Yes | Get statistics |
| GET | /api/health | No | Health check |

---

## Where to Find User Information

### Campaign Details:
- **Organization Name:** `campaigns.organization`
- **Contact Email:** `campaigns.email`
- **Hardware Description:** `campaigns.hardware`
- **Test Conditions:** `campaigns.test_conditions`
- **Timeline:** `campaigns.timeline`
- **Deliverables:** `campaigns.deliverables`
- **Spiti Travel Info:** `campaigns.spiti_travel`
- **Submission Date:** `campaigns.created_at`
- **Status:** `campaigns.status` (pending, approved, rejected)

### Who Changed What:
- **What Changed:** `audit_logs.action`
- **Who Changed It:** `audit_logs.changed_by`
- **When:** `audit_logs.created_at`
- **Old Value:** `audit_logs.old_status`
- **New Value:** `audit_logs.new_status`

---

## Exporting Data

### Export All Campaigns to CSV
```bash
psql "DATABASE_URL" -c "\COPY campaigns TO STDOUT WITH (FORMAT csv, HEADER true)" > campaigns.csv
```

### Export Pending Campaigns
```bash
psql "DATABASE_URL" -c "\COPY (SELECT * FROM campaigns WHERE status = 'pending') TO STDOUT WITH (FORMAT csv, HEADER true)" > pending_campaigns.csv
```

### Export to JSON
```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" | jq . > campaigns.json
```

---

## Monitoring & Analytics

### Total Campaigns by Status
```sql
SELECT status, COUNT(*) as count
FROM campaigns
GROUP BY status;
```

### Campaigns by Organization
```sql
SELECT organization, COUNT(*) as count
FROM campaigns
GROUP BY organization
ORDER BY count DESC;
```

### Submission Timeline (Last 7 Days)
```sql
SELECT DATE(created_at), COUNT(*) as count
FROM campaigns
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
```

### Most Active Organizations
```sql
SELECT organization, COUNT(*) as submissions, STRING_AGG(email, ', ') as emails
FROM campaigns
GROUP BY organization
ORDER BY submissions DESC;
```

---

## Backup & Recovery

### Backup Database
```bash
pg_dump "DATABASE_URL" > backup.sql
```

### Restore from Backup
```bash
psql "DATABASE_URL" < backup.sql
```

---

## Security Best Practices

✅ **Passwords:** Hashed with bcrypt, never stored plain text  
✅ **Authentication:** JWT tokens with 7-day expiration  
✅ **API Protection:** All data endpoints require valid JWT token  
✅ **Audit Logging:** All changes tracked with timestamps  
✅ **Email Validation:** Server-side validation of all user inputs  
✅ **SSL/TLS:** Database uses secure connection  

---

## Troubleshooting

### Can't Connect to Database?
Check `DATABASE_URL` in your environment variables:
```bash
echo $DATABASE_URL
```

### Forgot Admin Password?
Create new admin account:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newadmin","email":"admin@example.com","password":"newpassword"}'
```

### Missing User Data?
Query audit logs to see what happened:
```sql
SELECT * FROM audit_logs WHERE campaign_id = 'CAMP-xxx' ORDER BY created_at DESC;
```

---

## Next Steps

1. **Set DATABASE_URL** in environment variables
2. **Create admin account** via POST /api/auth/register
3. **Login** via POST /api/auth/login to get token
4. **Start querying** campaigns via GET /api/campaigns with token
5. **Update statuses** via PUT /api/campaigns/:id/status
6. **Monitor changes** via audit logs

---

**Last Updated:** June 1, 2026  
**Version:** 2.0 (Neon PostgreSQL Integration)
