# Stella Martis - Campaign Booking System

This document explains how to set up and run the "BOOK A CAMPAIGN" feature.

## Overview

The campaign booking system consists of:
- **Frontend**: Enhanced HTML form with client-side validation
- **Backend**: Node.js/Express server handling submissions
- **Storage**: JSON file-based database for campaign submissions
- **Email**: Optional Nodemailer integration for sending confirmations

## Quick Start

### 1. Install Dependencies

Dependencies are already installed. If needed, reinstall:

```bash
npm install
```

### 2. Start the Server

```bash
npm start
# or
npm run dev
# or
node server.js
```

The server will start on `http://localhost:3000`

You should see:
```
[v0] Stella Martis server running on http://localhost:3000
[v0] POST /api/campaigns - Submit a campaign
[v0] GET /api/campaigns - View all campaigns
[v0] GET /api/campaigns/:id - View specific campaign
```

### 3. Test the Form

1. Open `http://localhost:3000` in your browser
2. Navigate to the "BOOK A CAMPAIGN" section
3. Fill in the form:
   - Organization name (required)
   - Email address (required)
   - Hardware description (required)
   - Test conditions (optional)
   - Timeline (optional)
   - Deliverables (dropdown)
   - Spiti travel team size (optional)
4. Click "SUBMIT CAMPAIGN BRIEF"

The form will validate all fields and submit to the backend.

## Email Configuration (Optional)

By default, the system logs submissions to the console. To enable email notifications:

### Using Gmail

1. **Get an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate a 16-character app password

2. **Update `.env` file:**

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=your-admin@email.com
PORT=3000
```

3. **Restart the server:**

```bash
npm start
```

Now emails will be sent:
- ✅ Confirmation email to the user
- ✅ Admin notification email

## API Endpoints

### Submit a Campaign

**POST** `/api/campaigns`

Request body:
```json
{
  "organization": "NASA",
  "email": "contact@nasa.gov",
  "hardware": "Mars Rover",
  "testConditions": "Pressure and UV",
  "timeline": "Q4 2026",
  "deliverables": "Research Report & Raw Data",
  "spitiTravel": "5 people"
}
```

Response:
```json
{
  "success": true,
  "message": "Campaign brief submitted successfully",
  "campaignId": "CAMP-1704067200000"
}
```

### Get All Campaigns

**GET** `/api/campaigns`

Returns array of all submitted campaigns.

### Get Single Campaign

**GET** `/api/campaigns/CAMP-1704067200000`

Returns specific campaign by ID.

## Database

Campaign submissions are stored in `campaigns.json`:

```json
[
  {
    "id": "CAMP-1704067200000",
    "organization": "NASA",
    "email": "contact@nasa.gov",
    "hardware": "Mars Rover",
    "testConditions": "Pressure and UV",
    "timeline": "Q4 2026",
    "deliverables": "Research Report & Raw Data",
    "spitiTravel": "5 people",
    "submittedAt": "2026-01-01T12:00:00.000Z",
    "status": "pending"
  }
]
```

## File Structure

```
/vercel/share/v0-project/
├── server.js              # Express backend server
├── form-handler.js        # Client-side form handler
├── index.html             # Main HTML with form
├── style.css              # Styles including form validation
├── main.js                # Three.js background animation
├── .env                   # Environment variables (sensitive)
├── .env.example           # Example env file
├── package.json           # Node dependencies
├── campaigns.json         # Database file (auto-created)
└── SETUP.md              # This file
```

## Frontend Features

✅ Real-time field validation
✅ Error message display
✅ Loading state indication
✅ Success confirmation with campaign ID
✅ Automatic form reset after submission
✅ Responsive design

## Backend Features

✅ Express server with CORS support
✅ Request validation
✅ Email notifications (optional)
✅ JSON file-based persistence
✅ RESTful API endpoints
✅ Error handling with detailed messages
✅ Unique campaign ID generation

## Troubleshooting

### Form not submitting?
- Check browser console for JavaScript errors
- Ensure server is running on port 3000
- Check that all required fields are filled

### Email not sending?
- Verify `.env` file has correct Gmail and app password
- Check server console for email errors
- Gmail app passwords are 16 characters without spaces

### Port 3000 already in use?
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Can't find campaigns.json?
- It's auto-created on first submission
- Check file permissions if manually creating it

## Security Notes

⚠️ **Important:**
- Keep `.env` file with credentials out of version control
- Use environment variables in production
- Validate all inputs server-side (already done)
- Consider adding rate limiting for production
- Never commit `.env` to Git

## Future Enhancements

- [ ] Database integration (MongoDB, PostgreSQL)
- [ ] User authentication
- [ ] Campaign status tracking dashboard
- [ ] SMS notifications
- [ ] Automatic response emails with pricing
- [ ] File upload support for hardware specs
- [ ] Calendar integration for timeline suggestions

## Support

For issues or questions:
- Email: contact@stellamartis.in
- Check server console logs for detailed errors
- Review `.env` configuration

---

**Last Updated**: 2026-01-01
