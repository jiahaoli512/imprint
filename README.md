# Imprint

A waitlist landing page for Imprint — the app that maps every place you've ever been.

## Stack

- **Frontend** — React + Vite
- **Backend** — Node.js + Express
- **Database** — MongoDB
- **Email** — Nodemailer via Gmail App Password

## Getting started

**Prerequisites:** Node.js, MongoDB running locally

```bash
# Install dependencies
npm install
npm install --prefix frontend
npm install --prefix backend
```

Copy the backend env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```
PORT=4000
CLIENT_URL=http://localhost:5173
JWT_SECRET=<random secret>
MONGODB_URI=mongodb://localhost:27017/imprint
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=<gmail app password>
ADMIN_PASSWORD=<password sent to approved users>
```

Start both servers:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

## Gmail App Password

1. Enable 2-Step Verification on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate a password for "Mail" and paste it into `EMAIL_PASS`

## Admin dashboard

Navigate to `/admin` from the site footer. Enter the `ADMIN_PASSWORD` to log in. From there you can approve waitlist entries (which triggers an approval email), reorder the list, or delete entries.
