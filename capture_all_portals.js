/**
 * Classly – Full Portal Screenshot Capture
 * One unique screenshot per screen — no repeats.
 * Run a single portal: node capture_all_portals.js admin|teacher|grade-head|parent
 * Run all:            node capture_all_portals.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE_URL    = 'http://localhost:3001';
const BROWSER_BIN = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VP          = { width: 1440, height: 900 };

const DIRS = {
  admin:   'screenshots/admin',
  teacher: 'screenshots/teacher-walkthrough',
  grade:   'screenshots/grade-head',
  parent:  'screenshots/parent',
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── helpers ────────────────────────────────────────────────────────────────────

async function getToken(email, password, schoolCode) {
  const r = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, schoolCode }),
  });
  const d = await r.json();
  if (!d.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(d)}`);
  return { token: d.token, user: d.user };
}

async function newPage(browser, token, user) {
  const ctx  = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  page.on('dialog', dlg => dlg.accept());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  if (token) {
    await page.evaluate(({ token, userStr }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userStr);
    }, { token, userStr: JSON.stringify(user) });
  }
  return { page, ctx };
}

async function ss(page, filename) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: filename, fullPage: false });
  console.log('  ✓', path.basename(filename));
}

async function wait(page, selector, timeout = 8000) {
  try { await page.waitForSelector(selector, { timeout }); } catch (_) {}
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────
async function captureAdmin(browser) {
  console.log('\n📸  Admin Portal (admin@school.com)');
  const dir = DIRS.admin;
  const { token, user } = await getToken('admin@school.com', 'admin123', 'ws2025');

  // 01 Login page
  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await ss(page, `${dir}/01-login.png`); await ctx.close(); }

  // 02 Login credentials filled
  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'admin@school.com').catch(() => {});
    await page.fill('input[type="password"]', 'admin123').catch(() => {});
    await ss(page, `${dir}/02-login-filled.png`); await ctx.close(); }

  // 03 Dashboard
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="stat"], [class*="card"], h1, h2');
    await ss(page, `${dir}/03-dashboard.png`);
    // 04 Dashboard scrolled to charts
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(600);
    await ss(page, `${dir}/04-dashboard-charts.png`);
    await ctx.close(); }

  // 05 Students list
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/students`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="student"]');
    await ss(page, `${dir}/05-students.png`);
    // 06 Search
    const inp = await page.$('input[placeholder*="search" i], input[type="search"]');
    if (inp) { await inp.fill('Liam'); await page.waitForTimeout(700);
               await ss(page, `${dir}/06-students-search.png`); await inp.fill(""); }
    // 07 Add student modal
    const addBtn = await page.$('button:has-text("Add"), button:has-text("New Student")');
    if (addBtn) { await addBtn.click({force:true}); await wait(page, '[role="dialog"]');
                  await ss(page, `${dir}/07-add-student-modal.png`);
                  await page.keyboard.press('Escape'); }
    await ctx.close(); }

  // 08 Student profile
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/students/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1, h2');
    await ss(page, `${dir}/08-student-profile.png`);
    // 09 Incidents tab
    const tab = await page.$('[role="tab"]:has-text("Incident"), button:has-text("Incident"), [role="tab"]:has-text("History")');
    if (tab) { await tab.click({force:true}); await page.waitForTimeout(700);
               await ss(page, `${dir}/09-student-incidents.png`); }
    await ctx.close(); }

  // 10 Classes
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/classes`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="class"]');
    await ss(page, `${dir}/10-classes.png`); await ctx.close(); }

  // 11 Teachers
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/teachers`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="teacher"]');
    await ss(page, `${dir}/11-teachers.png`); await ctx.close(); }

  // 12 Behaviour all incidents
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="incident"]');
    await ss(page, `${dir}/12-behaviour-all.png`);
    // 13 Pending filter
    const pendBtn = await page.$('button:has-text("Pending"), [value="pending"], [data-value="pending"]');
    if (pendBtn) { try { await pendBtn.click({ force: true }); } catch(_) {} ; await page.waitForTimeout(700);
                   await ss(page, `${dir}/13-behaviour-pending.png`); }
    // 14 Incident detail
    const row = await page.$('table tbody tr:first-child, [class*="incident-row"]:first-child');
    if (row) { await row.click({force:true}); await wait(page, '[role="dialog"]');
               await ss(page, `${dir}/14-incident-detail.png`);
               // 15 Approve
               const appBtn = await page.$('button:has-text("Approve")');
               if (appBtn) { await appBtn.click({ force: true }); await page.waitForTimeout(1000);
                             await ss(page, `${dir}/15-incident-approved.png`); }
               else { await page.keyboard.press('Escape'); } }
    await ctx.close(); }

  // 16 Merits list
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="merit"]');
    await ss(page, `${dir}/16-merits.png`);
    // 17 Award form
    await page.goto(`${BASE_URL}/admin/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select');
    await ss(page, `${dir}/17-merit-award-form.png`);
    // 18 Form filled
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"], select:nth-of-type(2)');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const ta = await page.$('textarea, input[name*="reason"]');
    if (ta) await ta.fill('Exceptional academic improvement and positive attitude');
    await ss(page, `${dir}/18-merit-form-filled.png`);
    await ctx.close(); }

  // 19 Detention sessions
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], table, h1');
    await ss(page, `${dir}/19-detentions.png`);
    // 20 Qualifying students
    const qualBtn = await page.$('button:has-text("Qualifying"), [class*="qualifying"]');
    if (qualBtn) { await qualBtn.click({force:true}); await wait(page, '[role="dialog"]');
                   await ss(page, `${dir}/20-qualifying-students.png`);
                   await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    // 21 Create session modal
    const newBtn = await page.$('button:has-text("Create"), button:has-text("Schedule"), button:has-text("New Session"), button:has-text("Add Session")');
    if (newBtn) { await newBtn.click({force:true}); await wait(page, '[role="dialog"]');
                  await ss(page, `${dir}/21-create-detention-modal.png`);
                  const di = await page.$('[role="dialog"] input[type="date"]');
                  if (di) await di.fill('2026-06-15');
                  const vi = await page.$('[role="dialog"] input[placeholder*="venue" i], [role="dialog"] input[name*="venue"]');
                  if (vi) await vi.fill('Library – Room B12');
                  await ss(page, `${dir}/22-create-detention-filled.png`);
                  await page.keyboard.press('Escape'); }
    // 23 Session detail
    const sess = await page.$('[class*="session"]:first-child, table tbody tr:first-child');
    if (sess) { await sess.click({force:true}); await wait(page, '[role="dialog"]');
                await ss(page, `${dir}/23-detention-detail.png`);
                await page.keyboard.press('Escape'); }
    await ctx.close(); }

  // 24-25 Discipline centre
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/discipline-center`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="discipline"], h1');
    await ss(page, `${dir}/24-discipline-centre.png`);
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/25-discipline-leaderboard.png`);
    // 26 Rules tab/page
    const rulesBtn = await page.$('button:has-text("Rules"), a:has-text("Rules"), [role="tab"]:has-text("Rules")');
    if (rulesBtn) { await rulesBtn.click({force:true}); await page.waitForTimeout(700);
                   await ss(page, `${dir}/26-discipline-rules.png`); }
    else { await page.goto(`${BASE_URL}/admin/discipline-center/rules`, { waitUntil: 'networkidle' });
           await ss(page, `${dir}/26-discipline-rules.png`); }
    await ctx.close(); }

  // 27 Consequences
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], table, h1');
    await ss(page, `${dir}/27-consequences.png`); await ctx.close(); }

  // 28 Interventions
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], table, h1');
    await ss(page, `${dir}/28-interventions.png`); await ctx.close(); }

  // 29-30 Reports
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await ss(page, `${dir}/29-reports.png`);
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(600);
    await ss(page, `${dir}/30-reports-charts.png`);
    await ctx.close(); }

  // 31-32 Settings
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');
    await ss(page, `${dir}/31-settings.png`);
    const tTab = await page.$('button:has-text("Threshold"), [role="tab"]:has-text("Threshold")');
    if (tTab) { await tTab.click({force:true}); await page.waitForTimeout(700);
                await ss(page, `${dir}/32-settings-thresholds.png`); }
    await ctx.close(); }

  // 33 Notifications
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, `${dir}/33-notifications.png`); await ctx.close(); }

  // 34 Bulk import
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/bulk-import`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="import"], h1');
    await ss(page, `${dir}/34-bulk-import.png`); await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Admin done — ${n} screenshots`);
}

// ── TEACHER ────────────────────────────────────────────────────────────────────
async function captureTeacher(browser) {
  console.log('\n📸  Teacher Portal (teacher.rodriguez@school.com)');
  const dir = DIRS.teacher;
  const { token, user } = await getToken('teacher.rodriguez@school.com', 'teacher123', 'ws2025');

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await ss(page, `${dir}/01-login.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'teacher.rodriguez@school.com').catch(() => {});
    await page.fill('input[type="password"]', 'teacher123').catch(() => {});
    await ss(page, `${dir}/02-login-filled.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], [class*="card"], h1');
    await ss(page, `${dir}/03-dashboard.png`);
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/04-dashboard-charts.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/my-classes`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="class"], h1');
    await ss(page, `${dir}/05-my-classes.png`);
    const cls = await page.$('[class*="card"]:first-child, table tbody tr:first-child, a[href*="class"]');
    if (cls) { await cls.click({force:true}); await wait(page, '[class*="student"], table');
               await ss(page, `${dir}/06-class-detail.png`); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/students/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1');
    await ss(page, `${dir}/07-student-profile.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/behaviour/log`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, `${dir}/08-log-incident-blank.png`);
    const cs = await page.$('select[name*="class"], [class*="class"] select');
    if (cs) { await cs.selectOption({ index: 1 }); await page.waitForTimeout(600); }
    await ss(page, `${dir}/09-log-incident-class.png`);
    const ss_ = await page.$('select[name*="student"]');
    const rs  = await page.$('select[name*="rule"], select[name*="incident"], select[name*="type"]');
    const sv  = await page.$('select[name*="severity"]');
    if (ss_) await ss_.selectOption({ index: 1 });
    if (rs)  await rs.selectOption({ index: 1 });
    if (sv)  await sv.selectOption({ index: 1 });
    await page.waitForTimeout(500);
    const ta = await page.$('textarea, input[name*="description"]');
    if (ta) await ta.fill('Student was disrupting the lesson and refusing to follow instructions.');
    await ss(page, `${dir}/10-log-incident-filled.png`);
    const sub = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Log Incident")');
    if (sub) { await sub.click({force:true}); await page.waitForTimeout(1200);
               await ss(page, `${dir}/11-log-incident-submitted.png`); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="incident"], h1');
    await ss(page, `${dir}/12-behaviour-list.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, `${dir}/13-award-merit-blank.png`);
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"], select[name*="merit"]');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const r = await page.$('textarea, input[name*="reason"]');
    if (r) await r.fill('Excellent participation and academic improvement this term');
    await ss(page, `${dir}/14-award-merit-filled.png`);
    const conf = await page.$('button:has-text("Confirm"), button:has-text("Award"), button[type="submit"]');
    if (conf) { await conf.click({force:true}); await wait(page, '[role="dialog"], [class*="confirm"]');
                await ss(page, `${dir}/15-award-merit-confirm.png`);
                const yes = await page.$('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")');
                if (yes) { await yes.click({force:true}); await page.waitForTimeout(1000);
                           await ss(page, `${dir}/16-award-merit-success.png`); } }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="merit"], h1');
    await ss(page, `${dir}/17-merits-list.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], h1');
    await ss(page, `${dir}/18-detentions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], h1');
    await ss(page, `${dir}/19-interventions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], h1');
    await ss(page, `${dir}/20-consequences.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await ss(page, `${dir}/21-reports.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, `${dir}/22-notifications.png`); await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Teacher done — ${n} screenshots`);
}

// ── GRADE HEAD ─────────────────────────────────────────────────────────────────
async function captureGradeHead(browser) {
  console.log('\n📸  Grade Head Portal (teacher.johnson@school.com — Grade 8)');
  const dir = DIRS.grade;
  const { token, user } = await getToken('teacher.johnson@school.com', 'teacher123', 'ws2025');

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await ss(page, `${dir}/01-login.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'teacher.johnson@school.com').catch(() => {});
    await page.fill('input[type="password"]', 'teacher123').catch(() => {});
    await ss(page, `${dir}/02-login-filled.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], [class*="card"], h1');
    await ss(page, `${dir}/03-dashboard.png`);
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/04-dashboard-charts.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/students`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="student"], h1');
    await ss(page, `${dir}/05-students.png`);
    const inp = await page.$('input[placeholder*="search" i]');
    if (inp) { await inp.fill('Sipho'); await page.waitForTimeout(700);
               await ss(page, `${dir}/06-students-search.png`); await inp.fill(""); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/students/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1');
    await ss(page, `${dir}/07-student-profile.png`);
    const tab = await page.$('[role="tab"]:has-text("Incident"), [role="tab"]:has-text("History")');
    if (tab) { await tab.click({force:true}); await page.waitForTimeout(700);
               await ss(page, `${dir}/08-student-history.png`); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/classes`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="class"], h1');
    await ss(page, `${dir}/09-classes.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="incident"], h1');
    await ss(page, `${dir}/10-behaviour-all.png`);
    const pb = await page.$('button:has-text("Pending"), [value="pending"]');
    if (pb) { await pb.click({force:true}); await page.waitForTimeout(600);
              await ss(page, `${dir}/11-behaviour-pending.png`); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/behaviour/log`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, `${dir}/12-log-incident-blank.png`);
    const cs = await page.$('select[name*="class"]');
    if (cs) { await cs.selectOption({ index: 1 }); await page.waitForTimeout(600); }
    const st = await page.$('select[name*="student"]');
    if (st) await st.selectOption({ index: 1 });
    const ru = await page.$('select[name*="rule"], select[name*="type"]');
    if (ru) await ru.selectOption({ index: 1 });
    const ta = await page.$('textarea');
    if (ta) await ta.fill('Repeated disruption during class — third occurrence this month.');
    await ss(page, `${dir}/13-log-incident-filled.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="merit"], h1');
    await ss(page, `${dir}/14-merits.png`);
    await page.goto(`${BASE_URL}/grade-head/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, `${dir}/15-award-merit-blank.png`);
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"]');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const r = await page.$('textarea, input[name*="reason"]');
    if (r) await r.fill('Outstanding leadership in Grade 8 activities');
    await ss(page, `${dir}/16-award-merit-filled.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], h1');
    await ss(page, `${dir}/17-detentions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/my-teachings`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="teaching"], [class*="class"], h1');
    await ss(page, `${dir}/18-my-teachings.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/discipline-center`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="discipline"], h1');
    await ss(page, `${dir}/19-discipline-centre.png`);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/20-discipline-charts.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], h1');
    await ss(page, `${dir}/21-consequences.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], h1');
    await ss(page, `${dir}/22-interventions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await ss(page, `${dir}/23-reports.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, `${dir}/24-notifications.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');
    await ss(page, `${dir}/25-settings.png`); await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Grade Head done — ${n} screenshots`);
}

// ── PARENT ─────────────────────────────────────────────────────────────────────
async function captureParent(browser) {
  console.log('\n📸  Parent Portal (parent1@school.com)');
  const dir = DIRS.parent;
  const { token, user } = await getToken('parent1@school.com', 'parent123', 'ws2025');

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await ss(page, `${dir}/01-login.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, null, null);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'parent1@school.com').catch(() => {});
    await page.fill('input[type="password"]', 'parent123').catch(() => {});
    await ss(page, `${dir}/02-login-filled.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], [class*="card"], h1');
    await ss(page, `${dir}/03-dashboard.png`);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/04-dashboard-activity.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/children`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="child"], [class*="student"], h1');
    await ss(page, `${dir}/05-my-children.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/children/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1');
    await ss(page, `${dir}/06-child-profile.png`);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await ss(page, `${dir}/07-child-profile-scroll.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="incident"], table, h1');
    await ss(page, `${dir}/08-behaviour.png`);
    const row = await page.$('table tbody tr:first-child, [class*="incident"]:first-child');
    if (row) { await row.click({force:true}); await wait(page, '[role="dialog"]');
               await ss(page, `${dir}/09-behaviour-detail.png`);
               await page.keyboard.press('Escape'); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/merits`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="merit"], table, h1');
    await ss(page, `${dir}/10-merits.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/attendance`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="attendance"], h1');
    await ss(page, `${dir}/11-attendance.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], h1');
    await ss(page, `${dir}/12-detentions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], h1');
    await ss(page, `${dir}/13-interventions.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], h1');
    await ss(page, `${dir}/14-consequences.png`);
    const item = await page.$('[class*="consequence"]:first-child, table tbody tr:first-child');
    if (item) { await item.click({force:true}); await wait(page, '[role="dialog"]');
                await ss(page, `${dir}/15-consequence-detail.png`);
                await page.keyboard.press('Escape'); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/messages`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="message"], table, h1');
    await ss(page, `${dir}/16-messages-inbox.png`);
    const sentTab = await page.$('[role="tab"]:has-text("Sent"), button:has-text("Sent")');
    if (sentTab) { await sentTab.click({force:true}); await page.waitForTimeout(600);
                   await ss(page, `${dir}/17-messages-sent.png`); }
    const comp = await page.$('button:has-text("Compose"), button:has-text("New Message")');
    if (comp) { await comp.click({force:true}); await wait(page, '[role="dialog"]');
                await ss(page, `${dir}/18-compose-blank.png`);
                const sub = await page.$('[role="dialog"] input[placeholder*="subject" i]');
                const bod = await page.$('[role="dialog"] textarea');
                if (sub) await sub.fill('Question about behaviour report');
                if (bod) await bod.fill("Good day, I would like to discuss my child's recent behaviour incident. Please advise on available times.");
                await ss(page, `${dir}/19-compose-filled.png`);
                await page.keyboard.press('Escape'); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, `${dir}/20-notifications.png`); await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/profile`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="profile"], h1');
    await ss(page, `${dir}/21-profile.png`);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(400);
    await ss(page, `${dir}/22-profile-detail.png`);
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');
    await ss(page, `${dir}/23-settings.png`); await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Parent done — ${n} screenshots`);
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({
    executablePath: BROWSER_BIN, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const [portal] = process.argv.slice(2);
  try {
    if (!portal || portal === 'admin')      await captureAdmin(browser);
    if (!portal || portal === 'teacher')    await captureTeacher(browser);
    if (!portal || portal === 'grade-head') await captureGradeHead(browser);
    if (!portal || portal === 'parent')     await captureParent(browser);
  } finally {
    await browser.close();
  }

  console.log('\n📊  Summary:');
  for (const [k, d] of Object.entries(DIRS)) {
    const n = fs.readdirSync(d).filter(f => f.endsWith('.png')).length;
    console.log(`  ${k}: ${n} screenshots`);
  }
})();
