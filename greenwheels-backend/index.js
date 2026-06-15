require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Google Sheets Auth ────────────────────────────────────────────────────
function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Inquiries';

// Ensure the sheet has a header row on first run
async function ensureHeader() {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:J1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'Timestamp', 'Bike Plate', 'Full Name', 'Phone', 'Email',
            'ID / Passport No.', 'Occupation', 'Residence', 'Message', 'Status'
          ]],
        },
      });
    }
  } catch (e) {
    console.error('Header check failed:', e.message);
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

// Bike inquiry page
app.get('/bikes/:plate', (req, res) => {
  const plate = req.params.plate.toUpperCase();
  res.send(buildFormPage(plate));
});

// Form submission
app.post('/bikes/:plate/inquire', async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const { name, phone, email, id_no, occupation, residence, message } = req.body;

  if (!name || !phone) {
    return res.status(400).send(buildResultPage(plate, false, 'Name and phone number are required.'));
  }

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [[
          new Date().toISOString(),
          plate,
          name,
          phone,
          email || '',
          id_no || '',
          occupation || '',
          residence || '',
          message || '',
          'New'
        ]],
      },
    });
    res.send(buildResultPage(plate, true));
  } catch (err) {
    console.error('Sheets error:', err.message);
    res.status(500).send(buildResultPage(plate, false, 'Submission failed. Please try again or call us directly.'));
  }
});

// Health check
app.get('/', (req, res) => res.send('Greenwheels Bike Inquiry API is running.'));

// ─── HTML Builders ─────────────────────────────────────────────────────────

function buildFormPage(plate) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bike Inquiry — ${plate} | Greenwheels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f0faf5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 0 40px;
    }
    .header {
      width: 100%;
      background: #1D9E75;
      color: white;
      padding: 18px 24px;
      text-align: center;
    }
    .header h1 { font-size: 1.25rem; letter-spacing: 1px; }
    .header p  { font-size: 0.78rem; opacity: 0.85; margin-top: 4px; letter-spacing: 0.5px; }
    .bike-badge {
      margin: 24px auto 0;
      background: white;
      border: 2px solid #1D9E75;
      border-radius: 12px;
      padding: 14px 28px;
      text-align: center;
      width: fit-content;
      max-width: 90%;
    }
    .bike-badge .label { font-size: 0.7rem; color: #888; letter-spacing: 1px; text-transform: uppercase; }
    .bike-badge .plate { font-size: 1.8rem; font-weight: 700; color: #0F6E56; letter-spacing: 3px; margin-top: 4px; }
    .bike-badge .sub   { font-size: 0.75rem; color: #555; margin-top: 4px; }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(29,158,117,0.10);
      padding: 28px 24px;
      width: 92%;
      max-width: 480px;
      margin-top: 24px;
    }
    .card h2 { font-size: 1rem; color: #1D9E75; margin-bottom: 20px; border-bottom: 1px solid #e0f5ed; padding-bottom: 10px; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 0.75rem; color: #555; font-weight: 600; margin-bottom: 5px; letter-spacing: 0.4px; }
    .field input, .field textarea {
      width: 100%;
      border: 1.5px solid #d0ede3;
      border-radius: 8px;
      padding: 10px 13px;
      font-size: 0.9rem;
      color: #2C2C2A;
      outline: none;
      transition: border 0.2s;
      background: #fafdfc;
    }
    .field input:focus, .field textarea:focus { border-color: #1D9E75; background: white; }
    .field textarea { height: 80px; resize: vertical; }
    .required { color: #e05555; }
    .row { display: flex; gap: 12px; }
    .row .field { flex: 1; }
    .submit-btn {
      width: 100%;
      background: #1D9E75;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
      letter-spacing: 0.5px;
      transition: background 0.2s;
    }
    .submit-btn:hover { background: #0F6E56; }
    .footer { margin-top: 32px; font-size: 0.72rem; color: #999; text-align: center; }
    .footer a { color: #1D9E75; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GREENWHEELS MOBILITY</h1>
    <p>CERTIFIED REFURBISHED MOTORCYCLES</p>
  </div>

  <div class="bike-badge">
    <div class="label">Bike Reference</div>
    <div class="plate">${plate}</div>
    <div class="sub">Fill the form below to express interest in this bike</div>
  </div>

  <div class="card">
    <h2>Your Details</h2>
    <form method="POST" action="/bikes/${plate}/inquire">
      <div class="field">
        <label>Full Name <span class="required">*</span></label>
        <input type="text" name="name" placeholder="e.g. John Kamau" required/>
      </div>
      <div class="row">
        <div class="field">
          <label>Phone Number <span class="required">*</span></label>
          <input type="tel" name="phone" placeholder="07XX XXX XXX" required/>
        </div>
        <div class="field">
          <label>Email Address</label>
          <input type="email" name="email" placeholder="optional"/>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label>ID / Passport No.</label>
          <input type="text" name="id_no" placeholder="National ID or Passport"/>
        </div>
        <div class="field">
          <label>Occupation</label>
          <input type="text" name="occupation" placeholder="e.g. Rider, Trader"/>
        </div>
      </div>
      <div class="field">
        <label>Area of Residence</label>
        <input type="text" name="residence" placeholder="e.g. Nairobi, Thika"/>
      </div>
      <div class="field">
        <label>Message / Questions</label>
        <textarea name="message" placeholder="Any questions about this bike?"></textarea>
      </div>
      <button type="submit" class="submit-btn">Submit Inquiry →</button>
    </form>
  </div>

  <div class="footer">
    Greenwheels Mobility Limited · Nairobi, Kenya<br/>
    <a href="mailto:info@greenwheels.co.ke">info@greenwheels.co.ke</a> · +254 700 000 000
  </div>
</body>
</html>`;
}

function buildResultPage(plate, success, errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${success ? 'Inquiry Submitted' : 'Error'} | Greenwheels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f0faf5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0;
    }
    .header { width: 100%; background: #1D9E75; color: white; padding: 18px 24px; text-align: center; }
    .header h1 { font-size: 1.25rem; letter-spacing: 1px; }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(29,158,117,0.10);
      padding: 36px 28px;
      width: 92%;
      max-width: 420px;
      margin-top: 40px;
      text-align: center;
    }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h2 { color: ${success ? '#1D9E75' : '#e05555'}; margin-bottom: 12px; }
    p  { color: #555; font-size: 0.9rem; line-height: 1.6; }
    .plate { display: inline-block; background: #f0faf5; border: 1.5px solid #1D9E75; border-radius: 8px; padding: 6px 18px; font-weight: 700; color: #0F6E56; letter-spacing: 2px; margin: 16px 0; font-size: 1.1rem; }
    .back-btn {
      display: inline-block;
      margin-top: 20px;
      background: #1D9E75;
      color: white;
      padding: 11px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .footer { margin-top: 32px; font-size: 0.72rem; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header"><h1>GREENWHEELS MOBILITY</h1></div>
  <div class="card">
    ${success ? `
      <div class="icon">✅</div>
      <h2>Inquiry Submitted!</h2>
      <div class="plate">${plate}</div>
      <p>Thank you! Our team will contact you shortly regarding this bike. Please keep your phone available.</p>
      <a href="/bikes/${plate}" class="back-btn">Back to Bike</a>
    ` : `
      <div class="icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>${errorMsg}</p>
      <a href="/bikes/${plate}" class="back-btn">Try Again</a>
    `}
  </div>
  <div class="footer">Greenwheels Mobility Limited · Nairobi, Kenya</div>
</body>
</html>`;
}

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Greenwheels backend running on port ${PORT}`);
  await ensureHeader();
});
