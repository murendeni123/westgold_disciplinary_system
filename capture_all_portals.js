/**
 * Classly – Full Portal Screenshot Capture
 * Comprehensive walkthrough — every feature on every page.
 * Run a portal:  node capture_all_portals.js admin|teacher|grade-head|parent
 * Run all:       node capture_all_portals.js
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

/** Create a page with token already injected — no login screen shown */
async function newPage(browser, token, user) {
  const ctx  = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  page.on('dialog', dlg => dlg.accept());
  // Inject credentials directly without showing the login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, userStr }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', userStr);
  }, { token, userStr: JSON.stringify(user) });
  return { page, ctx };
}

let _counter = {};
async function ss(page, dir, name) {
  await page.waitForTimeout(1200);
  const n = (_counter[dir] = (_counter[dir] || 0) + 1);
  const num = String(n).padStart(2, '0');
  const filepath = `${dir}/${num}-${name}.png`;
  await page.screenshot({ path: filepath, fullPage: false });
  console.log('  ✓', path.basename(filepath));
  return filepath;
}

async function wait(page, selector, timeout = 10000) {
  try { await page.waitForSelector(selector, { timeout }); } catch (_) {}
}

async function waitNet(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch (_) {}
}

async function scrollTo(page, y) {
  await page.evaluate(y => window.scrollTo(0, y), y);
  await page.waitForTimeout(600);
}

async function clickTab(page, label) {
  const btn = await page.$(`button:has-text("${label}"), [role="tab"]:has-text("${label}")`);
  if (btn) { await btn.click({ force: true }); await page.waitForTimeout(800); return true; }
  return false;
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────
async function captureAdmin(browser) {
  console.log('\n📸  Admin Portal (admin@school.com / DEFAULT)');
  const dir = DIRS.admin;
  _counter[dir] = 0;
  // Clear old screenshots
  fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(`${dir}/${f}`));

  const { token, user } = await getToken('admin@school.com', 'admin123', 'DEFAULT');

  // ── 1. Login page (shown ONCE only) ─────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await wait(page, 'input[type="email"]');
    await page.fill('input[type="email"], input[name="email"]', 'admin@school.com').catch(() => {});
    await page.fill('input[type="password"]', '••••••••').catch(() => {});
    await ss(page, dir, 'login');
    await ctx.close();
  }

  // ── 2. Dashboard ─────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="stat"], [class*="card"], h1', 12000);
    await waitNet(page);
    await ss(page, dir, 'dashboard');
    await scrollTo(page, 400);
    await ss(page, dir, 'dashboard-charts');
    await scrollTo(page, 800);
    await ss(page, dir, 'dashboard-bottom');
    await ctx.close();
  }

  // ── 3. Students ───────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/students`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="student"]');
    await ss(page, dir, 'students-list');

    // Search
    const inp = await page.$('input[placeholder*="search" i], input[type="search"]');
    if (inp) {
      await inp.fill('Liam');
      await page.waitForTimeout(800);
      await ss(page, dir, 'students-search');
      await inp.fill('');
      await page.waitForTimeout(500);
    }

    // Add student modal
    const addBtn = await page.$('button:has-text("Add"), button:has-text("New Student"), button:has-text("Add Student")');
    if (addBtn) {
      await addBtn.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'add-student-modal');
      // Fill form partially
      const fn = await page.$('[role="dialog"] input[name*="first"], [role="dialog"] input[placeholder*="first" i]');
      const ln = await page.$('[role="dialog"] input[name*="last"], [role="dialog"] input[placeholder*="last" i]');
      if (fn) await fn.fill('Thabo');
      if (ln) await ln.fill('Mokoena');
      await ss(page, dir, 'add-student-form-filled');
      await page.keyboard.press('Escape');
    }
    await ctx.close();
  }

  // ── 4. Student profile ────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/students/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1, h2');
    await ss(page, dir, 'student-profile');
    await scrollTo(page, 350);
    await ss(page, dir, 'student-profile-detail');

    // Click incidents / history tab
    const incTab = await page.$('[role="tab"]:has-text("Incident"), [role="tab"]:has-text("History"), [role="tab"]:has-text("Behaviour")');
    if (incTab) {
      await incTab.click({ force: true });
      await page.waitForTimeout(800);
      await ss(page, dir, 'student-incidents-tab');
    }
    // Merits tab
    const mTab = await page.$('[role="tab"]:has-text("Merit")');
    if (mTab) {
      await mTab.click({ force: true });
      await page.waitForTimeout(800);
      await ss(page, dir, 'student-merits-tab');
    }
    await ctx.close();
  }

  // ── 5. Classes ────────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/classes`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="class"]');
    await ss(page, dir, 'classes-list');
    // Open a class
    const row = await page.$('table tbody tr:first-child a, [class*="card"]:first-child, table tbody tr:first-child');
    if (row) {
      await row.click({ force: true });
      await wait(page, '[class*="student"], [class*="class"], h1');
      await ss(page, dir, 'class-detail');
      await scrollTo(page, 400);
      await ss(page, dir, 'class-detail-scroll');
    }
    await ctx.close();
  }

  // ── 6. Teachers ───────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/teachers`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="teacher"]');
    await ss(page, dir, 'teachers-list');
    // Add teacher modal
    const addBtn = await page.$('button:has-text("Add"), button:has-text("Invite"), button:has-text("New Teacher")');
    if (addBtn) {
      await addBtn.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'add-teacher-modal');
      await page.keyboard.press('Escape');
    }
    await ctx.close();
  }

  // ── 7. Parents ────────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/parents`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="parent"], h1');
    await ss(page, dir, 'parents-list');
    await ctx.close();
  }

  // ── 8. Behaviour incidents ────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="incident"], h1');
    await ss(page, dir, 'behaviour-all-incidents');

    // Pending filter
    try {
      const pendBtn = await page.$('button:has-text("Pending"), [value="pending"], [data-value="pending"]');
      if (pendBtn) {
        await pendBtn.click({ force: true });
        await page.waitForTimeout(900);
        await ss(page, dir, 'behaviour-pending-filter');
      }
    } catch (_) {}

    // Open incident detail — re-query after any filter change
    try {
      const firstRow = await page.$('table tbody tr:first-child td, table tbody tr:first-child');
      if (firstRow) {
        await page.evaluate(el => el.click(), firstRow);
        await wait(page, '[role="dialog"]', 6000);
        const dialog = await page.$('[role="dialog"]');
        if (dialog) {
          await ss(page, dir, 'incident-detail-modal');
          const appBtn = await page.$('[role="dialog"] button:has-text("Approve"), [role="dialog"] button:has-text("Resolve")');
          if (appBtn) {
            await appBtn.click({ force: true });
            await page.waitForTimeout(1200);
            await ss(page, dir, 'incident-approved');
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    } catch (_) {}

    // Log new incident
    await page.goto(`${BASE_URL}/admin/behaviour/log`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'log-incident-blank');
    const classS = await page.$('select[name*="class"], [class*="class"] select, select:first-of-type');
    if (classS) { await classS.selectOption({ index: 1 }); await page.waitForTimeout(600); }
    const studS = await page.$('select[name*="student"]');
    if (studS) { await studS.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const typeS = await page.$('select[name*="type"], select[name*="rule"], select[name*="incident"]');
    if (typeS) { await typeS.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const sevS = await page.$('select[name*="severity"]');
    if (sevS) { await sevS.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const desc = await page.$('textarea, input[name*="description"], input[name*="notes"]');
    if (desc) await desc.fill('Student was repeatedly disrupting the lesson and refusing to settle despite two warnings from the teacher.');
    await ss(page, dir, 'log-incident-filled');
    await ctx.close();
  }

  // ── 9. Merits ─────────────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="merit"], h1');
    await ss(page, dir, 'merits-list');
    await scrollTo(page, 400);
    await ss(page, dir, 'merits-list-scroll');

    // Award merit
    await page.goto(`${BASE_URL}/admin/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'award-merit-blank');
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"], select:nth-of-type(2)');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const r = await page.$('textarea, input[name*="reason"]');
    if (r) await r.fill('Exceptional academic improvement and consistently positive attitude throughout the term. A role model for peers.');
    await ss(page, dir, 'award-merit-filled');
    const sub = await page.$('button[type="submit"], button:has-text("Award"), button:has-text("Submit")');
    if (sub) {
      await sub.click({ force: true });
      await wait(page, '[role="dialog"], [class*="confirm"], [class*="success"]', 5000);
      await ss(page, dir, 'award-merit-confirm');
      const yes = await page.$('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes"), [role="dialog"] button:has-text("Award")');
      if (yes) {
        await yes.click({ force: true });
        await page.waitForTimeout(1200);
        await ss(page, dir, 'award-merit-success');
      }
    }
    await ctx.close();
  }

  // ── 10. Detention Sessions ────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/detention-sessions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], table, h1', 10000);
    await ss(page, dir, 'detention-sessions');

    // Qualifying students modal
    const qualBtn = await page.$('button:has-text("Qualifying"), [class*="qualifying"]');
    if (qualBtn) {
      await qualBtn.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'detention-qualifying-students');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Queued students modal
    const queueBtn = await page.$('button:has-text("Queue"), button:has-text("Queued")');
    if (queueBtn) {
      await queueBtn.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'detention-queue');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Create new session modal
    const newBtn = await page.$('button:has-text("Create"), button:has-text("Schedule"), button:has-text("New Session"), button:has-text("Add Session"), button:has-text("+ Session")');
    if (newBtn) {
      await newBtn.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'detention-create-modal');
      const di = await page.$('[role="dialog"] input[type="date"]');
      const ti = await page.$('[role="dialog"] input[type="time"]');
      const lo = await page.$('[role="dialog"] input[placeholder*="location" i], [role="dialog"] input[placeholder*="venue" i], [role="dialog"] input[name*="location"]');
      const du = await page.$('[role="dialog"] input[name*="duration"], [role="dialog"] input[type="number"]');
      if (di) await di.fill('2026-06-20');
      if (ti) await ti.fill('14:30');
      if (lo) await lo.fill('Main Hall – Block A');
      if (du) await du.fill('90');
      await ss(page, dir, 'detention-create-filled');
      await page.keyboard.press('Escape');
    }

    // View a session detail
    const sess = await page.$('[class*="session"]:first-child, [class*="card"]:first-child, table tbody tr:first-child');
    if (sess) {
      await sess.click({ force: true });
      await wait(page, '[role="dialog"]', 5000);
      const dialog = await page.$('[role="dialog"]');
      if (dialog) {
        await ss(page, dir, 'detention-session-detail');
        await page.keyboard.press('Escape');
      }
    }
    await ctx.close();
  }

  // ── 11. Consequences ──────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], table tbody tr, h1');
    await ss(page, dir, 'consequences-list');
    await scrollTo(page, 350);
    await ss(page, dir, 'consequences-list-scroll');

    // Open a consequence detail
    const row = await page.$('table tbody tr:first-child, [class*="card"]:first-child, [class*="consequence-item"]:first-child');
    if (row) {
      await row.click({ force: true });
      await wait(page, '[role="dialog"]', 5000);
      const dialog = await page.$('[role="dialog"]');
      if (dialog) {
        await ss(page, dir, 'consequence-detail-modal');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    }

    // Consequence management
    await page.goto(`${BASE_URL}/admin/consequence-management`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], table, h1');
    await ss(page, dir, 'consequence-management');
    await ctx.close();
  }

  // ── 12. Interventions ─────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], table tbody tr, h1');
    await ss(page, dir, 'interventions-list');
    await scrollTo(page, 350);
    await ss(page, dir, 'interventions-list-scroll');

    // Open an intervention detail
    const row = await page.$('table tbody tr:first-child, [class*="card"]:first-child, [class*="intervention"]:not(h1):not([class*="list"])');
    if (row) {
      await row.click({ force: true });
      await wait(page, '[role="dialog"]', 5000);
      const dialog = await page.$('[role="dialog"]');
      if (dialog) {
        await ss(page, dir, 'intervention-detail-modal');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    }
    await ctx.close();
  }

  // ── 13. Discipline Centre ─────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/discipline`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="discipline"], h1');
    await ss(page, dir, 'discipline-centre');
    await scrollTo(page, 350);
    await ss(page, dir, 'discipline-centre-charts');
    await scrollTo(page, 700);
    await ss(page, dir, 'discipline-centre-leaderboard');

    // Discipline Rules
    await page.goto(`${BASE_URL}/admin/discipline-rules`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="rule"], table, h1');
    await ss(page, dir, 'discipline-rules');
    await scrollTo(page, 400);
    await ss(page, dir, 'discipline-rules-scroll');
    await ctx.close();
  }

  // ── 14. Reports & Analytics ───────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await ss(page, dir, 'reports-overview');
    await scrollTo(page, 400);
    await ss(page, dir, 'reports-charts');
    await scrollTo(page, 800);
    await ss(page, dir, 'reports-bottom');

    // Try different report tabs if any
    const tabs = await page.$$('[role="tab"], .tab-btn, button[data-tab]');
    if (tabs.length > 1) {
      await tabs[1].click({ force: true });
      await page.waitForTimeout(900);
      await ss(page, dir, 'reports-tab2');
    }
    await ctx.close();
  }

  // ── 15. Notifications ─────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, dir, 'notifications');
    await scrollTo(page, 400);
    await ss(page, dir, 'notifications-scroll');
    await ctx.close();
  }

  // ── 16. Bulk Import ───────────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/bulk-import`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="import"], h1');
    await ss(page, dir, 'bulk-import');
    await scrollTo(page, 400);
    await ss(page, dir, 'bulk-import-scroll');
    // Try smart import
    await page.goto(`${BASE_URL}/admin/smart-import`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="import"], h1');
    await ss(page, dir, 'smart-import');
    await ctx.close();
  }

  // ── 17. Settings — ALL 5 tabs ─────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');

    // Tab: Profile (default)
    await ss(page, dir, 'settings-profile-tab');

    // Tab: Password
    await clickTab(page, 'Password');
    await ss(page, dir, 'settings-password-tab');

    // Tab: School Info
    await clickTab(page, 'School Info');
    await wait(page, '[class*="school"], p', 4000);
    await ss(page, dir, 'settings-school-info-tab');
    await scrollTo(page, 300);
    await ss(page, dir, 'settings-school-info-scroll');

    // Tab: Preferences
    const prefDone = await clickTab(page, 'Preferences');
    if (!prefDone) await clickTab(page, 'Notif');
    await wait(page, '[class*="pref"], [class*="toggle"], input[type="checkbox"]', 4000);
    await ss(page, dir, 'settings-preferences-tab');
    await scrollTo(page, 400);
    await ss(page, dir, 'settings-preferences-scroll');

    // Tab: Language
    await clickTab(page, 'Language');
    await wait(page, '[class*="lang"], select, h2', 4000);
    await ss(page, dir, 'settings-language-tab');
    await scrollTo(page, 400);
    await ss(page, dir, 'settings-language-scroll');

    await ctx.close();
  }

  // ── 18. User Management ───────────────────────────────────────────────────────
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="user"], h1');
    await ss(page, dir, 'user-management');
    await ctx.close();
  }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Admin done — ${n} screenshots`);
}

// ── TEACHER ────────────────────────────────────────────────────────────────────
async function captureTeacher(browser) {
  console.log('\n📸  Teacher Portal (teacher.rodriguez@school.com)');
  const dir = DIRS.teacher;
  _counter[dir] = 0;
  fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(`${dir}/${f}`));

  const { token, user } = await getToken('teacher.rodriguez@school.com', 'teacher123', 'DEFAULT');

  // ── 1. Login page — shown ONCE only ─────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await wait(page, 'input[type="email"]');
    await page.fill('input[type="email"], input[name="email"]', 'teacher.rodriguez@school.com').catch(() => {});
    await page.fill('input[type="password"]', '••••••••').catch(() => {});
    await ss(page, dir, 'login');
    await ctx.close();
  }

  // ── 2. Dashboard ─────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], [class*="stat"], h1', 12000);
    await waitNet(page);
    await ss(page, dir, 'dashboard');
    await scrollTo(page, 400);
    await ss(page, dir, 'dashboard-scroll');
    await ctx.close(); }

  // ── 3. My Classes ─────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/classes`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="class"], [class*="card"], h1', 10000);
    await waitNet(page);
    await ss(page, dir, 'my-classes');
    // Click into a class
    const cls = await page.$('[class*="card"]:first-child a, [class*="card"]:first-child button, table tbody tr:first-child a, a[href*="/teacher/classes/"]');
    if (cls) {
      await cls.click({ force: true });
      await wait(page, '[class*="student"], table tbody tr, h2', 8000);
      await waitNet(page);
      await ss(page, dir, 'class-detail');
      await scrollTo(page, 400);
      await ss(page, dir, 'class-detail-scroll');
    }
    await ctx.close(); }

  // ── 4. Student profile ────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/students/1`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1, h2', 10000);
    await waitNet(page);
    await ss(page, dir, 'student-profile');
    await scrollTo(page, 350);
    await ss(page, dir, 'student-profile-detail');
    // Incidents tab
    const incTab = await page.$('[role="tab"]:has-text("Incident"), [role="tab"]:has-text("History"), [role="tab"]:has-text("Behaviour")');
    if (incTab) { await incTab.click({ force: true }); await page.waitForTimeout(800);
                  await ss(page, dir, 'student-incidents-tab'); }
    await ctx.close(); }

  // ── 5. Behaviour list ─────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'button, [role="tab"], h1');
    // Click "Incident History" tab to show the list of logged incidents
    const histTab = await page.$('button:has-text("Incident History"), [role="tab"]:has-text("History"), button:has-text("History")');
    if (histTab) { await histTab.click({ force: true }); await page.waitForTimeout(1000); }
    await waitNet(page);
    await ss(page, dir, 'behaviour-incidents');
    // Open incident detail
    try {
      const row = await page.$('table tbody tr:first-child td:first-child, table tbody tr:first-child');
      if (row) {
        await page.evaluate(el => el.click(), row);
        await wait(page, '[role="dialog"]', 5000);
        const dlg = await page.$('[role="dialog"]');
        if (dlg) { await ss(page, dir, 'incident-detail'); await page.keyboard.press('Escape'); }
      }
    } catch (_) {}
    await ctx.close(); }

  // ── 6. Log Incident ───────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/behaviour/log`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'log-incident-blank');
    const cs = await page.$('select[name*="class"], [class*="class"] select, select:first-of-type');
    if (cs) { await cs.selectOption({ index: 1 }); await page.waitForTimeout(700); }
    const st = await page.$('select[name*="student"]');
    if (st) { await st.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const rt = await page.$('select[name*="rule"], select[name*="type"], select[name*="incident"]');
    if (rt) { await rt.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const sv = await page.$('select[name*="severity"]');
    if (sv) { await sv.selectOption({ index: 1 }); }
    const ta = await page.$('textarea, input[name*="description"]');
    if (ta) await ta.fill('Student was disrupting the class by speaking loudly and refusing to follow seating instructions despite multiple warnings.');
    await ss(page, dir, 'log-incident-filled');
    const sub = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Log Incident")');
    if (sub) {
      await sub.click({ force: true });
      await page.waitForTimeout(1500);
      await ss(page, dir, 'log-incident-submitted');
    }
    await ctx.close(); }

  // ── 7. Merits list ────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'button, [role="tab"], h1');
    // Click "View Merits" tab to show the awarded merits list
    const viewTab = await page.$('button:has-text("View Merits"), [role="tab"]:has-text("View"), button:has-text("View Merit")');
    if (viewTab) { await viewTab.click({ force: true }); await page.waitForTimeout(1000); }
    await waitNet(page);
    await ss(page, dir, 'merits-list');
    await ctx.close(); }

  // ── 8. Award Merit ────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'award-merit-blank');
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"], select:nth-of-type(2)');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const r = await page.$('textarea, input[name*="reason"]');
    if (r) await r.fill('Excellent participation in class discussions and outstanding submission of the science project this term.');
    await ss(page, dir, 'award-merit-filled');
    const conf = await page.$('button[type="submit"], button:has-text("Award"), button:has-text("Submit")');
    if (conf) {
      await conf.click({ force: true });
      await wait(page, '[role="dialog"], [class*="confirm"], [class*="success"]', 5000);
      await ss(page, dir, 'award-merit-confirm');
      const yes = await page.$('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes"), [role="dialog"] button:has-text("Award")');
      if (yes) {
        await yes.click({ force: true });
        await page.waitForTimeout(1200);
        await ss(page, dir, 'award-merit-success');
      }
    }
    await ctx.close(); }

  // ── 9. Detentions ─────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], table, h1');
    await waitNet(page);
    await ss(page, dir, 'detentions');
    await scrollTo(page, 400);
    await ss(page, dir, 'detentions-scroll');
    await ctx.close(); }

  // ── 10. Interventions ─────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], table, h1');
    await waitNet(page);
    await ss(page, dir, 'interventions-list');
    // Open intervention detail
    try {
      const row = await page.$('table tbody tr:first-child, [class*="card"]:first-child');
      if (row) {
        await page.evaluate(el => el.click(), row);
        await wait(page, '[role="dialog"]', 5000);
        const dlg = await page.$('[role="dialog"]');
        if (dlg) { await ss(page, dir, 'intervention-detail'); await page.keyboard.press('Escape'); }
      }
    } catch (_) {}
    // Guided Intervention
    await page.goto(`${BASE_URL}/teacher/interventions/guided`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="guided"], [class*="step"], h1', 8000);
    await waitNet(page);
    await ss(page, dir, 'guided-intervention');
    await ctx.close(); }

  // ── 11. Consequences ──────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], table, h1');
    await waitNet(page);
    await ss(page, dir, 'consequences-list');
    // Open consequence detail
    try {
      const row = await page.$('table tbody tr:first-child, [class*="card"]:first-child');
      if (row) {
        await page.evaluate(el => el.click(), row);
        await wait(page, '[role="dialog"]', 5000);
        const dlg = await page.$('[role="dialog"]');
        if (dlg) { await ss(page, dir, 'consequence-detail'); await page.keyboard.press('Escape'); }
      }
    } catch (_) {}
    await ctx.close(); }

  // ── 12. Assign Consequence ────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/assign-consequence`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, [class*="consequence"], h1', 8000);
    await waitNet(page);
    await ss(page, dir, 'assign-consequence-blank');
    // Try to fill the form
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    if (s1) { await s1.selectOption({ index: 1 }); await page.waitForTimeout(500); }
    const s2 = await page.$('select[name*="type"], select[name*="consequence"]');
    if (s2) { await s2.selectOption({ index: 1 }); await page.waitForTimeout(400); }
    const ta = await page.$('textarea, input[name*="reason"], input[name*="notes"]');
    if (ta) await ta.fill('Repeated disruptive behaviour during lessons despite prior warnings — formal consequence required.');
    await ss(page, dir, 'assign-consequence-filled');
    await ctx.close(); }

  // ── 13. Reports ───────────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await waitNet(page);
    await ss(page, dir, 'reports-overview');
    await scrollTo(page, 400);
    await ss(page, dir, 'reports-charts');
    await ctx.close(); }

  // ── 14. Notifications ─────────────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await waitNet(page);
    await ss(page, dir, 'notifications');
    await ctx.close(); }

  // ── 15. Settings — all 4 tabs ─────────────────────────────────────────────────
  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/teacher/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');

    // Profile (default)
    await ss(page, dir, 'settings-profile');

    // Password
    await clickTab(page, 'Password');
    await ss(page, dir, 'settings-password');

    // Preferences
    const prefDone = await clickTab(page, 'Preferences');
    if (!prefDone) await clickTab(page, 'Notif');
    await wait(page, '[class*="pref"], [class*="toggle"], input[type="checkbox"]', 4000);
    await ss(page, dir, 'settings-preferences');

    // Language
    await clickTab(page, 'Language');
    await wait(page, '[class*="lang"], select, h2', 4000);
    await ss(page, dir, 'settings-language');

    await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Teacher done — ${n} screenshots`);
}

// ── GRADE HEAD ─────────────────────────────────────────────────────────────────
async function captureGradeHead(browser) {
  console.log('\n📸  Grade Head Portal (teacher.johnson@school.com)');
  const dir = DIRS.grade;
  _counter[dir] = 0;
  fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(`${dir}/${f}`));

  const { token, user } = await getToken('teacher.johnson@school.com', 'teacher123', 'DEFAULT');

  { const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'teacher.johnson@school.com').catch(() => {});
    await page.fill('input[type="password"]', '••••••••').catch(() => {});
    await ss(page, dir, 'login');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], h1');
    await ss(page, dir, 'dashboard');
    await scrollTo(page, 400);
    await ss(page, dir, 'dashboard-charts');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/students`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="student"], h1');
    await ss(page, dir, 'students-list');
    const inp = await page.$('input[placeholder*="search" i]');
    if (inp) { await inp.fill('Zoe'); await page.waitForTimeout(700);
               await ss(page, dir, 'students-search'); await inp.fill(''); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/students/4`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="profile"], h1');
    await ss(page, dir, 'student-profile');
    const tab = await page.$('[role="tab"]:has-text("Incident"), [role="tab"]:has-text("History"), [role="tab"]:has-text("Behaviour")');
    if (tab) { await tab.click({ force: true }); await page.waitForTimeout(700);
               await ss(page, dir, 'student-incidents-tab'); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/classes`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="class"], h1');
    await ss(page, dir, 'classes');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="incident"], h1');
    await ss(page, dir, 'behaviour-all');
    const pb = await page.$('button:has-text("Pending"), [value="pending"]');
    if (pb) { await pb.click({ force: true }); await page.waitForTimeout(700);
              await ss(page, dir, 'behaviour-pending'); }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/behaviour/log`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'log-incident-blank');
    const cs = await page.$('select[name*="class"]');
    if (cs) { await cs.selectOption({ index: 1 }); await page.waitForTimeout(600); }
    const st = await page.$('select[name*="student"]');
    if (st) { await st.selectOption({ index: 1 }); }
    const ta = await page.$('textarea');
    if (ta) await ta.fill('Repeated disruption during class — third occurrence this month.');
    await ss(page, dir, 'log-incident-filled');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/merits`, { waitUntil: 'networkidle' });
    await wait(page, 'table tbody tr, [class*="merit"], h1');
    await ss(page, dir, 'merits-list');
    await page.goto(`${BASE_URL}/grade-head/merits/award`, { waitUntil: 'networkidle' });
    await wait(page, 'form, select, h1');
    await ss(page, dir, 'award-merit-blank');
    const s1 = await page.$('select[name*="student"], select:nth-of-type(1)');
    const s2 = await page.$('select[name*="type"]');
    if (s1) await s1.selectOption({ index: 1 });
    if (s2) await s2.selectOption({ index: 1 });
    const r = await page.$('textarea');
    if (r) await r.fill('Outstanding leadership in Grade 8 activities and excellent sportsmanship.');
    await ss(page, dir, 'award-merit-filled');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/detention-sessions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], h1');
    await ss(page, dir, 'detention-sessions');
    await scrollTo(page, 400);
    await ss(page, dir, 'detention-sessions-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/my-teachings`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="teach"], [class*="class"], h1');
    await ss(page, dir, 'my-teachings');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/discipline`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="discipline"], h1');
    await ss(page, dir, 'discipline-centre');
    await scrollTo(page, 400);
    await ss(page, dir, 'discipline-charts');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/consequence-management`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], h1');
    await ss(page, dir, 'consequence-management');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/reports`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="report"], h1');
    await ss(page, dir, 'reports');
    await scrollTo(page, 400);
    await ss(page, dir, 'reports-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, dir, 'notifications');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/grade-head/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');
    await ss(page, dir, 'settings-profile');
    await clickTab(page, 'Password');
    await ss(page, dir, 'settings-password');
    await clickTab(page, 'Language');
    await ss(page, dir, 'settings-language');
    await ctx.close(); }

  const n = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`  ✅  Grade Head done — ${n} screenshots`);
}

// ── PARENT ─────────────────────────────────────────────────────────────────────
async function captureParent(browser) {
  console.log('\n📸  Parent Portal (parent1@school.com)');
  const dir = DIRS.parent;
  _counter[dir] = 0;
  fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => fs.unlinkSync(`${dir}/${f}`));

  const { token, user } = await getToken('parent1@school.com', 'parent123', 'DEFAULT');

  { const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'parent1@school.com').catch(() => {});
    await page.fill('input[type="password"]', '••••••••').catch(() => {});
    await ss(page, dir, 'login');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="dashboard"], h1');
    await ss(page, dir, 'dashboard');
    await scrollTo(page, 400);
    await ss(page, dir, 'dashboard-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/children`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="child"], h1');
    await ss(page, dir, 'my-children');
    const child = await page.$('[class*="card"]:first-child, table tbody tr:first-child, a[href*="children"]');
    if (child) {
      await child.click({ force: true });
      await wait(page, '[class*="profile"], h1');
      await ss(page, dir, 'child-profile');
      await scrollTo(page, 400);
      await ss(page, dir, 'child-profile-scroll');
    }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/behaviour`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="incident"], table, h1');
    await ss(page, dir, 'behaviour');
    const row = await page.$('table tbody tr:first-child, [class*="card"]:first-child');
    if (row) {
      await row.click({ force: true });
      await wait(page, '[role="dialog"]', 5000);
      const d = await page.$('[role="dialog"]');
      if (d) { await ss(page, dir, 'behaviour-detail'); await page.keyboard.press('Escape'); }
    }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/merits`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="merit"], table, h1');
    await ss(page, dir, 'merits');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/attendance`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="attendance"], h1');
    await ss(page, dir, 'attendance');
    await scrollTo(page, 400);
    await ss(page, dir, 'attendance-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/detentions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="detention"], h1');
    await ss(page, dir, 'detentions');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/interventions`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="intervention"], h1');
    await ss(page, dir, 'interventions');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/consequences`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="consequence"], h1');
    await ss(page, dir, 'consequences');
    const item = await page.$('[class*="card"]:first-child, table tbody tr:first-child');
    if (item) {
      await item.click({ force: true });
      await wait(page, '[role="dialog"]', 5000);
      const d = await page.$('[role="dialog"]');
      if (d) { await ss(page, dir, 'consequence-detail'); await page.keyboard.press('Escape'); }
    }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/messages`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="message"], table, h1');
    await ss(page, dir, 'messages-inbox');
    const sentTab = await page.$('[role="tab"]:has-text("Sent"), button:has-text("Sent")');
    if (sentTab) { await sentTab.click({ force: true }); await page.waitForTimeout(600);
                   await ss(page, dir, 'messages-sent'); }
    const comp = await page.$('button:has-text("Compose"), button:has-text("New Message"), button:has-text("New")');
    if (comp) {
      await comp.click({ force: true });
      await wait(page, '[role="dialog"]');
      await ss(page, dir, 'compose-blank');
      const sub = await page.$('[role="dialog"] input[placeholder*="subject" i], [role="dialog"] input[name*="subject"]');
      const bod = await page.$('[role="dialog"] textarea');
      if (sub) await sub.fill('Question about my child\'s recent behaviour report');
      if (bod) await bod.fill("Good day, I would like to discuss the recent incident report for my child. Please advise on available times for a meeting. Thank you.");
      await ss(page, dir, 'compose-filled');
      await page.keyboard.press('Escape');
    }
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/notifications`, { waitUntil: 'networkidle' });
    await wait(page, '[class*="notification"], h1');
    await ss(page, dir, 'notifications');
    await scrollTo(page, 400);
    await ss(page, dir, 'notifications-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/profile`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="profile"], h1');
    await ss(page, dir, 'profile');
    await scrollTo(page, 400);
    await ss(page, dir, 'profile-scroll');
    await ctx.close(); }

  { const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/parent/settings`, { waitUntil: 'networkidle' });
    await wait(page, 'form, [class*="setting"], h1');
    await ss(page, dir, 'settings');
    await scrollTo(page, 400);
    await ss(page, dir, 'settings-scroll');
    await ctx.close(); }

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
