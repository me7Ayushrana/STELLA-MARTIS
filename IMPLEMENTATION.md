# Stella Martis - Campaign Booking System Implementation

## Summary

The "BOOK A CAMPAIGN" section has been fully implemented with a working backend, frontend validation, email integration, and admin dashboard.

## What Was Built

### 1. **Backend API Server** (`server.js`)
A complete Node.js/Express backend that:
- ✅ Accepts POST requests to `/api/campaigns` with campaign data
- ✅ Validates all required fields (organization, email, hardware)
- ✅ Generates unique campaign IDs (CAMP-{timestamp})
- ✅ Stores submissions in a JSON file (`campaigns.json`)
- ✅ Sends confirmation emails to users (optional, with fallback to console logging)
- ✅ Sends admin notifications for each submission
- ✅ Provides REST API endpoints for retrieving campaigns
- ✅ Includes CORS support for cross-origin requests
- ✅ Handles errors gracefully with detailed messages

**Key Endpoints:**
- `POST /api/campaigns` - Submit a new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get specific campaign details

### 2. **Enhanced Frontend Form** (`index.html`)
Updated the booking form with:
- ✅ Unique IDs and names for all form fields
- ✅ HTML5 validation attributes (required, type)
- ✅ Organized form structure with form groups
- ✅ Error message containers for each field
- ✅ Form status message area for feedback
- ✅ Submit button with loading/success states

### 3. **Client-Side Form Handler** (`form-handler.js`)
JavaScript class that provides:
- ✅ Real-time field validation
- ✅ Custom validation rules:
  - Organization: min 2 characters
  - Email: valid email format
  - Hardware: min 10 characters
- ✅ Error message display
- ✅ Form submission to backend API
- ✅ Loading state feedback (button disabled, text changes)
- ✅ Success state with campaign ID display
- ✅ Automatic form reset after successful submission
- ✅ Console logging for debugging ([v0] prefixed)

### 4. **Styling** (`style.css`)
Added comprehensive form validation styles:
- ✅ Error state styling (red borders, backgrounds)
- ✅ Form message styling (success, error, loading)
- ✅ Animated slide-down effect for messages
- ✅ Button state styling (disabled, loading, success)
- ✅ Responsive form layout

### 5. **Admin Dashboard** (`admin.html`)
A beautiful admin interface featuring:
- ✅ Campaign statistics (total, pending, approved, rejected)
- ✅ Sortable campaign table with key information
- ✅ Campaign ID, organization, email, hardware, status, date
- ✅ Modal view for detailed campaign information
- ✅ Status badges (pending, approved, rejected)
- ✅ Email links for quick contact
- ✅ Auto-refresh every 30 seconds
- ✅ Responsive design for mobile

**Access at:** `http://localhost:3000/admin.html`

### 6. **Email Integration** (Optional)
- ✅ Sends confirmation emails to users with campaign details
- ✅ Sends admin notifications for each submission
- ✅ Professional HTML email templates
- ✅ Fallback to console logging if email not configured
- ✅ Gmail support with App Passwords

### 7. **Database** (`campaigns.json`)
- ✅ Auto-created on first submission
- ✅ Stores all campaign information
- ✅ JSON format for easy backup and migration
- ✅ Includes timestamp and status fields

### 8. **Configuration Files**
- ✅ `.env` - Environment variables (email credentials, port)
- ✅ `.env.example` - Template for configuration
- ✅ `package.json` - Dependencies and npm scripts
- ✅ `SETUP.md` - Complete setup instructions
- ✅ `IMPLEMENTATION.md` - This document

## File Structure

```
/vercel/share/v0-project/
├── server.js                # Express backend server (263 lines)
├── form-handler.js          # Client-side form handler (226 lines)
├── admin.html              # Admin dashboard (488 lines)
├── index.html              # Updated main page (with form)
├── style.css               # Updated styles (with form validation)
├── main.js                 # Three.js background (unchanged)
├── .env                    # Environment variables (empty by default)
├── .env.example            # Example configuration
├── .gitignore              # (Optional, add .env to ignore)
├── package.json            # Dependencies
├── campaigns.json          # Auto-created database
├── SETUP.md                # Setup instructions
└── IMPLEMENTATION.md       # This file
```

## How It Works

### User Flow:
1. **User visits the site** → Loads `index.html` with enhanced form
2. **User fills the form** → Client-side validation provides instant feedback
3. **User clicks submit** → Form handler validates all fields
4. **Valid submission** → Data is sent to `/api/campaigns` endpoint
5. **Backend processes** → Validates, stores, sends emails
6. **User receives feedback** → Campaign ID and confirmation message
7. **Admin is notified** → Admin gets email notification

### Admin Flow:
1. **Admin visits** → `http://localhost:3000/admin.html`
2. **Page loads campaigns** → Fetches from `/api/campaigns` endpoint
3. **Statistics displayed** → Total, pending, approved, rejected counts
4. **Campaign list shown** → Table with key information
5. **Admin clicks "View"** → Modal shows full campaign details
6. **Auto-refresh** → Page refreshes every 30 seconds

## API Examples

### Submit Campaign (POST)
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Test University",
    "email": "test@university.edu",
    "hardware": "Mars rover prototype",
    "testConditions": "Pressure, UV radiation",
    "timeline": "Q2 2026",
    "deliverables": "Research Report & Raw Data",
    "spitiTravel": "8 people"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Campaign brief submitted successfully",
  "campaignId": "CAMP-1780325537927"
}
```

### Get All Campaigns (GET)
```bash
curl http://localhost:3000/api/campaigns
```

Returns array of all campaigns stored in `campaigns.json`.

### Get Single Campaign (GET)
```bash
curl http://localhost:3000/api/campaigns/CAMP-1780325537927
```

Returns specific campaign object.

## Configuration

### Email Setup (Optional)

To enable email notifications:

1. **Get Gmail App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail + Windows Computer (or your device)
   - Copy the 16-character password

2. **Update `.env`:**
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ADMIN_EMAIL=admin@stellamartis.in
   PORT=3000
   ```

3. **Restart server:**
   ```bash
   npm start
   ```

### Custom Port

Change `PORT` in `.env` file (default is 3000).

## Features Checklist

### Frontend
- ✅ Form with all required fields
- ✅ Real-time validation with error messages
- ✅ Field-level error display
- ✅ Form-level status messages
- ✅ Loading state indication
- ✅ Success state with campaign ID
- ✅ Automatic form reset
- ✅ Responsive design
- ✅ Accessibility considerations

### Backend
- ✅ Express server
- ✅ CORS enabled
- ✅ JSON request/response handling
- ✅ Input validation
- ✅ Email validation regex
- ✅ Unique ID generation
- ✅ JSON file database
- ✅ Email sending (optional)
- ✅ Error handling
- ✅ Logging with [v0] prefix

### Admin
- ✅ Dashboard at /admin.html
- ✅ Campaign statistics
- ✅ Sortable campaign table
- ✅ Detailed view modal
- ✅ Status badges
- ✅ Email links
- ✅ Auto-refresh
- ✅ Responsive design

## Testing

The system has been tested with:
- ✅ Test API submission (successful)
- ✅ Database creation (confirmed)
- ✅ Server startup (working)
- ✅ Admin dashboard loading (working)
- ✅ Campaign retrieval (working)

## Security Considerations

⚠️ **Important:**
- `.env` file contains sensitive credentials
- Never commit `.env` to version control
- Use app-specific passwords for Gmail
- All inputs are validated server-side
- Consider adding rate limiting for production
- Add authentication for admin dashboard in production

## Future Enhancements

1. **Database Migration**
   - MongoDB integration
   - PostgreSQL with Drizzle ORM
   - Persistent database instead of JSON file

2. **Authentication**
   - Admin login system
   - User account creation
   - Campaign status updates

3. **Advanced Features**
   - File upload for hardware specs
   - Calendar integration for scheduling
   - Payment integration for deposits
   - Automated pricing calculations
   - SMS notifications
   - Real-time campaign status updates

4. **Improvements**
   - Rate limiting
   - CAPTCHA verification
   - Analytics tracking
   - Export to CSV
   - Email templates customization

## Deployment

For production deployment on Vercel:

1. Create Vercel project
2. Connect Git repository
3. Add environment variables in Vercel dashboard
4. Deploy will automatically start the server

## Support & Documentation

- **Setup Guide:** See `SETUP.md`
- **API Documentation:** See this file
- **Form Validation:** Check `form-handler.js`
- **Email Configuration:** Check `.env.example`

## Quick Start Commands

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start

# Or
npm run dev

# Or
node server.js

# Test API submission
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"organization":"Test","email":"test@test.com","hardware":"Test hardware"}'

# View all campaigns
curl http://localhost:3000/api/campaigns

# Access admin dashboard
open http://localhost:3000/admin.html
```

---

**Status:** ✅ **COMPLETE AND TESTED**
**Last Updated:** June 1, 2026
**Version:** 1.0.0
