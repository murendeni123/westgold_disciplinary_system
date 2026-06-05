/**
 * Classly Portal Screenshot Capture
 *
 * Run from the repo root:
 *   npm install playwright
 *   npx playwright install chromium
 *   node capture_screenshots.js
 *
 * Screenshots are saved to ./screenshots/<portal>/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3001'; // change to your live URL if preferred

const CREDENTIALS = {
  admin:   { email: 'admin@school.com',                 password: 'admin123'   },
  teacher: { email: 'teacher.rodriguez@school.com',     password: 'teacher123' },
  parent:  { email: 'parent1@school.com',               password: 'parent123'  },
};

const OUT   = path.join(__dirname, 'screenshots');
const VP    = { width: 1440, height: 900 };
// ─────────────────────────────────────────────────────────────────────────────

['admin','teacher','grade-head','parent','platform'].forEach(p =>
  fs.mkdirSync(path.join(OUT, p), { recursive: true })
);

async function shot(page, folder, name, description = '') {
  await page.waitForTimeout(2000); // let animations settle
  const file = path.join(OUT, folder, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${folder}/${name}.png${description ? ' — ' + description : ''}`);
}

async function idle(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await idle(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function go(page, folder, url, name, description = '') {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
  await idle(page);
  await shot(page, folder, name, description);
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // ── Login page ─────────────────────────────────────────────────────────────
  console.log('\n📸 Login page...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await shot(page, 'admin', '00-login', 'Login page');
    await ctx.close();
  }

  // ── Admin portal ───────────────────────────────────────────────────────────
  console.log('\n📸 Admin portal...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    await shot(page, 'admin', '01-dashboard',          'Main dashboard');
    await go(page, 'admin', '/admin/discipline-center','02-discipline-center', 'Discipline Centre');
    await go(page, 'admin', '/admin/students',          '03-students',          'Students list');
    await go(page, 'admin', '/admin/detention-sessions','04-detention-sessions', 'Detention sessions');
    await go(page, 'admin', '/admin/behaviour',         '05-behaviour',         'Behaviour incidents');
    await go(page, 'admin', '/admin/merits',            '06-merits',            'Merits');
    await go(page, 'admin', '/admin/attendance',        '07-attendance',        'Attendance');
    await go(page, 'admin', '/admin/interventions',     '08-interventions',     'Interventions');
    await go(page, 'admin', '/admin/reports',           '09-reports',           'Reports');
    await go(page, 'admin', '/admin/teachers',          '10-teachers',          'Teachers');
    await go(page, 'admin', '/admin/classes',           '11-classes',           'Classes');
    await go(page, 'admin', '/admin/settings',          '12-settings',          'School settings');
    await ctx.close();
  }

  // ── Teacher portal ─────────────────────────────────────────────────────────
  console.log('\n📸 Teacher portal...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await login(page, CREDENTIALS.teacher.email, CREDENTIALS.teacher.password);
    await shot(page, 'teacher', '01-dashboard',    'Dashboard');
    await go(page, 'teacher', '/teacher/behaviour',      '02-behaviour',    'Behaviour log');
    await go(page, 'teacher', '/teacher/behaviour/log',  '03-log-incident', 'Log incident form');
    await go(page, 'teacher', '/teacher/merits',         '04-merits',       'Merits');
    await go(page, 'teacher', '/teacher/merits/award',   '05-award-merit',  'Award merit form');
    await go(page, 'teacher', '/teacher/attendance',     '06-attendance',   'Attendance');
    await go(page, 'teacher', '/teacher/detentions',     '07-detentions',   'Detentions');
    await go(page, 'teacher', '/teacher/interventions',  '08-interventions','Interventions');
    await go(page, 'teacher', '/teacher/students',       '09-students',     'Students');
    await go(page, 'teacher', '/teacher/notifications',  '10-notifications','Notifications');
    await ctx.close();
  }

  // ── Grade Head portal ──────────────────────────────────────────────────────
  // Update email/password below if you have a grade head account
  console.log('\n📸 Grade Head portal...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    // Use a grade head account — e.g. teacher.johnson@school.com if is_grade_head = true
    await login(page, 'teacher.johnson@school.com', 'teacher123');
    await shot(page, 'grade-head', '01-dashboard',   'Dashboard');
    await go(page, 'grade-head', '/grade-head/behaviour', '02-behaviour', 'Behaviour');
    await go(page, 'grade-head', '/grade-head/students',  '03-students',  'Students');
    await go(page, 'grade-head', '/grade-head/detentions','04-detentions','Detentions');
    await go(page, 'grade-head', '/grade-head/merits',    '05-merits',    'Merits');
    await ctx.close();
  }

  // ── Parent portal ──────────────────────────────────────────────────────────
  console.log('\n📸 Parent portal...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await login(page, CREDENTIALS.parent.email, CREDENTIALS.parent.password);
    await shot(page, 'parent', '01-dashboard',    'Dashboard');
    await go(page, 'parent', '/parent/incidents',    '02-incidents',   'Incidents');
    await go(page, 'parent', '/parent/merits',       '03-merits',      'Merits');
    await go(page, 'parent', '/parent/attendance',   '04-attendance',  'Attendance');
    await go(page, 'parent', '/parent/detentions',   '05-detentions',  'Detentions');
    await go(page, 'parent', '/parent/notifications','06-notifications','Notifications');
    await go(page, 'parent', '/parent/messages',     '07-messages',    'Messages');
    await go(page, 'parent', '/parent/profile',      '08-profile',     'Profile');
    await ctx.close();
  }

  await browser.close();

  const total = fs.readdirSync(OUT, { recursive: true })
    .filter(f => f.endsWith('.png')).length;
  console.log(`\n✅ Done — ${total} screenshots saved to ./screenshots/`);
})();
