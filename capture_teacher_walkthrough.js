/**
 * Teacher Portal Walkthrough — Interactive screenshot guide
 * Simulates a teacher using every major feature step-by-step
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL  = 'http://localhost:5000/api';
const OUT = '/home/user/westgold_disciplinary_system/screenshots/teacher-walkthrough';
const VP  = { width: 1440, height: 900 };
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function shot(page, name, desc = '') {
  stepNum++;
  const num = String(stepNum).padStart(2, '0');
  await page.waitForTimeout(1800);
  const file = path.join(OUT, `${num}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${num}-${name}.png${desc ? ' — ' + desc : ''}`);
  return file;
}

async function idle(page) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function apiLogin(email, password, schoolCode) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, schoolCode }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function injectSession(page, token, user) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user: JSON.stringify(user) });
}

/** Click a SearchableSelect trigger (exact text match) and pick an option */
async function selectOption(page, triggerExactText, searchFor, optionContains) {
  // Use exact text to avoid matching substrings in other buttons
  const trigger = page.locator(`button:has-text("${triggerExactText}")`).first();
  await trigger.click({ timeout: 8000 });
  await page.waitForTimeout(400);

  // The search input appears last in DOM (portal renders at bottom of body)
  const searchInput = page.locator('input[placeholder="Type to search..."]').last();
  await searchInput.waitFor({ state: 'visible', timeout: 5000 });
  await searchInput.fill(searchFor);
  await page.waitForTimeout(600);

  // Click the first matching list item
  const option = page.locator('ul li').filter({ hasText: optionContains }).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const { token, user } = await apiLogin('teacher.rodriguez@school.com', 'teacher123', 'ws2025');

  // ═══════════════════════════════════════════════════════════
  // SECTION 1 — Login
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 1 — Login');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await shot(page, 'login-page', 'The login page — enter your school credentials');

    // Fill in teacher credentials
    await page.fill('input[type="email"]', 'teacher.rodriguez@school.com');
    await page.fill('input[type="password"]', 'teacher123');
    await shot(page, 'login-credentials-entered', 'Enter your school email and password, then click Sign In');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 2 — Dashboard Overview
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 2 — Dashboard');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'dashboard-overview', 'Your dashboard: stat cards show class count, students, incidents logged, merits awarded and unread notifications');

    // Scroll down to show the charts
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(600);
    await shot(page, 'dashboard-behaviour-trends', 'Behaviour Trends chart shows your incidents vs merits over the last 6 months');

    // Scroll further to class activity section
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(600);
    await shot(page, 'dashboard-class-activity', 'Class Activity section shows recent incidents and merits logged across your class by all staff');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 3 — My Classes
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 3 — My Classes');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/classes`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'my-classes-list', 'My Classes page lists every class you teach with student count and quick actions');

    // Click into Grade 7A (class ID 1)
    await page.goto(`${BASE_URL}/teacher/classes/1`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'class-detail-students', 'Class detail view: see all enrolled students, their demerit/merit points and take action');

    // Scroll down to see action buttons and more students
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(600);
    await shot(page, 'class-detail-actions', 'Quick action buttons let you take attendance, log an incident or award a merit directly from class view');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 4 — Student Profile
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 4 — Student Profile');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/students/1`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'student-profile-overview', 'Student profile gives you a full picture: demerit/merit points, incident history and contact info');

    // Scroll down to see incident history
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(600);
    await shot(page, 'student-profile-history', 'Scroll down to see the student\'s complete behaviour incident and merit history');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 5 — Log a Behaviour Incident
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 5 — Log Incident');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/behaviour/log`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'log-incident-blank-form', 'Log Incident form: start by selecting the class and student involved');

    // Step 1 — Select class (default shows "All Classes")
    await selectOption(page, 'All Classes', 'Grade 7', 'Grade 7A');
    await page.waitForTimeout(600);
    await shot(page, 'log-incident-class-selected', 'After selecting a class, the student dropdown is filtered to only that class');

    // Step 2 — Select student
    await selectOption(page, 'Search and select a student...', 'Liam', 'Liam');
    await page.waitForTimeout(400);

    // Step 3 — Select incident type (Disruptive Behavior auto-sets severity to Medium)
    await selectOption(page, 'Search and select incident type...', 'Disruptive', 'Disruptive');
    await page.waitForTimeout(400);

    await shot(page, 'log-incident-dropdowns-filled', 'Select the student, incident type and severity — severity auto-fills from the incident type');

    // Step 5 — Fill description
    await page.fill('textarea[placeholder="Describe what happened..."]',
      'Student was talking loudly and interrupting the lesson during a group activity. Redirected twice before escalating.');
    await page.waitForTimeout(300);

    // Step 6 — Check consequence checkboxes
    await page.locator('label').filter({ hasText: 'Verbal redirection / private talk' }).click();
    await page.waitForTimeout(200);
    await page.locator('label').filter({ hasText: 'Think / reflection sheet' }).click();
    await page.waitForTimeout(200);

    await shot(page, 'log-incident-form-complete', 'Fill in a description of what happened and tick the consequences applied in class');

    // Scroll down to show submit button area
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(400);
    await shot(page, 'log-incident-submit-area', 'Review your entry, then click "Log Incident" to record it — admin will be notified for approval');

    // Submit the form
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3500);
    await shot(page, 'log-incident-submitted', 'Incident logged successfully — it now appears in the behaviour list awaiting admin approval');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 6 — Behaviour Incidents List
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 6 — Behaviour List');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/behaviour`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'behaviour-incidents-list', 'Behaviour page: all incidents you have logged, colour-coded by severity and status');

    // Try to click on first incident row to see detail
    const firstRow = page.locator('tbody tr, [data-row], .incident-row').first();
    const rowExists = await firstRow.count() > 0;
    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      await shot(page, 'behaviour-incident-detail', 'Click any incident to see full details: description, consequences applied and admin notes');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 7 — Award a Merit
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 7 — Award Merit');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/merits/award`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'award-merit-blank-form', 'Award Merit form: recognise outstanding student behaviour or achievement');

    // Select class (default shows "All Classes")
    await selectOption(page, 'All Classes', 'Grade 7', 'Grade 7A');
    await page.waitForTimeout(500);

    // Select student (Aisha Patel)
    await selectOption(page, 'Search and select a student...', 'Aisha', 'Aisha');
    await page.waitForTimeout(400);

    // Select merit type
    await selectOption(page, 'Search and select merit type...', 'Academic', 'Academic Excellence');
    await page.waitForTimeout(400);

    await shot(page, 'award-merit-dropdowns-filled', 'Select the student and merit category from the dropdowns');

    // Fill description
    await page.fill('textarea[placeholder="Describe why this merit is being awarded..."]',
      'Aisha scored 98% on the Grade 7 Mathematics test and helped two classmates understand the algebra concepts after class.');
    await page.waitForTimeout(300);

    await shot(page, 'award-merit-form-complete', 'Add a short description explaining why the student earned this merit — parents will see this');

    // Submit to get confirmation modal
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    await shot(page, 'award-merit-confirmation-modal', 'A confirmation modal appears so you can review the details before awarding — click "Confirm Award"');

    // Confirm the award
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm Award/i }).first();
    const hasConfirm = await confirmBtn.count() > 0;
    if (hasConfirm) {
      await confirmBtn.click();
      await page.waitForTimeout(2500);
      await shot(page, 'award-merit-success', 'Merit awarded! The parent is notified automatically and the student\'s merit points are updated');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 8 — Merits List
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 8 — Merits List');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/merits`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'merits-list', 'Merits page: all merits you have awarded, sorted by date with points and student names');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 9 — Detentions
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 9 — Detentions');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/detentions`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'detentions-overview', 'Detentions page: upcoming sessions you are on duty for, plus students assigned to detention');

    // Scroll down to see assigned students
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(600);
    await shot(page, 'detentions-student-list', 'Scroll down to see the students assigned to each detention session with their reasons');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 10 — Interventions
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 10 — Interventions');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/interventions`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'interventions-list', 'Interventions page: track support programmes (counselling, monitoring, academic support) for at-risk students');

    // Try to click "Guided Intervention" or "New Intervention" button
    const newBtn = page.locator('button').filter({ hasText: /New|Add|Start|Guided/i }).first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'interventions-guided-start', 'The guided intervention wizard walks you through setting up a support plan step by step');
      await page.goBack();
      await idle(page);
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 11 — Consequences
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 11 — Consequences');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/consequences`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'consequences-list', 'Consequences page: track assigned consequences like written warnings, parent meetings and behavioural contracts');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 12 — Notifications
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 12 — Notifications');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/notifications`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'notifications-page', 'Notifications keep you up to date: incident approvals, detention reminders and parent replies');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 13 — Reports
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Step 13 — Reports');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await injectSession(page, token, user);

    await page.goto(`${BASE_URL}/teacher/reports`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'reports-overview', 'Reports page: generate behaviour and merit reports for your class, filter by date range and export');

    await ctx.close();
  }

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));
  console.log(`\n✅ Done — ${files.length} walkthrough screenshots saved to ./screenshots/teacher-walkthrough/`);
  files.forEach(f => console.log(`   ${f}`));
})();
