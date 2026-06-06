const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL  = 'http://localhost:5000/api';
const OUT = '/home/user/westgold_disciplinary_system/screenshots';
const VP  = { width: 1440, height: 900 };

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

['admin','teacher','grade-head','parent','platform'].forEach(p =>
  fs.mkdirSync(path.join(OUT, p), { recursive: true })
);

async function shot(page, folder, name, desc = '') {
  await page.waitForTimeout(2500);
  const file = path.join(OUT, folder, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${folder}/${name}.png${desc ? ' — ' + desc : ''}`);
}

async function idle(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function apiLogin(email, password, schoolCode) {
  const body = schoolCode
    ? { email, password, schoolCode }
    : { email, password };
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function injectTokenAndLoad(page, token, user, targetUrl) {
  // Navigate to the app's origin first so localStorage is accessible, then inject and redirect
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user: JSON.stringify(user) });
  await page.goto(`${BASE_URL}${targetUrl}`, { waitUntil: 'domcontentloaded' });
  await idle(page);
}

async function go(page, folder, url, name, desc = '') {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
  await idle(page);
  await shot(page, folder, name, desc);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // ── Login page ─────────────────────────────────────────────
  console.log('\n📸 Login page...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await shot(page, 'admin', '00-login', 'Login page');
    await ctx.close();
  }

  // ── Admin portal ───────────────────────────────────────────
  console.log('\n📸 Admin portal...');
  {
    const { token, user } = await apiLogin('admin@school.com', 'admin123', 'ws2025');
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectTokenAndLoad(page, token, user, '/admin');
    await shot(page, 'admin', '01-dashboard', 'Main dashboard');
    await go(page, 'admin', '/admin/discipline-center', '02-discipline-center', 'Discipline Centre');
    await go(page, 'admin', '/admin/students',           '03-students',           'Students list');
    await go(page, 'admin', '/admin/detention-sessions', '04-detention-sessions', 'Detention sessions');
    await go(page, 'admin', '/admin/behaviour',          '05-behaviour',          'Behaviour incidents');
    await go(page, 'admin', '/admin/merits',             '06-merits',             'Merits');
    await go(page, 'admin', '/admin/attendance',         '07-attendance',         'Attendance');
    await go(page, 'admin', '/admin/interventions',      '08-interventions',      'Interventions');
    await go(page, 'admin', '/admin/reports',            '09-reports',            'Reports');
    await go(page, 'admin', '/admin/teachers',           '10-teachers',           'Teachers');
    await go(page, 'admin', '/admin/classes',            '11-classes',            'Classes');
    await go(page, 'admin', '/admin/settings',           '12-settings',           'School settings');
    await ctx.close();
  }

  // ── Teacher portal ─────────────────────────────────────────
  console.log('\n📸 Teacher portal...');
  {
    const { token, user } = await apiLogin('teacher.rodriguez@school.com', 'teacher123', 'ws2025');
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectTokenAndLoad(page, token, user, '/teacher');
    await shot(page, 'teacher', '01-dashboard', 'Dashboard');
    await go(page, 'teacher', '/teacher/behaviour',     '02-behaviour',    'Behaviour log');
    await go(page, 'teacher', '/teacher/behaviour/log', '03-log-incident', 'Log incident form');
    await go(page, 'teacher', '/teacher/merits',        '04-merits',       'Merits');
    await go(page, 'teacher', '/teacher/merits/award',  '05-award-merit',  'Award merit form');
    await go(page, 'teacher', '/teacher/attendance',    '06-attendance',   'Attendance');
    await go(page, 'teacher', '/teacher/detentions',    '07-detentions',   'Detentions');
    await go(page, 'teacher', '/teacher/interventions', '08-interventions','Interventions');
    await go(page, 'teacher', '/teacher/students',      '09-students',     'Students');
    await go(page, 'teacher', '/teacher/notifications', '10-notifications','Notifications');
    await ctx.close();
  }

  // ── Grade Head portal ──────────────────────────────────────
  console.log('\n📸 Grade Head portal...');
  {
    const { token, user } = await apiLogin('teacher.johnson@school.com', 'teacher123', 'ws2025');
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectTokenAndLoad(page, token, user, '/grade-head');
    await shot(page, 'grade-head', '01-dashboard',  'Dashboard');
    await go(page, 'grade-head', '/grade-head/behaviour', '02-behaviour', 'Behaviour');
    await go(page, 'grade-head', '/grade-head/students',  '03-students',  'Students');
    await go(page, 'grade-head', '/grade-head/detentions','04-detentions','Detentions');
    await go(page, 'grade-head', '/grade-head/merits',    '05-merits',    'Merits');
    await ctx.close();
  }

  // ── Parent portal ──────────────────────────────────────────
  console.log('\n📸 Parent portal...');
  {
    const { token, user } = await apiLogin('parent1@school.com', 'parent123', 'ws2025');
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectTokenAndLoad(page, token, user, '/parent');
    await shot(page, 'parent', '01-dashboard', 'Dashboard');
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
    .filter(f => String(f).endsWith('.png')).length;
  console.log(`\n✅ Done — ${total} screenshots saved to ./screenshots/`);
})();
