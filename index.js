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

const BIKE_DATA = {"KMGM084S":{"rate":399,"weeks":49},"KMGM094S":{"rate":399,"weeks":55},"KMGN034C":{"rate":399,"weeks":26},"KMGN071C":{"rate":399,"weeks":29},"KMGN418A":{"rate":399,"weeks":17},"KMGN420C":{"rate":399,"weeks":23},"KMGN509C":{"rate":399,"weeks":28},"KMGN518C":{"rate":399,"weeks":19},"KMGN855B":{"rate":399,"weeks":32},"KMGN931C":{"rate":399,"weeks":77},"KMGP246X":{"rate":399,"weeks":75},"KMGP267X":{"rate":399,"weeks":84},"KMGP341Q":{"rate":399,"weeks":77},"KMGP408Q":{"rate":399,"weeks":77},"KMGP432Q":{"rate":399,"weeks":103},"KMGP440Q":{"rate":399,"weeks":100},"KMGP460Q":{"rate":399,"weeks":69},"KMGP489Q":{"rate":399,"weeks":70},"KMGP531Q":{"rate":399,"weeks":63},"KMGP541X":{"rate":399,"weeks":81},"KMGP542Q":{"rate":399,"weeks":80},"KMGP568N":{"rate":399,"weeks":94},"KMGP573Q":{"rate":399,"weeks":80},"KMGP579X":{"rate":399,"weeks":74},"KMGP604Q":{"rate":399,"weeks":72},"KMGP661N":{"rate":399,"weeks":70},"KMGP787X":{"rate":399,"weeks":70},"KMGP808N":{"rate":399,"weeks":79},"KMGP838N":{"rate":399,"weeks":72},"KMGP846N":{"rate":399,"weeks":62},"KMGP884N":{"rate":399,"weeks":58},"KMGQ024T":{"rate":399,"weeks":76},"KMGQ060T":{"rate":399,"weeks":73},"KMGQ590S":{"rate":399,"weeks":67},"KMGQ599S":{"rate":399,"weeks":99},"KMGQ689S":{"rate":399,"weeks":73},"KMGQ737S":{"rate":399,"weeks":97},"KMGQ745S":{"rate":399,"weeks":81},"KMGQ780R":{"rate":399,"weeks":66},"KMGQ940Z":{"rate":399,"weeks":74},"KMGQ943Z":{"rate":399,"weeks":81},"KMGR236A":{"rate":399,"weeks":90},"KMGR561A":{"rate":399,"weeks":80},"KMGR577A":{"rate":399,"weeks":82},"KMGR581A":{"rate":399,"weeks":90},"KMGR587A":{"rate":399,"weeks":95},"KMGR619A":{"rate":399,"weeks":90},"KMGR621A":{"rate":399,"weeks":92},"KMGR831A":{"rate":399,"weeks":97},"KMGR853A":{"rate":399,"weeks":89},"KMGR889A":{"rate":399,"weeks":83},"KMGS393Y":{"rate":399,"weeks":103},"KMGS395Y":{"rate":399,"weeks":95},"KMGS521X":{"rate":399,"weeks":102},"KMGS675W":{"rate":399,"weeks":94},"KMGS785X":{"rate":399,"weeks":91},"KMGS826W":{"rate":399,"weeks":94},"KMGT009C":{"rate":399,"weeks":102},"KMGT017C":{"rate":399,"weeks":85},"KMGT036N":{"rate":399,"weeks":101},"KMGT039N":{"rate":399,"weeks":99},"KMGT045D":{"rate":399,"weeks":104},"KMGT053C":{"rate":399,"weeks":92},"KMGT079C":{"rate":399,"weeks":58},"KMGT098C":{"rate":399,"weeks":101},"KMGT376P":{"rate":399,"weeks":101},"KMGT384C":{"rate":399,"weeks":96},"KMGT398P":{"rate":399,"weeks":97},"KMGT482C":{"rate":399,"weeks":98},"KMGT497C":{"rate":399,"weeks":99},"KMGT508P":{"rate":399,"weeks":103},"KMGT535E":{"rate":399,"weeks":90},"KMGT539P":{"rate":399,"weeks":104},"KMGT579D":{"rate":399,"weeks":83},"KMGT588P":{"rate":399,"weeks":99},"KMGT622N":{"rate":399,"weeks":96},"KMGT716H":{"rate":399,"weeks":101},"KMGT740H":{"rate":399,"weeks":98},"KMGT784H":{"rate":399,"weeks":93},"KMGT834M":{"rate":399,"weeks":104},"KMGT910M":{"rate":399,"weeks":99},"KMGT933C":{"rate":399,"weeks":91},"KMGT933M":{"rate":399,"weeks":92},"KMGT961H":{"rate":399,"weeks":92},"KMGT962R":{"rate":399,"weeks":102},"KMGP476Q":{"rate":429,"weeks":102},"KMGP790N":{"rate":429,"weeks":104},"KMGP849N":{"rate":429,"weeks":98},"KMGQ598S":{"rate":429,"weeks":102},"KMGQ621S":{"rate":429,"weeks":98},"KMGT069S":{"rate":429,"weeks":97},"KMGT334C":{"rate":429,"weeks":98},"KMGT407C":{"rate":429,"weeks":99},"KMGT534P":{"rate":429,"weeks":99},"KMGT583P":{"rate":429,"weeks":104},"KMGT644N":{"rate":429,"weeks":98},"KMGT720N":{"rate":429,"weeks":98},"KMGT741N":{"rate":429,"weeks":98},"KMGT961R":{"rate":429,"weeks":103},"KMGT976R":{"rate":429,"weeks":99},"KMGP287X":{"rate":459,"weeks":104},"KMGP419Q":{"rate":459,"weeks":98},"KMGP546Q":{"rate":459,"weeks":104},"KMGP574N":{"rate":459,"weeks":98},"KMGP606Q":{"rate":459,"weeks":104},"KMGP841N":{"rate":459,"weeks":104},"KMGR206A":{"rate":459,"weeks":104},"KMGT333C":{"rate":459,"weeks":98},"KMGT387P":{"rate":459,"weeks":100},"KMGT471P":{"rate":459,"weeks":100},"KMGT632N":{"rate":459,"weeks":104},"KMGT707H":{"rate":459,"weeks":104},"KMGT757H":{"rate":459,"weeks":100},"KMGT767R":{"rate":459,"weeks":101},"KMGT900C":{"rate":459,"weeks":103},"KMGT937C":{"rate":459,"weeks":104},"KMGT969R":{"rate":459,"weeks":98},"KMGV155M":{"rate":459,"weeks":103},"KMGV630K":{"rate":459,"weeks":104}};

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Inquiries';

async function ensureHeader() {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A1:J1` });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
        resource: { values: [['Timestamp','Bike Plate','Full Name','Phone','Email','ID / Passport No.','Residence','Daily Rate (KES)','Lease Term (Weeks)','Status']] },
      });
    }
  } catch (e) { console.error('Header check failed:', e.message); }
}

async function checkDuplicate(plate, email) {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A2:J` });
    const rows = res.data.values || [];
    for (const row of rows) {
      if ((row[1] || '').trim().toUpperCase() === plate.toUpperCase()) return { duplicate: true, reason: 'bike' };
      if (email && (row[4] || '').trim().toLowerCase() === email.trim().toLowerCase()) return { duplicate: true, reason: 'email' };
    }
    return { duplicate: false };
  } catch (e) { return { duplicate: false }; }
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.send('Greenwheels Bike Inquiry API is running.'));

app.get('/bikes/:plate', (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const bikeInfo = BIKE_DATA[plate.replace(/\s/g, '')] || null;
  res.send(buildFormPage(plate, bikeInfo));
});

app.post('/bikes/:plate/inquire', async (req, res) => {
  const plate = req.params.plate.toUpperCase();
  const bikeInfo = BIKE_DATA[plate.replace(/\s/g, '')] || {};
  const name     = (req.body.name     || '').trim();
  const phone    = (req.body.phone    || '').trim();
  const email    = (req.body.email    || '').trim();
  const id_no    = (req.body.id_no    || '').trim();
  const residence= (req.body.residence|| '').trim();

  if (!name || !phone || !email || !id_no || !residence) {
    return res.send(buildResultPage(plate, false, 'Please fill in all required fields before reserving.', bikeInfo));
  }

  const { duplicate, reason } = await checkDuplicate(plate, email);
  if (duplicate) {
    const msg = reason === 'bike'
      ? 'This bike has already been reserved by someone else.'
      : 'This email address has already been used to reserve a bike.';
    return res.send(buildResultPage(plate, false, msg, bikeInfo));
  }

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      resource: { values: [[
        new Date().toISOString(),
        plate, name, phone, email, id_no, residence,
        bikeInfo.rate  ? `KES ${bikeInfo.rate}/day` : '',
        bikeInfo.weeks ? `${bikeInfo.weeks} weeks`  : '',
        'Reserved'
      ]] },
    });
    res.send(buildResultPage(plate, true, '', bikeInfo));
  } catch (err) {
    console.error('Sheets error:', err.message);
    res.status(500).send(buildResultPage(plate, false, 'Submission failed. Please try again or call us directly.', bikeInfo));
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

app.get('/admin', (req, res) => res.send(buildAdminLogin('')));

app.post('/admin/login', (req, res) => {
  if ((req.body.password || '') === ADMIN_PASSWORD)
    res.redirect('/admin/dashboard?token=' + encodeURIComponent(ADMIN_PASSWORD));
  else
    res.send(buildAdminLogin('Incorrect password. Try again.'));
});

app.get('/admin/dashboard', async (req, res) => {
  if (req.query.token !== ADMIN_PASSWORD) return res.redirect('/admin');
  try {
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A1:J` });
    res.send(buildAdminDashboard(result.data.values || [], req.query.token, req.query.msg || ''));
  } catch (err) { res.send('<p>Error: ' + err.message + '</p>'); }
});

app.post('/admin/reactivate', async (req, res) => {
  const { token, rowIndex } = req.body;
  if (token !== ADMIN_PASSWORD) return res.redirect('/admin');
  try {
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets.find(s => s.properties.title === SHEET_NAME);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: 'ROWS', startIndex: parseInt(rowIndex), endIndex: parseInt(rowIndex) + 1 } } }] }
    });
    res.redirect('/admin/dashboard?token=' + encodeURIComponent(token) + '&msg=Bike+reactivated+successfully');
  } catch (err) {
    res.redirect('/admin/dashboard?token=' + encodeURIComponent(token) + '&msg=Error:+' + err.message);
  }
});

// ── HTML ─────────────────────────────────────────────────────────────────────

function buildFormPage(plate, bikeInfo) {
  const rateDisplay  = bikeInfo ? `KES ${bikeInfo.rate}/day` : '';
  const weeksDisplay = bikeInfo ? `${bikeInfo.weeks} weeks`  : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Reserve Bike — ${plate} | Greenwheels</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#f0faf5;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding-bottom:40px}
.header{width:100%;background:#1D9E75;color:white;padding:18px 24px;text-align:center}
.header h1{font-size:1.25rem;letter-spacing:1px}
.header p{font-size:.78rem;opacity:.85;margin-top:4px}
.badge{margin:24px auto 0;background:white;border:2px solid #1D9E75;border-radius:12px;padding:14px 28px;text-align:center;width:fit-content;max-width:90%}
.badge .lbl{font-size:.7rem;color:#888;letter-spacing:1px;text-transform:uppercase}
.badge .plate{font-size:1.8rem;font-weight:700;color:#0F6E56;letter-spacing:3px;margin-top:4px}
.badge .sub{font-size:.75rem;color:#555;margin-top:4px}
.tags{display:flex;gap:10px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.tag{background:#e1f5ee;color:#0F6E56;border-radius:20px;padding:4px 14px;font-size:.78rem;font-weight:600}
.card{background:white;border-radius:16px;box-shadow:0 4px 24px rgba(29,158,117,.1);padding:28px 24px;width:92%;max-width:480px;margin-top:24px}
.card h2{font-size:1rem;color:#1D9E75;margin-bottom:20px;border-bottom:1px solid #e0f5ed;padding-bottom:10px}
.field{margin-bottom:16px}
.field label{display:block;font-size:.75rem;color:#555;font-weight:600;margin-bottom:5px}
.field input{width:100%;border:1.5px solid #d0ede3;border-radius:8px;padding:10px 13px;font-size:.9rem;color:#2C2C2A;outline:none;background:#fafdfc;transition:border .2s}
.field input:focus{border-color:#1D9E75;background:white}
.req{color:#e05555}
.row{display:flex;gap:12px}
.row .field{flex:1}
.btn{width:100%;background:#ccc;color:white;border:none;border-radius:10px;padding:13px;font-size:1rem;font-weight:700;cursor:not-allowed;margin-top:8px;transition:background .3s}
.btn.ready{background:#1D9E75;cursor:pointer}
.btn.ready:hover{background:#0F6E56}
.note{font-size:.72rem;color:#aaa;margin-top:10px;text-align:center}
.footer{margin-top:32px;font-size:.72rem;color:#999;text-align:center}
.footer a{color:#1D9E75;text-decoration:none}
</style>
</head>
<body>
<div class="header"><h1>GREENWHEELS MOBILITY</h1><p>CERTIFIED REFURBISHED MOTORCYCLES</p></div>
<div class="badge">
  <div class="lbl">Bike Reference</div>
  <div class="plate">${plate}</div>
  ${bikeInfo ? `<div class="tags"><span class="tag">📅 ${weeksDisplay}</span><span class="tag">💰 ${rateDisplay}</span></div>` : ''}
  <div class="sub" style="margin-top:8px">Fill in all your details to reserve this bike</div>
</div>
<div class="card">
  <h2>Your Details</h2>
  <form method="POST" action="/bikes/${plate}/inquire">
    <div class="field">
      <label>Full Name <span class="req">*</span></label>
      <input type="text" name="name" id="f_name" placeholder="e.g. John Kamau"/>
    </div>
    <div class="row">
      <div class="field">
        <label>Phone <span class="req">*</span></label>
        <input type="tel" name="phone" id="f_phone" placeholder="07XX XXX XXX"/>
      </div>
      <div class="field">
        <label>Email <span class="req">*</span></label>
        <input type="email" name="email" id="f_email" placeholder="you@email.com"/>
      </div>
    </div>
    <div class="field">
      <label>ID / Passport No. <span class="req">*</span></label>
      <input type="text" name="id_no" id="f_id" placeholder="National ID or Passport"/>
    </div>
    <div class="field">
      <label>Area of Residence <span class="req">*</span></label>
      <input type="text" name="residence" id="f_res" placeholder="e.g. Nairobi, Thika"/>
    </div>
    <button type="submit" class="btn" id="submitBtn" disabled>Fill all fields to Reserve Bike</button>
    <p class="note">All fields are required before you can reserve this bike.</p>
  </form>
</div>
<div class="footer">
  Greenwheels Mobility Limited · Nairobi, Kenya<br/>
  <a href="mailto:info@greenwheels.co.ke">info@greenwheels.co.ke</a> · +254 700 000 000
</div>
<script>
var ids = ['f_name','f_phone','f_email','f_id','f_res'];
var btn = document.getElementById('submitBtn');
function checkForm() {
  var allFilled = true;
  for (var i = 0; i < ids.length; i++) {
    if (document.getElementById(ids[i]).value.trim() === '') {
      allFilled = false;
      break;
    }
  }
  if (allFilled) {
    btn.disabled = false;
    btn.className = 'btn ready';
    btn.textContent = 'Reserve Bike \u2192';
  } else {
    btn.disabled = true;
    btn.className = 'btn';
    btn.textContent = 'Fill all fields to Reserve Bike';
  }
}
for (var i = 0; i < ids.length; i++) {
  document.getElementById(ids[i]).addEventListener('input', checkForm);
}
</script>
</body>
</html>`;
}

function buildResultPage(plate, success, errorMsg, bikeInfo) {
  bikeInfo = bikeInfo || {};
  const rateDisplay  = bikeInfo.rate  ? 'KES ' + bikeInfo.rate + '/day' : '';
  const weeksDisplay = bikeInfo.weeks ? bikeInfo.weeks + ' weeks' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${success ? 'Bike Reserved!' : 'Error'} | Greenwheels</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#f0faf5;min-height:100vh;display:flex;flex-direction:column;align-items:center}
.header{width:100%;background:#1D9E75;color:white;padding:18px 24px;text-align:center}
.header h1{font-size:1.25rem;letter-spacing:1px}
.card{background:white;border-radius:16px;box-shadow:0 4px 24px rgba(29,158,117,.1);padding:36px 28px;width:92%;max-width:420px;margin-top:40px;text-align:center}
.icon{font-size:3rem;margin-bottom:16px}
h2{margin-bottom:12px;color:${success ? '#1D9E75' : '#e05555'}}
p{color:#555;font-size:.9rem;line-height:1.6}
.plate{display:inline-block;background:#f0faf5;border:1.5px solid #1D9E75;border-radius:8px;padding:6px 18px;font-weight:700;color:#0F6E56;letter-spacing:2px;margin:16px 0;font-size:1.1rem}
.tags{display:flex;gap:10px;justify-content:center;margin:8px 0;flex-wrap:wrap}
.tag{background:#e1f5ee;color:#0F6E56;border-radius:20px;padding:4px 14px;font-size:.78rem;font-weight:600}
.back{display:inline-block;margin-top:20px;background:#1D9E75;color:white;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:600}
.footer{margin-top:32px;font-size:.72rem;color:#999;text-align:center}
</style>
</head>
<body>
<div class="header"><h1>GREENWHEELS MOBILITY</h1></div>
<div class="card">
${success ? `
  <div class="icon">✅</div>
  <h2>Bike Reserved!</h2>
  <div class="plate">${plate}</div>
  ${bikeInfo.rate ? `<div class="tags"><span class="tag">📅 ${weeksDisplay}</span><span class="tag">💰 ${rateDisplay}</span></div>` : ''}
  <p>Your reservation has been received. Our team will contact you shortly. Please keep your phone available.</p>
` : `
  <div class="icon">⚠️</div>
  <h2>Could Not Reserve</h2>
  <p>${errorMsg}</p>
  <a href="/bikes/${plate}" class="back">Go Back</a>
`}
</div>
<div class="footer">Greenwheels Mobility Limited · Nairobi, Kenya</div>
</body>
</html>`;
}

function buildAdminLogin(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admin | Greenwheels</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0F6E56;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:white;border-radius:16px;padding:40px 36px;width:90%;max-width:380px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.2)}
.logo{font-size:1.1rem;font-weight:700;color:#1D9E75;letter-spacing:1px;margin-bottom:4px}
.sub{font-size:.75rem;color:#aaa;margin-bottom:28px}
h2{font-size:1.2rem;color:#2C2C2A;margin-bottom:20px}
input{width:100%;border:1.5px solid #d0ede3;border-radius:8px;padding:12px;font-size:.95rem;outline:none;margin-bottom:16px}
input:focus{border-color:#1D9E75}
button{width:100%;background:#1D9E75;color:white;border:none;border-radius:8px;padding:12px;font-size:1rem;font-weight:700;cursor:pointer}
.error{color:#e05555;font-size:.82rem;margin-bottom:12px}
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
  const data = rows.slice(1);
  const tableRows = data.map((row, i) => {
    const ts = row[0] ? new Date(row[0]).toLocaleString('en-KE', {timeZone:'Africa/Nairobi'}) : '';
    return `<tr>
      <td><strong style="color:#0F6E56">${row[1]||''}</strong></td>
      <td>${row[2]||''}</td><td>${row[3]||''}</td><td>${row[4]||''}</td>
      <td>${row[5]||''}</td><td>${row[6]||''}</td>
      <td>${row[7]||''}</td><td>${row[8]||''}</td><td>${ts}</td>
      <td><span class="badge">${row[9]||'Reserved'}</span></td>
      <td>
        <form method="POST" action="/admin/reactivate" onsubmit="return confirm('Reactivate bike ${row[1]}?')">
          <input type="hidden" name="token" value="${token}"/>
          <input type="hidden" name="rowIndex" value="${i+1}"/>
          <button type="submit" class="rbtn">Reactivate</button>
        </form>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Admin Dashboard | Greenwheels</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#f0faf5}
.hdr{background:#1D9E75;color:white;padding:16px 28px;display:flex;justify-content:space-between;align-items:center}
.hdr h1{font-size:1.1rem;letter-spacing:1px}
.hdr a{color:white;font-size:.8rem;opacity:.8;text-decoration:none}
.wrap{padding:24px 20px}
.stats{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.stat{background:white;border-radius:12px;padding:16px 24px;flex:1;min-width:140px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.stat .n{font-size:2rem;font-weight:700;color:#1D9E75}
.stat .l{font-size:.75rem;color:#888;margin-top:4px}
.msg{background:#e1f5ee;border:1px solid #1D9E75;color:#0F6E56;padding:10px 16px;border-radius:8px;margin-bottom:16px;font-size:.85rem}
.card{background:white;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.06);overflow:hidden}
.ch{padding:16px 20px;border-bottom:1px solid #e8f5ef;font-weight:600;color:#2C2C2A}
table{width:100%;border-collapse:collapse;font-size:.82rem}
th{background:#f8fdfb;padding:10px 12px;text-align:left;color:#555;font-weight:600;border-bottom:1px solid #e8f5ef;white-space:nowrap}
td{padding:10px 12px;border-bottom:1px solid #f0f9f5;color:#2C2C2A;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8fdfb}
.badge{background:#e1f5ee;color:#0F6E56;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}
.rbtn{background:#e05555;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:.78rem;cursor:pointer;font-weight:600}
.rbtn:hover{background:#c0392b}
.empty{text-align:center;padding:40px;color:#aaa}
</style>
</head>
<body>
<div class="hdr"><h1>🏍️ GREENWHEELS — ADMIN DASHBOARD</h1><a href="/admin">Logout</a></div>
<div class="wrap">
  <div class="stats">
    <div class="stat"><div class="n">${data.length}</div><div class="l">Total Reservations</div></div>
    <div class="stat"><div class="n">${new Set(data.map(r=>r[1])).size}</div><div class="l">Bikes Reserved</div></div>
  </div>
  ${msg ? `<div class="msg">✅ ${msg}</div>` : ''}
  <div class="card">
    <div class="ch">All Reservations</div>
    ${data.length === 0 ? '<div class="empty">No reservations yet</div>' : `
    <div style="overflow-x:auto">
      <table>
        <thead><tr>
          <th>Plate</th><th>Name</th><th>Phone</th><th>Email</th>
          <th>ID No.</th><th>Residence</th>
          <th>Daily Rate</th><th>Lease Term</th><th>Reserved At</th>
          <th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`}
  </div>
</div>
</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('Greenwheels backend v4 running on port ' + PORT);
  await ensureHeader();
});
