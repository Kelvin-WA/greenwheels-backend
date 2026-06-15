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
            'ID / Passport No.', 'Occupation', 'Residence', 'Status'
          ]],
        },
      });
    }
  } catch (e) {
    console.error('Header check failed:', e.message);
  }
}

// Check if plate or email already reserved
async function checkDuplicate(plate, email) {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:I`,
    });
    const rows = res.data.values || [];
    for (const row of rows) {
      const rowPlate = (row[1] || '').trim().toUpperCase();
      const rowEmail = (row[4] || '').trim().toLowerCase();
      if (rowPlate === plate.toUpperCase()) {
        return { duplicate: true, reason: 'bike' };
      }
      if (email && rowEmail === email.trim().toLowerCase() && rowEmail !== '') {
        return { duplicate: true, reason: 'email' };
      }
    }
    return { duplicate: false };
  } catch (e) {
    console.error('Duplicate check error:', e.message);
    return { duplicate: false };
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

app.get('/bikes/:plate', (req, res) => {
  const plate = req.params.plate.toUpperCase();
  res.send(buildFormPage(plate));
});

app.post('/bikes/:plate/inquire', async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const { name, phone, email, id_no, occupation, residence } = req.body;

  if (!name || !phone || !email || !id_no || !occupation || !residence) {
    return res.send(buildResultPage(plate, false, 'Please fill in all required fields before reserving.'));
  }

  // Duplicate check
  const { duplicate, reason } = await checkDuplicate(plate, email);
  if (duplicate) {
    if (reason === 'bike') {
      return res.send(buildResultPage(plate, false, 'This bike has already been reserved by someone else.'));
    }
    if (reason === 'email') {
      return res.send(buildResultPage(plate, false, 'This email address has already been used to reserve a bike.'));
    }
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
          email,
          id_no,
          occupation,
          residence,
          'Reserved'
        ]],
      },
    });
    res.send(buildResultPage(plate, true));
  } catch (err) {
    console.error('Sheets error:', err.message);
    res.status(500).send(buildResultPage(plate, false, 'Submission failed. Please try again or call us directly.'));
  }
});

app.get('/', (req, res) => res.send('Greenwheels Bike Inquiry API is running.'));

// ─── HTML Builders ─────────────────────────────────────────────────────────

function buildFormPage(plate) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reserve Bike — ${plate} | Greenwheels</title>
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
    .field input {
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
    .field input:focus { border-color: #1D9E75; background: white; }
    .required { color: #e05555; }
    .row { display: flex; gap: 12px; }
    .row .field { flex: 1; }
    .submit-btn {
      width: 100%;
      background: #ccc;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-size: 1rem;
      font-weight: 700;
      cursor: not-allowed;
      margin-top: 8px;
      letter-spacing: 0.5px;
      transition: background 0.3s;
    }
    .submit-btn.ready { background: #1D9E75; cursor: pointer; }
    .submit-btn.ready:hover { background: #0F6E56; }
    .footer { margin-top: 32px; font-size: 0.72rem; color: #999; text-align: center; }
    .footer a { color: #1D9E75; text-decoration: none; }
    .note { font-size: 0.72rem; color: #aaa; margin-top: 10px; text-align: center; }
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
    <div class="sub">Fill in all your details to reserve this bike</div>
  </div>

  <div class="card">
    <h2>Your Details</h2>
    <form method="POST" action="/bikes/${plate}/inquire" id="reserveForm">
      <div class="field">
        <label>Full Name <span class="required">*</span></label>
        <input type="text" name="name" id="name" placeholder="e.g. John Kamau" required/>
      </div>
      <div class="row">
        <div class="field">
          <label>Phone Number <span class="required">*</span></label>
          <input type="tel" name="phone" id="phone" placeholder="07XX XXX XXX" required/>
        </div>
        <div class="field">
          <label>Email Address <span class="required">*</span></label>
          <input type="email" name="email" id="email" placeholder="your@email.com" required/>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label>ID / Passport No. <span class="required">*</span></label>
          <input type="text" name="id_no" id="id_no" placeholder="National ID or Passport" required/>
        </div>
        <div class="field">
          <label>Occupation <span class="required">*</span></label>
          <input type="text" name="occupation" id="occupation" placeholder="e.g. Rider, Trader" required/>
        </div>
      </div>
      <div class="field">
        <label>Area of Residence <span class="required">*</span></label>
        <input type="text" name="residence" id="residence" placeholder="e.g. Nairobi, Thika" required/>
      </div>
      <button type="submit" class="submit-btn" id="submitBtn" disabled>Fill all fields to Reserve Bike</button>
      <p class="note">All fields are required before you can reserve this bike.</p>
    </form>
  </div>

  <div class="footer">
    Greenwheels Mobility Limited · Nairobi, Kenya<br/>
    <a href="mailto:info@greenwheels.co.ke">info@greenwheels.co.ke</a> · +254 700 000 000
  </div>

  <script>
    const fields = ['name','phone','email','id_no','occupation','residence'];
    const btn = document.getElementById('submitBtn');

    function checkAllFilled() {
      const allFilled = fields.every(id => document.getElementById(id).value.trim() !== '');
      if (allFilled) {
        btn.disabled = false;
        btn.classList.add('ready');
        btn.textContent = 'Reserve Bike →';
      } else {
        btn.disabled = true;
        btn.classList.remove('ready');
        btn.textContent = 'Fill all fields to Reserve Bike';
      }
    }

    fields.forEach(id => {
      document.getElementById(id).addEventListener('input', checkAllFilled);
    });
  </script>
</body>
</html>`;
}

function buildResultPage(plate, success, errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${success ? 'Bike Reserved!' : 'Error'} | Greenwheels</title>
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
      <h2>Bike Reserved!</h2>
      <div class="plate">${plate}</div>
      <p>Your reservation has been received. Our team will contact you shortly to complete the process. Please keep your phone available.</p>
    ` : `
      <div class="icon">⚠️</div>
      <h2>Could Not Reserve</h2>
      <p>${errorMsg}</p>
      <a href="/bikes/${plate}" class="back-btn">Go Back</a>
    `}
  </div>
  <div class="footer">Greenwheels Mobility Limited · Nairobi, Kenya</div>
</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Greenwheels backend v2 running on port ${PORT}`);
