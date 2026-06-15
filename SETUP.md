# Greenwheels Bike Inquiry System — Setup Guide

## What This Does
Each refurb bike sticker has a QR code. When a buyer scans it, they land on a form
page for that specific bike. When they submit, their details go straight into a
Google Sheet you control — name, phone, email, ID, occupation, residence, message.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name the first sheet tab exactly: **Inquiries**
3. Copy the Spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

---

## Step 2 — Create a Google Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. `greenwheels-bikes`)
3. Go to **APIs & Services → Enable APIs** → enable **Google Sheets API**
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Give it any name, click **Done**
6. Click the service account → **Keys tab → Add Key → JSON**
7. Download the JSON file — keep it safe

---

## Step 3 — Share the Sheet with the Service Account

1. Open the JSON file you downloaded — copy the `client_email` value
   (looks like `something@project.iam.gserviceaccount.com`)
2. Open your Google Sheet → click **Share**
3. Paste the email → set role to **Editor** → click Send

---

## Step 4 — Deploy to Railway

1. Create a GitHub repo and push this backend folder to it:
   ```
   cd greenwheels-backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/Kelvin-WA/greenwheels-backend.git
   git push -u origin main
   ```

2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select your repo

---

## Step 5 — Set Environment Variables on Railway

In your Railway project → **Variables tab**, add:

| Variable | Value |
|---|---|
| `SPREADSHEET_ID` | The ID from your Google Sheet URL |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The **entire contents** of the JSON key file, on one line |

To minify the JSON to one line, run this in your terminal:
```bash
cat your-key-file.json | python3 -m json.tool --compact
```
Then paste the output as the value.

---

## Step 6 — Get Your Railway URL & Regenerate Stickers

Once deployed, Railway gives you a URL like:
```
https://greenwheels-backend-production.up.railway.app
```

Update the sticker PDF by running the sticker generator with that URL:
- Each QR will point to: `https://your-railway-url.up.railway.app/bikes/KCG123A`
- Buyers scan → see the form → submit → data appears in your Google Sheet instantly

---

## Google Sheet Columns (auto-created)

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Bike Plate | Full Name | Phone | Email | ID/Passport | Occupation | Residence | Message | Status |

---

## Testing Locally (Optional)

```bash
# In greenwheels-backend/
cp .env.example .env
# Fill in SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON in .env

npm start
# Visit: http://localhost:3000/bikes/KCG123A
```

---

*Built for Greenwheels Mobility Limited — Nairobi, Kenya*
