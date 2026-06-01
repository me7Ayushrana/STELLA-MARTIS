const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database path for storing submissions
const dbPath = path.join(__dirname, 'campaigns.json');

// Initialize campaigns database
async function initDatabase() {
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify([]));
  }
}

// Read campaigns from file
async function readCampaigns() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write campaigns to file
async function writeCampaigns(campaigns) {
  await fs.writeFile(dbPath, JSON.stringify(campaigns, null, 2));
}

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Fallback: Console logging if email is not configured
const sendEmail = async (mailOptions) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('[v0] Email not configured. Logging submission instead:');
      console.log(mailOptions);
      return { messageId: 'mock_' + Date.now() };
    }
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[v0] Email error:', error.message);
    // Continue even if email fails
    return { messageId: 'error_' + Date.now() };
  }
};

// Campaign submission endpoint
app.post('/api/campaigns', async (req, res) => {
  try {
    console.log('[v0] Received campaign submission:', req.body);
    
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

    // Create campaign object
    const campaign = {
      id: 'CAMP-' + Date.now(),
      organization,
      email,
      hardware,
      testConditions: testConditions || 'Not specified',
      timeline: timeline || 'Not specified',
      deliverables: deliverables || 'Research Report & Raw Data',
      spitiTravel: spitiTravel || 'Not applicable',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    // Save to database
    const campaigns = await readCampaigns();
    campaigns.push(campaign);
    await writeCampaigns(campaigns);

    console.log('[v0] Campaign saved:', campaign.id);

    // Send confirmation email to client
    await sendEmail({
      from: process.env.EMAIL_USER || 'noreply@stellamartis.in',
      to: email,
      subject: `Campaign Submission Received - ${campaign.id}`,
      html: `
        <div style="font-family: 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #d4673b; border-bottom: 2px solid #d4673b; padding-bottom: 10px;">
            Campaign Brief Received
          </h2>
          <p>Hi <strong>${organization}</strong>,</p>
          <p>Thank you for submitting your test campaign brief to <strong>Stella Martis</strong>. We've received your submission and will review it shortly.</p>
          
          <h3 style="color: #666; margin-top: 30px;">Campaign Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Campaign ID:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${campaign.id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Organization:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${organization}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Hardware:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${hardware}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Test Conditions:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${testConditions}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Timeline:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${timeline}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Deliverables:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${deliverables}</td>
            </tr>
            ${spitiTravel ? `
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Spiti Travel Team Size:</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${spitiTravel}</td>
            </tr>
            ` : ''}
          </table>

          <p><strong>What happens next?</strong></p>
          <ul style="line-height: 1.8;">
            <li>Our team will review your campaign brief within <strong>48 hours</strong></li>
            <li>We'll send you a detailed campaign plan with timeline and cost estimate</li>
            <li>If we need clarification, we'll reach out directly</li>
          </ul>

          <p>If you have any questions in the meantime, feel free to reply to this email or contact us at <strong>contact@stellamartis.in</strong></p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Stella Martis — Mars Analog Testing Infrastructure<br>
            Chandigarh, India | contact@stellamartis.in
          </p>
        </div>
      `,
    });

    console.log('[v0] Confirmation email sent to:', email);

    // Send notification to admin
    await sendEmail({
      from: process.env.EMAIL_USER || 'noreply@stellamartis.in',
      to: process.env.ADMIN_EMAIL || 'contact@stellamartis.in',
      subject: `New Campaign Submission - ${organization}`,
      html: `
        <h2>New Campaign Submission</h2>
        <p><strong>Campaign ID:</strong> ${campaign.id}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Contact:</strong> ${email}</p>
        <p><strong>Hardware:</strong> ${hardware}</p>
        <p><strong>Test Conditions:</strong> ${testConditions}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
        <p><strong>Deliverables:</strong> ${deliverables}</p>
        <p><strong>Spiti Travel:</strong> ${spitiTravel}</p>
        <p><strong>Submitted:</strong> ${campaign.submittedAt}</p>
        <hr>
        <p><a href="http://localhost:3000/campaigns">View all campaigns</a></p>
      `,
    });

    console.log('[v0] Admin notification sent');

    // Return success response
    res.json({
      success: true,
      message: 'Campaign brief submitted successfully',
      campaignId: campaign.id,
    });
  } catch (error) {
    console.error('[v0] Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing submission: ' + error.message,
    });
  }
});

// Get all campaigns (admin endpoint)
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await readCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single campaign
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaigns = await readCampaigns();
    const campaign = campaigns.find(c => c.id === req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[v0] Stella Martis server running on http://localhost:${PORT}`);
    console.log(`[v0] POST /api/campaigns - Submit a campaign`);
    console.log(`[v0] GET /api/campaigns - View all campaigns`);
    console.log(`[v0] GET /api/campaigns/:id - View specific campaign`);
  });
}).catch(error => {
  console.error('[v0] Failed to initialize database:', error);
  process.exit(1);
});
