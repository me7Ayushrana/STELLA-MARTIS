# STELLA MARTIS - COMPLETE SYSTEM EXPLANATION

## TABLE OF CONTENTS
1. [How It Works (End-to-End)](#how-it-works)
2. [Where Your Data Lives](#where-data-lives)
3. [How to Get Your Data](#how-to-get-data)
4. [System Architecture](#system-architecture)
5. [Visual Diagrams](#visual-diagrams)

---

## HOW IT WORKS (End-to-End)

### STEP 1: USER SUBMITS FORM
When someone visits `http://localhost:3000` and fills the "BOOK A CAMPAIGN" form:

```
USER FILLS FORM:
├─ Organization Name: "Indian Space Research Organisation"
├─ Contact Email: "campaigns@isro.gov.in"
├─ Hardware Description: "Chandrayaan Lander..."
├─ Test Conditions: "Lunar gravity..."
├─ Preferred Timeline: "Q3 2026"
├─ Deliverables: "Research Report & Raw Data"
└─ Spiti Travel: "12 scientists"
```

**What Happens:**
- form-handler.js (JavaScript file) validates the form
- If invalid, shows error messages
- If valid, sends the data to backend

### STEP 2: DATA SENT TO BACKEND
The browser sends the form data to the server using:

```
POST /api/campaigns
Content-Type: application/json

{
  "organization": "Indian Space Research Organisation",
  "email": "campaigns@isro.gov.in",
  "hardware": "Chandrayaan Lander...",
  "testConditions": "Lunar gravity...",
  "timeline": "Q3 2026",
  "deliverables": "Research Report & Raw Data",
  "spitiTravel": "12 scientists"
}
```

### STEP 3: BACKEND PROCESSES DATA
The server (server.js) receives the data and:

1. **Validates input:**
   - Checks if all required fields are present
   - Validates email format
   - Checks for SQL injection/malicious code

2. **Generates Campaign ID:**
   - Creates unique ID: `CAMP-1780326312348`
   - Based on timestamp (guaranteed unique)

3. **Stores in database:**
   - Inserts data into `campaigns` table
   - Creates audit log entry
   - Sends confirmation email (optional)

### STEP 4: DATA SAVED TO NEON DATABASE

```sql
-- This SQL runs automatically in the backend:
INSERT INTO campaigns (
  campaign_id, 
  organization, 
  email, 
  hardware, 
  test_conditions, 
  timeline, 
  deliverables, 
  spiti_travel, 
  status, 
  created_at
) VALUES (
  'CAMP-1780326312348',
  'Indian Space Research Organisation',
  'campaigns@isro.gov.in',
  'Chandrayaan Lander...',
  'Lunar gravity...',
  'Q3 2026',
  'Research Report & Raw Data',
  '12 scientists',
  'pending',
  NOW()
);
```

### STEP 5: USER GETS CONFIRMATION
The server responds with:

```json
{
  "success": true,
  "message": "Campaign submitted successfully!",
  "campaignId": "CAMP-1780326312348",
  "campaign": {
    "id": 1,
    "campaign_id": "CAMP-1780326312348",
    "organization": "Indian Space Research Organisation",
    "email": "campaigns@isro.gov.in",
    "status": "pending",
    "created_at": "2026-06-01T15:05:12.000Z"
  }
}
```

User sees:
- Success message with Campaign ID
- Can share Campaign ID with the organization
- Email confirmation sent to them

### STEP 6: ADMIN ACCESSES DATA
Admin goes to http://localhost:3000/admin.html or uses API:

1. **Login with credentials:**
   - Username: `admin`
   - Password: `SecurePassword123!`

2. **Gets JWT token** (valid for 7 days)

3. **Can now:**
   - View all campaigns
   - Update campaign status
   - View change history
   - Export data

---

## WHERE YOUR DATA LIVES

### DATABASE LOCATION

```
SERVICE:      Neon PostgreSQL (Managed PostgreSQL in Cloud)
PROVIDER:     Neon (Company providing managed PostgreSQL)
HOSTING:      Amazon Web Services (AWS)
REGION:       us-east-1 (US East Virginia)
DATABASE:     neondb
SERVER:       ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech
CONNECTION:   SSL/TLS encrypted
STATUS:       24/7 running
BACKUPS:      Automatic daily
```

### DATABASE STRUCTURE

#### TABLE 1: campaigns (User Submissions)

```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,                    -- Auto-incrementing ID
  campaign_id VARCHAR(255) UNIQUE,          -- CAMP-1780326312348
  organization VARCHAR(255),                -- Indian Space Research Organisation
  email VARCHAR(255),                       -- campaigns@isro.gov.in
  hardware TEXT,                            -- Chandrayaan Lander...
  test_conditions VARCHAR(255),             -- Lunar gravity...
  timeline VARCHAR(100),                    -- Q3 2026
  deliverables VARCHAR(255),                -- Research Report & Raw Data
  spiti_travel VARCHAR(100),                -- 12 scientists
  status VARCHAR(50) DEFAULT 'pending',     -- pending | approved | rejected
  submitted_at TIMESTAMP DEFAULT NOW(),     -- When submitted
  created_at TIMESTAMP DEFAULT NOW()        -- When created
);
```

**Sample Data:**

| campaign_id | organization | email | status | created_at |
|---|---|---|---|---|
| CAMP-1780326312348 | ISRO | campaigns@isro.gov.in | approved | 2026-06-01 15:05:12 |

#### TABLE 2: admin_users (Authentication)

```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
  username VARCHAR(100) UNIQUE,    -- admin
  email VARCHAR(255) UNIQUE,       -- admin@stellamartis.in
  password_hash VARCHAR(255),      -- bcrypt hashed (not plain text!)
  is_admin BOOLEAN DEFAULT TRUE,   -- Admin flag
  created_at TIMESTAMP DEFAULT NOW() -- When account created
);
```

**Sample Data:**

| username | email | password_hash | is_admin |
|---|---|---|---|
| admin | admin@stellamartis.in | $2b$10$... | true |

#### TABLE 3: audit_logs (Change History)

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,              -- Auto-incrementing ID
  campaign_id VARCHAR(255),           -- CAMP-1780326312348
  action VARCHAR(100),                -- created | status_updated
  changed_by VARCHAR(100),            -- admin ID or 'system'
  old_status VARCHAR(50),             -- Previous status
  new_status VARCHAR(50),             -- New status
  notes TEXT,                         -- Reason for change
  created_at TIMESTAMP DEFAULT NOW()  -- When changed
);
```

**Sample Data:**

| campaign_id | action | changed_by | old_status | new_status | created_at |
|---|---|---|---|---|---|
| CAMP-1780326312348 | created | system | NULL | pending | 2026-06-01 15:05:12 |
| CAMP-1780326312348 | status_updated | admin | pending | approved | 2026-06-01 15:10:45 |

---

## HOW TO GET YOUR DATA

### METHOD 1: Using API (Easiest)

**Step 1: Login to Get Token**

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@stellamartis.in"
  }
}
```

**Step 2: Use Token to Get Campaigns**

```bash
# Replace TOKEN with the token from above
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
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
      "created_at": "2026-06-01T15:05:12.000Z"
    }
  ],
  "count": 1
}
```

**Step 3: Get Specific Campaign**

```bash
curl -X GET http://localhost:3000/api/campaigns/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"
```

**Step 4: Get Campaign History**

```bash
curl -X GET http://localhost:3000/api/audit-logs/CAMP-1780326312348 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "campaign_id": "CAMP-1780326312348",
      "action": "created",
      "changed_by": "system",
      "old_status": null,
      "new_status": "pending",
      "notes": null,
      "created_at": "2026-06-01T15:05:12.000Z"
    },
    {
      "id": 2,
      "campaign_id": "CAMP-1780326312348",
      "action": "status_updated",
      "changed_by": "admin",
      "old_status": "pending",
      "new_status": "approved",
      "notes": "Campaign approved for testing in Spiti Valley facility",
      "created_at": "2026-06-01T15:10:45.000Z"
    }
  ]
}
```

### METHOD 2: Using SQL (Advanced)

**Step 1: Connect to Database**

```bash
psql "postgresql://neondb_owner:npg_N3sn0HgDfGtF@ep-silent-night-aqtvzcrl-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Step 2: View All Campaigns**

```sql
SELECT * FROM campaigns ORDER BY created_at DESC;
```

**Response:**
```
 id | campaign_id         | organization       | email                  | status | created_at
----+---------------------+--------------------+------------------------+--------+-------------------
  1 | CAMP-1780326312348  | ISRO               | campaigns@isro.gov.in  | approved | 2026-06-01 15:05:12
```

**Step 3: View Specific Campaign**

```sql
SELECT * FROM campaigns WHERE campaign_id = 'CAMP-1780326312348';
```

**Step 4: View Campaign History**

```sql
SELECT * FROM audit_logs WHERE campaign_id = 'CAMP-1780326312348' ORDER BY created_at;
```

**Response:**
```
 id | campaign_id         | action          | changed_by | old_status | new_status | created_at
----+---------------------+-----------------+------------+------------+------------+-------------------
  1 | CAMP-1780326312348  | created         | system     |            | pending    | 2026-06-01 15:05:12
  2 | CAMP-1780326312348  | status_updated  | admin      | pending    | approved   | 2026-06-01 15:10:45
```

**Step 5: Get Statistics**

```sql
SELECT status, COUNT(*) as count FROM campaigns GROUP BY status;
```

**Response:**
```
 status   | count
----------+-------
 pending  | 0
 approved | 1
 rejected | 0
```

### METHOD 3: Using Neon Dashboard (Visual)

**Step 1: Open Vercel Settings**
- Go to your Vercel project dashboard
- Click "Settings" in the top right

**Step 2: Navigate to Integrations**
- Click "Integrations" in the left sidebar
- Find "Neon" in the list
- Click "Manage"

**Step 3: Open Neon Console**
- Click "Open Neon Dashboard"
- Sign in with your Neon account

**Step 4: Browse Data Visually**
- Click "SQL Editor" tab
- See all tables and data
- Run queries visually
- Export data as CSV

---

## SYSTEM ARCHITECTURE

### Components Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (Internet)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
          ┌────────────────────────────────┐
          │    WEBSITE (index.html)         │
          │  ┌──────────────────────────┐  │
          │  │  BOOK A CAMPAIGN Form    │  │
          │  │  - Organization Name     │  │
          │  │  - Contact Email         │  │
          │  │  - Hardware Description  │  │
          │  │  - Test Conditions       │  │
          │  │  - Timeline              │  │
          │  │  - Deliverables          │  │
          │  │  - Spiti Travel          │  │
          │  └──────────────────────────┘  │
          │                                 │
          │  form-handler.js                │
          │  - Validates input              │
          │  - Shows errors                 │
          │  - Sends to backend             │
          └─────────────┬────────────────────┘
                        │
                        │ POST /api/campaigns
                        ↓
          ┌────────────────────────────────┐
          │   BACKEND (server.js)           │
          │   Express.js Server             │
          │                                 │
          │  ┌──────────────────────────┐  │
          │  │  API ENDPOINTS (9 total) │  │
          │  │                          │  │
          │  │  POST /api/campaigns     │  │
          │  │  GET /api/campaigns      │  │
          │  │  PUT /api/campaigns/:id  │  │
          │  │  GET /api/stats          │  │
          │  │  GET /api/audit-logs     │  │
          │  │  POST /api/auth/login    │  │
          │  │  POST /api/auth/register │  │
          │  │  GET /api/health         │  │
          │  └──────────────────────────┘  │
          │                                 │
          │  ┌──────────────────────────┐  │
          │  │  Data Processing:        │  │
          │  │  - Validate input        │  │
          │  │  - Generate Campaign ID  │  │
          │  │  - Hash passwords        │  │
          │  │  - Create JWT tokens     │  │
          │  │  - Send emails           │  │
          │  └──────────────────────────┘  │
          └─────────────┬────────────────────┘
                        │
                        │ SQL Queries
                        ↓
          ┌────────────────────────────────┐
          │  NEON POSTGRESQL (Cloud DB)     │
          │                                 │
          │  ┌──────────────────────────┐  │
          │  │  Table: campaigns        │  │
          │  │  - campaign_id (unique)  │  │
          │  │  - organization          │  │
          │  │  - email                 │  │
          │  │  - hardware              │  │
          │  │  - status                │  │
          │  │  - timestamps            │  │
          │  └──────────────────────────┘  │
          │                                 │
          │  ┌──────────────────────────┐  │
          │  │  Table: admin_users      │  │
          │  │  - username              │  │
          │  │  - email                 │  │
          │  │  - password_hash         │  │
          │  │  - is_admin              │  │
          │  └──────────────────────────┘  │
          │                                 │
          │  ┌──────────────────────────┐  │
          │  │  Table: audit_logs       │  │
          │  │  - campaign_id           │  │
          │  │  - action                │  │
          │  │  - changed_by            │  │
          │  │  - old_status            │  │
          │  │  - new_status            │  │
          │  │  - timestamps            │  │
          │  └──────────────────────────┘  │
          │                                 │
          │  Location: AWS us-east-1        │
          │  Backup: Daily automatic        │
          │  Encryption: SSL/TLS            │
          └─────────────────────────────────┘
```

### Data Flow Diagram

```
USER SUBMITS FORM
       ↓
form-handler.js validates
       ↓
Sends POST /api/campaigns
       ↓
server.js receives data
       ↓
Validates input
       ↓
Generates Campaign ID
       ↓
Stores in database
       ├─ INSERT campaigns table
       ├─ INSERT audit_logs table
       └─ Send email (optional)
       ↓
Returns success to user
       ↓
User sees Campaign ID
```

### Admin Access Flow

```
ADMIN WANTS DATA
       ↓
Login with credentials
       ↓
POST /api/auth/login
       ↓
Server validates password (bcrypt)
       ↓
Returns JWT token
       ↓
Token valid for 7 days
       ↓
Admin uses token for API calls
       ↓
GET /api/campaigns
GET /api/campaigns/:id
PUT /api/campaigns/:id/status
GET /api/audit-logs/:id
GET /api/stats
       ↓
Server verifies token
       ↓
Returns data from database
       ↓
Admin sees all campaigns
```

---

## VISUAL DIAGRAMS

### DATABASE SCHEMA

```
┌─────────────────────────────────┐
│         campaigns               │
├─────────────────────────────────┤
│ id (PK)                         │
│ campaign_id (UNIQUE) ←──────────┼──┐
│ organization                    │  │
│ email                           │  │
│ hardware                        │  │
│ test_conditions                 │  │
│ timeline                        │  │
│ deliverables                    │  │
│ spiti_travel                    │  │
│ status                          │  │
│ created_at                      │  │
└─────────────────────────────────┘  │
                                     │
                    ┌────────────────┘
                    │
                    │ FOREIGN KEY
                    ↓
         ┌──────────────────────┐
         │   audit_logs         │
         ├──────────────────────┤
         │ id (PK)              │
         │ campaign_id (FK) ◄───┤
         │ action               │
         │ changed_by           │
         │ old_status           │
         │ new_status           │
         │ notes                │
         │ created_at           │
         └──────────────────────┘

┌──────────────────────────────────┐
│      admin_users                 │
├──────────────────────────────────┤
│ id (PK)                          │
│ username (UNIQUE)                │
│ email (UNIQUE)                   │
│ password_hash (bcrypt)           │
│ is_admin                         │
│ created_at                       │
└──────────────────────────────────┘
```

### REQUEST/RESPONSE FLOW

```
CLIENT (Browser)                    SERVER (Node.js)              DATABASE (Neon)
       │                                  │                              │
       │  1. User fills form              │                              │
       │                                  │                              │
       │  2. Click Submit                 │                              │
       │─────────────────────────────────→│                              │
       │  POST /api/campaigns             │                              │
       │  {organization, email, ...}      │                              │
       │                                  │  3. Validate data            │
       │                                  │  4. Generate ID              │
       │                                  │  5. Prepare SQL              │
       │                                  │─────────────────────────────→│
       │                                  │  INSERT INTO campaigns       │
       │                                  │                              │
       │                                  │                 6. Store data│
       │                                  │                              │
       │                                  │  7. INSERT INTO audit_logs  │
       │                                  │                              │
       │                                  │                 8. Create log│
       │                                  │←─────────────────────────────│
       │  9. Success response             │                              │
       │←─────────────────────────────────│                              │
       │  {success, campaignId}           │                              │
       │                                  │                              │
       │  10. Show success message        │                              │
       │  11. Display Campaign ID         │                              │
```

---

## SECURITY LAYER

```
USER INPUT
    ↓
Client-side validation (form-handler.js)
    ↓
SENT TO SERVER
    ↓
Server-side validation
├─ Check required fields
├─ Validate email format
├─ Check string length
└─ Prevent SQL injection (parameterized queries)
    ↓
PASSWORD HASHING (if login)
├─ bcrypt algorithm
├─ Salt: 10 rounds
└─ Never store plain text
    ↓
JWT TOKEN (if authenticated)
├─ Signed with secret
├─ Expires in 7 days
└─ Verified on every API call
    ↓
DATABASE
├─ SSL/TLS encryption
├─ Secure connection string
└─ Access logs
```

---

## SUMMARY

### What Happens When User Submits Form:

1. **User fills form** on website
2. **JavaScript validates** the form
3. **Sends to backend** via API
4. **Server validates** and processes
5. **Data stored in database** (Neon PostgreSQL)
6. **Audit log created** automatically
7. **User gets confirmation** with Campaign ID
8. **Admin can access** via API, SQL, or Dashboard

### Where to Get Data:

**3 Ways:**
1. **API** (easiest) - Login → Get token → Query
2. **SQL** (advanced) - Direct database queries
3. **Dashboard** (visual) - Neon web interface

### Database Location:

**Neon PostgreSQL** on AWS in us-east-1 region
- 3 tables: campaigns, admin_users, audit_logs
- SSL/TLS encrypted
- Automatic daily backups
- 24/7 availability

