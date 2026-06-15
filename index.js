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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GW@Admin2026';

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
      range: `${SHEET_NAME}!A1:I1`,
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

// ─── Public Routes ──────────────────────────────────────────────────────────

app.get('/', (req, res) => res.send('Greenwheels Bike Inquiry API is running.'));

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

  const { duplicate, reason } = await checkDuplicate(plate, email);
  if (duplicate) {
    if (reason === 'bike') return res.send(buildResultPage(plate, false, 'This bike has already been reserved by someone else.'));
    if (reason === 'email') return res.send(buildResultPage(plate, false, 'This email address has already been used to reserve a bike.'));
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
          plate, name, phone, email, id_no, occupation, residence, 'Reserved'
        ]],
      },
    });
    res.send(buildResultPage(plate, true));
  } catch (err) {
    console.error('Sheets error:', err.message);
    res.status(500).send(buildResultPage(plate, false, 'Submission failed. Please try again or call us directly.'));
  }
});

// ─── Admin Routes ───────────────────────────────────────────────────────────

// Admin login page
app.get('/admin', (req, res) => res.send(buildAdminLogin('')));

// Admin login POST
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.redirect(`/admin/dashboard?token=${encodeURIComponent(ADMIN_PASSWORD)}`);
  } else {
    res.send(buildAdminLogin('Incorrect password. Try again.'));
  }
});

// Admin dashboard
app.get('/admin/dashboard', async (req, res) => {
  if (req.query.token !== ADMIN_PASSWORD) return res.redirect('/admin');
  try {
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:I`,
    });
    const rows = result.data.values || [];
    res.send(buildAdminDashboard(rows, req.query.token));
  } catch (err) {
    res.send(`<p>Error loading data: ${err.message}</p>`);
  }
});

// Admin reactivate (delete row)
app.post('/admin/reactivate', async (req, res) => {
  const { token, rowIndex } = req.body;
  if (token !== ADMIN_PASSWORD) return res.redirect('/admin');

  try {
    const sheets = getSheetsClient();
    // Get spreadsheet ID for sheetId
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: parseInt(rowIndex),
              endIndex: parseInt(rowIndex) + 1,
            }
          }
        }]
      }
    });
    res.redirect(`/admin/dashboard?token=${encodeURIComponent(token)}&msg=Bike+reactivated+successfully`);
  } catch (err) {
    console.error('Reactivate error:', err.message);
    res.redirect(`/admin/dashboard?token=${encodeURIComponent(token)}&msg=Error:+${err.message}`);
  }
});

// ─── HTML Builders ──────────────────────────────────────────────────────────

function buildAdminLogin(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Login | Greenwheels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0F6E56; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; border-radius: 16px; padding: 40px 36px; width: 90%; max-width: 380px; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
    .logo { font-size: 1.1rem; font-weight: 700; color: #1D9E75; letter-spacing: 1px; margin-bottom: 4px; }
    .sub { font-size: 0.75rem; color: #aaa; margin-bottom: 28px; }
    h2 { font-size: 1.2rem; color: #2C2C2A; margin-bottom: 20px; }
    input { width: 100%; border: 1.5px solid #d0ede3; border-radius: 8px; padding: 12px; font-size: 0.95rem; outline: none; margin-bottom: 16px; }
    input:focus { border-color: #1D9E75; }
    button { width: 100%; background: #1D9E75; color: white; border: none; border-radius: 8px; padding: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    button:hover { background: #0F6E56; }
    .error { color: #e05555; font-size: 0.82rem; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GREENWHEELS MOBILITY</div>
    <div class="sub">ADMIN PORTAL</div>
    <h2>🔐 Sign In</h2>
    ${error ? `<p class="error">${error}</p>` : ''}
    <form method="POST" action="/admin/login">
      <input type="password" name="password" placeholder="Enter admin password" required autofocus/>
      <button type="submit">Login →</button>
    </form>
  </div>
</body>
</html>`;
}

function buildAdminDashboard(rows, token, msg) {
  const header = rows[0] || [];
  const data = rows.slice(1);
  const message = msg || '';

  const tableRows = data.map((row, i) => {
    const plate = row[1] || '';
    const name  = row[2] || '';
    const phone = row[3] || '';
    const email = row[4] || '';
    const idNo  = row[5] || '';
    const occ   = row[6] || '';
    const res   = row[7] || '';
    const status= row[8] || 'Reserved';
    const time  = row[0] ? new Date(row[0]).toLocaleString('en-KE', {timeZone:'Africa/Nairobi'}) : '';
    const rowIndex = i + 1; // +1 because row 0 is header

    return `<tr>
      <td><strong style="color:#0F6E56;letter-spacing:1px">${plate}</strong></td>
      <td>${name}</td>
      <td>${phone}</td>
      <td>${email}</td>
      <td>${idNo}</td>
      <td>${occ}</td>
      <td>${res}</td>
      <td>${time}</td>
      <td><span class="badge">${status}</span></td>
      <td>
        <form method="POST" action="/admin/reactivate" onsubmit="return confirm('Reactivate bike ${plate}? This will remove the reservation.')">
          <input type="hidden" name="token" value="${token}"/>
          <input type="hidden" name="rowIndex" value="${rowIndex}"/>
          <button type="submit" class="react-btn">Reactivate</button>
        </form>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Dashboard | Greenwheels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0faf5; min-height: 100vh; }
    .header { background: #1D9E75; color: white; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 1.1rem; letter-spacing: 1px; }
    .header a { color: white; font-size: 0.8rem; opacity: 0.8; text-decoration: none; }
    .container { padding: 24px 20px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat { background: white; border-radius: 12px; padding: 16px 24px; flex: 1; min-width: 140px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .stat .num { font-size: 2rem; font-weight: 700; color: #1D9E75; }
    .stat .lbl { font-size: 0.75rem; color: #888; margin-top: 4px; }
    .msg { background: #e1f5ee; border: 1px solid #1D9E75; color: #0F6E56; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; }
    .card { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #e8f5ef; font-weight: 600; color: #2C2C2A; font-size: 0.95rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { background: #f8fdfb; padding: 10px 12px; text-align: left; color: #555; font-weight: 600; border-bottom: 1px solid #e8f5ef; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f9f5; color: #2C2C2A; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fdfb; }
    .badge { background: #e1f5ee; color: #0F6E56; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .react-btn { background: #e05555; color: white; border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.78rem; cursor: pointer; font-weight: 600; white-space: nowrap; }
    .react-btn:hover { background: #c0392b; }
    .empty { text-align: center; padding: 40px; color: #aaa; }
    @media(max-width:600px) { .container { padding: 12px; } table { font-size: 0.72rem; } th,td { padding: 8px 6px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏍️ GREENWHEELS — ADMIN DASHBOARD</h1>
    <a href="/admin">Logout</a>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat"><div class="num">${data.length}</div><div class="lbl">Total Reservations</div></div>
      <div class="stat"><div class="num">${data.filter(r => (r[8]||'') === 'Reserved').length}</div><div class="lbl">Active Reserved</div></div>
      <div class="stat"><div class="num">${new Set(data.map(r => r[1])).size}</div><div class="lbl">Bikes Reserved</div></div>
    </div>
    ${message ? `<div class="msg">✅ ${message}</div>` : ''}
    <div class="card">
      <div class="card-header">All Reservations</div>
      ${data.length === 0 ? '<div class="empty">No reservations yet</div>' : `
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Plate</th><th>Name</th><th>Phone</th><th>Email</th>
            <th>ID No.</th><th>Occupation</th><th>Residence</th>
            <th>Reserved At</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`}
    </div>
  </div>
</body>
</html>`;
}

function buildFormPage(plate) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reserve Bike — ${plate} | Greenwheels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0faf5; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 0 0 40px; }
    .header { width: 100%; background: #1D9E75; color: white; padding: 18px 24px; text-align: center; }
    .header h1 { font-size: 1.25rem; letter-spacing: 1px; }
    .header p { font-size: 0.78rem; opacity: 0.85; margin-top: 4px; letter-spacing: 0.5px; }
    .bike-badge { margin: 24px auto 0; background: white; border: 2px solid #1D9E75; border-radius: 12px; padding: 14px 28px; text-align: center; width: fit-content; max-width: 90%; }
    .bike-badge .label { font-size: 0.7rem; color: #888; letter-spacing: 1px; text-transform: uppercase; }
    .bike-badge .plate { font-size: 1.8rem; font-weight: 700; color: #0F6E56; letter-spacing: 3px; margin-top: 4px; }
    .bike-badge .sub { font-size: 0.75rem; color: #555; margin-top: 4px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(29,158,117,0.10); padding: 28px 24px; width: 92%; max-width: 480px; margin-top: 24px; }
    .card h2 { font-size: 1rem; color: #1D9E75; margin-bottom: 20px; border-bottom: 1px solid #e0f5ed; padding-bottom: 10px; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 0.75rem; color: #555; font-weight: 600; margin-bottom: 5px; letter-spacing: 0.4px; }
    .field input { width: 100%; border: 1.5px solid #d0ede3; border-radius: 8px; padding: 10px 13px; font-size: 0.9rem; color: #2C2C2A; outline: none; transition: border 0.2s; background: #fafdfc; }
    .field input:focus { border-color: #1D9E75; background: white; }
    .required { color: #e05555; }
    .row { display: flex; gap: 12px; }
    .row .field { flex: 1; }
    .submit-btn { width: 100%; background: #ccc; color: white; border: none; border-radius: 10px; padding: 13px; font-size: 1rem; font-weight: 700; cursor: not-allowed; margin-top: 8px; letter-spacing: 0.5px; transition: background 0.3s; }
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
      if (allFilled) { btn.disabled = false; btn.classList.add('ready'); btn.textContent = 'Reserve Bike →'; }
      else { btn.disabled = true; btn.classList.remove('ready'); btn.textContent = 'Fill all fields to Reserve Bike'; }
    }
    fields.forEach(id => document.getElementById(id).addEventListener('input', checkAllFilled));
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
    body { font-family: 'Segoe UI', sans-serif; background: #f0faf5; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    .header { width: 100%; background: #1D9E75; color: white; padding: 18px 24px; text-align: center; }
    .header h1 { font-size: 1.25rem; letter-spacing: 1px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(29,158,117,0.10); padding: 36px 28px; width: 92%; max-width: 420px; margin-top: 40px; text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h2 { color: ${success ? '#1D9E75' : '#e05555'}; margin-bottom: 12px; }
    p { color: #555; font-size: 0.9rem; line-height: 1.6; }
    .plate { display: inline-block; background: #f0faf5; border: 1.5px solid #1D9E75; border-radius: 8px; padding: 6px 18px; font-weight: 700; color: #0F6E56; letter-spacing: 2px; margin: 16px 0; font-size: 1.1rem; }
    .back-btn { display: inline-block; margin-top: 20px; background: #1D9E75; color: white; padding: 11px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
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
  await ensureHeader();
});
