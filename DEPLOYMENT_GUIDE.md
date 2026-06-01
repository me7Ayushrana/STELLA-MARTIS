# Stella Martis - Deployment & Usage Guide

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies (already done)
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

### Access Points

- **Main Website:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin.html
- **API Base:** http://localhost:3000/api

## 📋 What's Working

✅ **Form Submission**
- Users can fill out the campaign booking form
- Real-time validation with error messages
- Form submission to backend API
- Automatic confirmation with campaign ID

✅ **Backend API**
- Accepts campaign submissions
- Validates all inputs
- Stores data in JSON database
- Unique campaign ID generation (CAMP-{timestamp})
- RESTful API endpoints

✅ **Admin Dashboard**
- View all submitted campaigns
- Statistics dashboard
- Detailed view modal
- Auto-refresh every 30 seconds

✅ **Email Integration** (Optional)
- Confirmation emails to users
- Admin notifications
- Professional HTML templates
- Graceful fallback to console logging

## 🔧 Configuration

### Optional: Email Setup

To enable email notifications:

1. Get Gmail App Password:
   - https://myaccount.google.com/apppasswords
   - Select Mail + Your Device
   - Copy 16-character password

2. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=admin@stellamartis.in
   PORT=3000
   ```

3. Restart server:
   ```bash
   npm start
   ```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express backend server |
| `form-handler.js` | Client-side validation & submission |
| `admin.html` | Admin dashboard |
| `campaigns.json` | Database of submissions |
| `.env` | Configuration (secrets) |
| `SETUP.md` | Detailed setup instructions |
| `IMPLEMENTATION.md` | Technical details |

## 🧪 Testing

### Test Form Submission
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Your Org",
    "email": "contact@yourorg.com",
    "hardware": "Hardware description",
    "testConditions": "Test conditions",
    "timeline": "Q2 2026",
    "deliverables": "Research Report & Raw Data",
    "spitiTravel": "5 people"
  }'
```

### View All Campaigns
```bash
curl http://localhost:3000/api/campaigns | jq
```

### View Single Campaign
```bash
curl http://localhost:3000/api/campaigns/CAMP-{campaign-id} | jq
```

## 📊 Form Fields

**Required:**
- Organization / Team Name
- Contact Email
- Hardware Description

**Optional:**
- Critical Test Conditions
- Preferred Timeline
- Deliverables Type
- Spiti Travel Team Size

## 🎯 User Experience Flow

1. **User Visits** → Loads main page with form
2. **Fills Form** → Gets real-time validation feedback
3. **Submits** → Form validates, shows loading state
4. **Success** → Receives campaign ID and confirmation
5. **Email** → Optional confirmation email (if configured)
6. **Admin Notified** → Admin receives notification email

## 👨‍💼 Admin Experience Flow

1. **Visit Dashboard** → http://localhost:3000/admin.html
2. **View Statistics** → Total, pending, approved, rejected counts
3. **See Campaigns** → Sortable table of all submissions
4. **View Details** → Click "View" to see full campaign info
5. **Monitor** → Auto-refresh every 30 seconds

## 🔐 Security Notes

⚠️ **Important:**
- `.env` contains secrets - never commit to Git
- Use app-specific passwords (not regular Gmail password)
- All inputs validated server-side
- Consider adding authentication to admin dashboard for production

## 📱 Responsive Design

✅ Works on:
- Desktop browsers
- Tablets
- Mobile devices
- All form elements responsive

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is in use
- Change PORT in `.env` if needed
- Ensure Node.js is installed

### Form not submitting
- Check browser console for errors
- Ensure server is running
- Verify all required fields are filled

### Email not sending
- Verify `.env` credentials are correct
- Check Gmail app password is 16 characters
- Look for errors in server console

### Can't access admin dashboard
- Ensure server is running on port 3000
- Check URL: http://localhost:3000/admin.html
- Clear browser cache if needed

## 📈 Monitoring

### Check Server Logs
```bash
# View running server output
# Look for [v0] prefixed messages
```

### View Database
```bash
# See all campaigns
cat campaigns.json | jq

# Count submissions
jq 'length' campaigns.json
```

## 🚢 Production Deployment

For Vercel deployment:

1. **Connect Repository**
   - Push to GitHub
   - Connect to Vercel project

2. **Add Environment Variables**
   - Set EMAIL_USER
   - Set EMAIL_PASSWORD
   - Set ADMIN_EMAIL
   - Set PORT (if different)

3. **Deploy**
   - Vercel automatically detects Express server
   - Server runs on Vercel Functions

## 📚 Documentation

- **Setup:** See `SETUP.md`
- **Technical:** See `IMPLEMENTATION.md`
- **Deployment:** This file

## ✨ Next Steps

Potential enhancements:
- [ ] Database migration (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Campaign status updates
- [ ] File uploads
- [ ] Payment integration
- [ ] Advanced analytics

## 📞 Support

For issues:
1. Check server console for error logs
2. Review `.env` configuration
3. Test API endpoints directly with curl
4. Check browser console for client-side errors

## 📝 Version Info

- **Version:** 1.0.0
- **Status:** Production Ready
- **Last Updated:** June 1, 2026
- **Node Version:** 16+ required
- **Express Version:** 5.2.1+

---

**Ready to deploy!** 🎉

Start server: `npm start`
Visit: http://localhost:3000
Admin: http://localhost:3000/admin.html
