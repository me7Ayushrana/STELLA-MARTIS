const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ============================================
// DATABASE CONNECTION (NEON POSTGRES)
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[v0] Unexpected error on idle client', err);
});

console.log('[v0] Neon PostgreSQL connected at:', process.env.DATABASE_URL?.split('@')[1] || 'unknown');

// ============================================
// EMAIL CONFIGURATION
// ============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (mailOptions) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('[v0] Email not configured. Logging submission instead:');
      console.log('[v0]', mailOptions);
      return { messageId: 'mock_' + Date.now() };
    }
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[v0] Email error:', error.message);
    return { messageId: 'error_' + Date.now() };
  }
};

// ============================================
// AUTHENTICATION HELPERS
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function generateToken(adminId) {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

// ============================================
// MIDDLEWARE: Verify JWT Token
// ============================================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ============================================
// CAMPAIGN ENDPOINTS
// ============================================

// POST /api/campaigns - Submit a campaign (public)
app.post('/api/campaigns', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('[v0] Received campaign submission from:', req.body.email);
    
    const {
      organization,
      email,
      hardware,
      testConditions,
      timeline,
      deliverables,
      spitiTravel,
    } = req.body;

    // Validation
    if (!organization || !email || !hardware) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: organization, email, hardware',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    // Generate unique campaign ID
    const campaignId = 'CAMP-' + Date.now();

    // Insert into database
    const result = await client.query(
      `INSERT INTO campaigns 
        (campaign_id, organization, email, hardware, test_conditions, timeline, deliverables, spiti_travel, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [campaignId, organization, email, hardware, testConditions, timeline, deliverables, spitiTravel]
    );

    const campaign = result.rows[0];
    console.log('[v0] Campaign saved to database:', campaignId);

    // Add audit log
    await client.query(
      `INSERT INTO audit_logs (campaign_id, action, changed_by, new_status, notes)
       VALUES ($1, 'created', 'system', 'pending', 'Campaign submitted via web form')`,
      [campaignId]
    );

    // Send confirmation email
    await sendEmail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Campaign Submission Confirmation - ${campaignId}`,
      html: `
        <h2>Campaign Submission Received</h2>
        <p>Thank you for submitting your campaign request to Stella Martis.</p>
        <p><strong>Campaign ID:</strong> ${campaignId}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Hardware:</strong> ${hardware}</p>
        <p>Your submission is being reviewed. You will receive updates via email.</p>
        <p>Best regards,<br>Stella Martis Team</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign submitted successfully',
      campaignId,
      campaign,
    });
  } catch (error) {
    console.error('[v0] Error submitting campaign:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error submitting campaign: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// GET /api/campaigns/admin/all - Get all campaigns for admin dashboard (public endpoint)
app.get('/api/campaigns/admin/all', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM campaigns ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      campaigns: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[v0] Error fetching campaigns for admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// GET /api/campaigns - Get all campaigns (requires authentication)
app.get('/api/campaigns', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM campaigns ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      campaigns: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[v0] Error fetching campaigns:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// GET /api/campaigns/:id - Get specific campaign
app.get('/api/campaigns/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM campaigns WHERE campaign_id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }
    
    res.json({
      success: true,
      campaign: result.rows[0],
    });
  } catch (error) {
    console.error('[v0] Error fetching campaign:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// PUT /api/campaigns/:id/status - Update campaign status
app.put('/api/campaigns/:id/status', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected',
      });
    }

    // Get current campaign to log changes
    const currentResult = await client.query(
      'SELECT status FROM campaigns WHERE campaign_id = $1',
      [req.params.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    const oldStatus = currentResult.rows[0].status;

    // Update campaign
    await client.query(
      'UPDATE campaigns SET status = $1 WHERE campaign_id = $2',
      [status, req.params.id]
    );

    // Add audit log
    await client.query(
      `INSERT INTO audit_logs (campaign_id, action, changed_by, old_status, new_status, notes)
       VALUES ($1, 'status_updated', $2, $3, $4, $5)`,
      [req.params.id, req.adminId, oldStatus, status, notes]
    );

    console.log(`[v0] Campaign ${req.params.id} status updated from ${oldStatus} to ${status}`);

    res.json({
      success: true,
      message: `Campaign status updated to ${status}`,
    });
  } catch (error) {
    console.error('[v0] Error updating campaign status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating campaign: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// ============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================

// POST /api/auth/register - Create admin account
app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password',
      });
    }

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert admin user
    const result = await client.query(
      `INSERT INTO admin_users (username, email, password_hash, is_admin)
       VALUES ($1, $2, $3, true)
       RETURNING id, username, email`,
      [username, email, passwordHash]
    );

    const admin = result.rows[0];
    const token = generateToken(admin.id);

    console.log(`[v0] New admin user registered: ${username}`);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin,
      token,
    });
  } catch (error) {
    console.error('[v0] Error registering admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error registering admin: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// POST /api/auth/login - Login admin
app.post('/api/auth/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing username or password',
      });
    }

    // Find user
    const result = await client.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const admin = result.rows[0];

    // Compare password
    const passwordMatch = await comparePassword(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = generateToken(admin.id);

    console.log(`[v0] Admin logged in: ${username}`);

    res.json({
      success: true,
      message: 'Login successful',
      admin: { id: admin.id, username: admin.username, email: admin.email },
      token,
    });
  } catch (error) {
    console.error('[v0] Error logging in:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging in: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

// GET /api/audit-logs/:campaignId - Get audit logs for a campaign
app.get('/api/audit-logs/:campaignId', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM audit_logs WHERE campaign_id = $1 ORDER BY created_at DESC',
      [req.params.campaignId]
    );
    
    res.json({
      success: true,
      logs: result.rows,
    });
  } catch (error) {
    console.error('[v0] Error fetching audit logs:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

// GET /api/stats - Get campaign statistics
app.get('/api/stats', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM campaigns
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending || 0),
        approved: parseInt(stats.approved || 0),
        rejected: parseInt(stats.rejected || 0),
      },
    });
  } catch (error) {
    console.error('[v0] Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    res.json({
      success: true,
      message: 'Server and database are healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + error.message,
    });
  } finally {
    client.release();
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`);
  console.log(`[v0] API endpoints:`);
  console.log(`[v0]   POST   /api/campaigns           - Submit campaign (public)`);
  console.log(`[v0]   GET    /api/campaigns           - List all campaigns (protected)`);
  console.log(`[v0]   GET    /api/campaigns/:id       - Get specific campaign (protected)`);
  console.log(`[v0]   PUT    /api/campaigns/:id/status - Update campaign status (protected)`);
  console.log(`[v0]   POST   /api/auth/register       - Register admin`);
  console.log(`[v0]   POST   /api/auth/login          - Login admin`);
  console.log(`[v0]   GET    /api/audit-logs/:id      - Get audit logs (protected)`);
  console.log(`[v0]   GET    /api/stats               - Get statistics (protected)`);
  console.log(`[v0]   GET    /api/health              - Health check`);
});
