/**
 * Admin Portal Interactive Walkthrough
 * Acts as a school admin using every major feature with real interactions
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL  = 'http://localhost:5000/api';
const OUT = '/home/user/westgold_disciplinary_system/screenshots/admin';
const VP  = { width: 1440, height: 900 };
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function shot(page, name, desc = '') {
  stepNum++;
  const num = String(stepNum).padStart(2, '0');
  const file = path.join(OUT, `${num}-${name}.png`);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${num}-${name}.png${desc ? '  —  ' + desc : ''}`);
}

async function idle(page) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(600);
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

async function newPage(browser, token, user) {
  const ctx = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  // Accept all confirm/alert dialogs automatically
  page.on('dialog', d => d.accept());
  await injectSession(page, token, user);
  return { page, ctx };
}

async function go(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
  await idle(page);
}

async function selectOption(page, triggerText, searchFor, optionContains) {
  await page.locator(`button:has-text("${triggerText}")`).first().click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const searchInput = page.locator('input[placeholder="Type to search..."]').last();
  await searchInput.waitFor({ state: 'visible', timeout: 5000 });
  await searchInput.fill(searchFor);
  await page.waitForTimeout(600);
  await page.locator('ul li').filter({ hasText: optionContains }).first().click();
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const { token, user } = await apiLogin('admin@school.com', 'admin123', 'ws2025');
  console.log('✅ Admin login OK\n');

  // ═══════════════════════════════════════════════════════════
  // 1 — LOGIN
  // ═══════════════════════════════════════════════════════════
  console.log('📸 Login');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await shot(page, 'login-page', 'School login — enter your email, password and school code');
    await page.fill('input[type="email"]', 'admin@school.com');
    await page.fill('input[type="password"]', 'admin123');
    await shot(page, 'login-credentials-filled', 'Fill in admin credentials, then click Sign In to access the admin portal');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 2 — DASHBOARD
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Dashboard');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin');
    await shot(page, 'dashboard-overview', 'Admin dashboard: school-wide stats — students, incidents, merits, detentions and pending approvals at a glance');

    // Click "Copy School Code" to demonstrate
    const copyBtn = page.locator('button').filter({ hasText: /Copy School Code/i }).first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'dashboard-school-code-copied', 'Copy your school code to share with new teachers and parents so they can join the right school');
    }

    // Scroll to quick action buttons
    await page.evaluate(() => window.scrollBy(0, 280));
    await page.waitForTimeout(500);
    await shot(page, 'dashboard-quick-actions', 'Quick actions: Log Incident, Award Merit, Assign Consequence and Add Detention — one click away');

    // Scroll to charts
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(500);
    await shot(page, 'dashboard-behaviour-trends', 'School-wide Behaviour Trend chart: compare incidents vs merits across the last 6 months');

    // Scroll to class/teacher activity
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await shot(page, 'dashboard-pending-incidents', 'Pending Incidents section: review and action incidents submitted by teachers without leaving the dashboard');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 3 — STUDENTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Students');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/students');
    await shot(page, 'students-list', 'Students page: full roster with demerit/merit point totals, class assignments and quick-action icons on each row');

    // Search for a student
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Liam');
      await page.waitForTimeout(800);
      await shot(page, 'students-search', 'Use the search bar to instantly filter by name, student ID or parent link code');
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // Open "Add Student" modal
    const addBtn = page.locator('button').filter({ hasText: /Add Student/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'students-add-modal', 'Add Student modal: fill in student ID, name, date of birth and assign to a class — save to enrol immediately');
      // Close modal — click Cancel button inside modal, not just Escape
      const cancelBtn = page.locator('button').filter({ hasText: /^Cancel$/i }).last();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      // Wait for modal overlay to disappear
      await page.locator('.fixed.inset-0').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(800);
    }

    // Navigate to student profile directly (avoids stale modal blocking)
    await page.goto(`${BASE_URL}/admin/students/1`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'student-profile-overview', 'Student detail page: complete profile with demerit/merit points, parent contact and incident summary');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'student-profile-history', 'Scroll to see the student\'s full behaviour history, merit record and any active interventions or consequences');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 4 — CLASSES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Classes');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/classes');
    await shot(page, 'classes-list', 'Classes page: all classes with grade level, assigned teacher, student count and a summary of behaviour activity');

    // Click into Grade 7A
    const firstClass = page.locator('tbody tr, [role="row"]').filter({ hasText: 'Grade 7' }).first();
    if (await firstClass.count() > 0) {
      await firstClass.click();
      await idle(page);
      await shot(page, 'class-detail', 'Class detail: full student list with their individual behaviour scores — spot at-risk students at a glance');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 5 — TEACHERS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Teachers');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/teachers');
    await shot(page, 'teachers-list', 'Teachers page: all staff members with their class assignments, incident counts and grade-head status');

    // Click into first teacher
    const firstTeacher = page.locator('tbody tr').first();
    if (await firstTeacher.count() > 0) {
      await firstTeacher.click();
      await idle(page);
      await shot(page, 'teacher-profile', 'Teacher profile: employment details, class assignments, recent activity and the option to assign as grade head');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 6 — BEHAVIOUR INCIDENTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Behaviour');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/behaviour');
    await shot(page, 'behaviour-all-incidents', 'Behaviour dashboard: every incident logged school-wide, colour-coded by severity with filter and export options');

    // Filter to pending only
    const statusSelect = page.locator('select').filter({ hasText: /Pending|All Status|All/i }).first();
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('pending');
      await page.waitForTimeout(1000);
      await shot(page, 'behaviour-pending-filter', 'Filter to "Pending" status to see all incidents awaiting your approval — teachers cannot finalise without admin sign-off');
    }

    // Click "View Details" on first row
    const viewBtn = page.locator('button[title="View Details"]').first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'behaviour-incident-detail-modal', 'Incident Details modal: review full description, assigned consequences and add admin notes before approving or rejecting');
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Reset filter and approve a pending incident directly
    await go(page, '/admin/behaviour');
    await idle(page);
    const approveBtn = page.locator('button[title="Approve"]').first();
    if (await approveBtn.count() > 0) {
      await shot(page, 'behaviour-before-approve', 'Click the green check icon to approve a pending incident — a confirmation dialog will appear');
      await approveBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'behaviour-incident-approved', 'Incident approved — the status badge updates to "Approved" and the teacher and parent are notified automatically');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 7 — MERITS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Merits');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/merits');
    await shot(page, 'merits-list', 'Merits page: all merit awards school-wide — recognise positive behaviour and monitor which teachers and students are leading');

    // Click award merit quick action
    await go(page, '/admin/merits/award');
    await idle(page);
    await shot(page, 'merit-award-form', 'Award Merit form: admins can award merits directly, or manage merits submitted by teachers');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 8 — DETENTION SESSIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Detention Sessions');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/detention-sessions');
    await shot(page, 'detention-sessions-list', 'Detention Sessions page: all upcoming and past sessions with capacity, teacher on duty and student counts');

    // Click "Qualifying Students" amber card
    const qualCard = page.locator('div, button').filter({ hasText: /Qualifying Students/i }).first();
    if (await qualCard.count() > 0) {
      await qualCard.click();
      await page.waitForTimeout(1200);
      await shot(page, 'detention-qualifying-students', 'Qualifying Students: automatically identifies students who have reached the demerit threshold and qualify for detention');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Open Create Session modal
    const createBtn = page.locator('button').filter({ hasText: /Create Session/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'detention-create-modal-empty', 'Create Session modal: set the date, time, location and maximum capacity for the detention session');

      // Fill in the form
      const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]:nth-of-type(1)', '14:30').catch(() => {});
      const timeInputs = page.locator('input[type="time"]');
      if (await timeInputs.count() >= 1) await timeInputs.nth(0).fill('14:30');
      if (await timeInputs.count() >= 2) await timeInputs.nth(1).fill('16:00');
      await page.fill('input[placeholder*="Room"]', 'Main Hall');
      await page.waitForTimeout(400);
      await shot(page, 'detention-create-modal-filled', 'Fill in session details — location is required; date auto-validates to prevent booking in the past');

      // Submit
      const submitBtn = page.locator('button').filter({ hasText: /Create Session/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'detention-session-created', 'New detention session created — it appears in the list with status "Scheduled" and 0 students assigned');
    }

    // Open session details for first scheduled session
    const viewDetailsBtn = page.locator('button').filter({ hasText: /View Details|Take Register/i }).first();
    if (await viewDetailsBtn.count() > 0) {
      await viewDetailsBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'detention-session-details-modal', 'Session Details: see assigned students, teacher on duty, and take the attendance register on the day');

      // Try to open "Add Student" within the modal
      const addStudentBtn = page.locator('button').filter({ hasText: /Add Student/i }).last();
      if (await addStudentBtn.count() > 0) {
        await addStudentBtn.click();
        await page.waitForTimeout(800);
        await shot(page, 'detention-add-students-modal', 'Add Students modal: search your student roster and tick the students to assign — supports bulk selection');
        // Close inner modal first
        const innerClose = page.locator('button').filter({ hasText: /^Cancel$/ }).last();
        if (await innerClose.count() > 0) await innerClose.click();
        else await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
      }
      // Close outer session-details modal
      const closeBtn = page.locator('button').filter({ hasText: /^Close$/ }).last();
      if (await closeBtn.count() > 0) await closeBtn.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 9 — DISCIPLINE CENTER & RULES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Discipline Center');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/discipline-center');
    await shot(page, 'discipline-center', 'Discipline Centre: a unified view of school-wide discipline metrics — incidents by type, severity breakdown and trends');

    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'discipline-center-charts', 'Drill into incidents by category and severity, with student leaderboards for both behaviour concerns and star performers');

    await go(page, '/admin/discipline-rules');
    await idle(page);
    await shot(page, 'discipline-rules', 'Discipline Rules: define the automatic consequence thresholds — e.g., 10 demerit points triggers a detention assignment');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 10 — CONSEQUENCES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Consequences');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/consequences');
    await shot(page, 'consequences-list', 'Consequences page: manage the consequence catalogue — verbal warnings, written warnings, detentions, suspensions');

    await go(page, '/admin/consequence-management');
    await idle(page);
    await shot(page, 'consequence-management', 'Consequence Management: track every consequence assigned to students — status, due dates and completion verification');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 11 — INTERVENTIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Interventions');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/interventions');
    await shot(page, 'interventions-list', 'Interventions page: monitor all active support programmes — counselling, peer mentoring and academic support for at-risk students');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 12 — REPORTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Reports');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/reports');
    await shot(page, 'reports-analytics', 'Reports & Analytics: generate behaviour, merit, attendance and intervention reports — filter by date range, class or student and export');

    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'reports-charts', 'Visualise trends over time and export data to CSV or PDF for sharing with the school board or parents');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 13 — SETTINGS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Settings');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/settings');
    await shot(page, 'settings-overview', 'School Settings: configure school name, contact details, timezone, demerit thresholds and notification preferences');

    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'settings-thresholds', 'Scroll to set demerit point thresholds: when a student hits the warning level, admin and parents are automatically alerted');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 14 — NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Notifications');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/notifications');
    await shot(page, 'notifications-page', 'Admin notifications: incident submissions, parent messages, detention reminders and system alerts all in one feed');

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 15 — BULK IMPORT
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Bulk Import');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/admin/bulk-import');
    await shot(page, 'bulk-import', 'Bulk Import: upload a CSV to enrol hundreds of students at once — the system validates, creates classes and links parent accounts automatically');

    await ctx.close();
  }

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();
  console.log(`\n✅ Done — ${files.length} admin walkthrough screenshots saved to ./screenshots/admin/`);
  files.forEach(f => console.log(`   ${f}`));
})();
