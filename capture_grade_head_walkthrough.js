/**
 * Grade Head Portal Interactive Walkthrough
 * Acts as a grade head using both the teacher ("My Teaching") and
 * grade-management features with real interactions
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL  = 'http://localhost:5000/api';
const OUT = '/home/user/westgold_disciplinary_system/screenshots/grade-head';
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

async function newPage(browser, token, user) {
  const ctx = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user: JSON.stringify(user) });
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

  const { token, user } = await apiLogin('teacher.johnson@school.com', 'teacher123', 'ws2025');
  console.log(`✅ Grade Head login OK — role: ${user.role}, gradeHeadFor: ${user.gradeHeadFor}\n`);

  // ═══════════════════════════════════════════════════════════
  // 1 — LOGIN
  // ═══════════════════════════════════════════════════════════
  console.log('📸 Login');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await shot(page, 'login-page', 'Grade heads log in with their school email and password — the system automatically routes them to the Grade Head portal');
    await page.fill('input[type="email"]', 'teacher.johnson@school.com');
    await page.fill('input[type="password"]', 'teacher123');
    await shot(page, 'login-credentials-filled', 'Enter grade head credentials — after signing in you are taken straight to the Grade Head dashboard');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 2 — GRADE MANAGEMENT DASHBOARD
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Grade Management Dashboard');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head');
    await shot(page, 'grade-dashboard-overview', 'Grade Head dashboard: school-wide stats filtered to your grade — incidents, merits, detentions and students at a glance');
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(500);
    await shot(page, 'grade-dashboard-quick-actions', 'Quick Actions give you fast access to log incidents, award merits, manage detentions and view reports');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'grade-dashboard-charts', 'Behaviour trend charts show incident and merit patterns across the entire grade you manage');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 3 — MY TEACHING DASHBOARD (teacher hat)
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 My Teaching Dashboard');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/my-dashboard');
    await shot(page, 'my-dashboard-overview', 'My Dashboard: your personal teacher view — incidents and merits you have logged for your own class, plus other teacher activity in the grade');
    // Click the "Recent Incidents" stat card to navigate
    const incidentCard = page.locator('div').filter({ hasText: /Recent Incidents/i }).first();
    if (await incidentCard.count() > 0) {
      await incidentCard.click();
      await idle(page);
      // back to my dashboard for next shot
      await go(page, '/grade-head/my-dashboard');
    }
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'my-dashboard-activity-feed', 'Activity feed shows incidents and merits logged by all teachers in the grade so you stay informed without checking each class individually');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 4 — MY TEACHINGS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 My Teachings');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/my-teachings');
    await shot(page, 'my-teachings', 'My Teachings: the classes you personally teach — click a card to see the full student roster and manage attendance or incidents');
    // Click through to class detail
    const classCard = page.locator('div[class*="cursor"], div[class*="hover"]').filter({ hasText: /Grade 8/i }).first();
    if (await classCard.count() > 0) {
      await classCard.click();
      await idle(page);
      await shot(page, 'my-teachings-class-detail', 'Class detail shows every student in your teaching class with their demerit/merit totals — take action directly from this view');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 5 — MY CLASS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 My Class');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/my-class');
    await shot(page, 'my-class', 'My Class: your homeroom class at a glance — click to open the full class roster and manage student behaviour from there');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 6 — STUDENTS (grade-filtered)
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Students');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/students');
    await shot(page, 'students-list', 'Students page: all students across every class in your grade — search, filter by class, and see their demerit/merit point totals');

    // Search to demonstrate filter
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Ethan');
      await page.waitForTimeout(800);
      await shot(page, 'students-search', 'Instantly filter students by name or student ID — useful when a student is referred to you by another teacher');
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // Navigate to student profile
    await page.goto(`${BASE_URL}/grade-head/students/3`, { waitUntil: 'domcontentloaded' });
    await idle(page);
    await shot(page, 'student-profile-overview', 'Student profile: complete picture of a student in your grade — demerit/merit points, behaviour history and parent contact details');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'student-profile-incidents', 'Scroll to see the student\'s full incident and merit timeline — as grade head you can see all incidents logged by any teacher in your grade');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 7 — CLASSES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Classes');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/classes');
    await shot(page, 'classes-overview', 'Classes page: all classes in your grade with assigned teachers, student counts and a snapshot of behaviour activity per class');
    // Click into Grade 8B
    const gradeRow = page.locator('tbody tr, [role="row"]').filter({ hasText: /Grade 8/i }).first();
    if (await gradeRow.count() > 0) {
      await gradeRow.click();
      await idle(page);
      await shot(page, 'class-detail-students', 'Class detail: full student list for that class with individual behaviour scores — identify students who need attention');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 8 — BEHAVIOUR DASHBOARD
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Behaviour');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/behaviour');
    await shot(page, 'behaviour-all-incidents', 'Behaviour dashboard: every incident logged across your grade, colour-coded by severity — you can approve, reject or add admin notes');

    // Filter pending
    const statusSelect = page.locator('select').filter({ hasText: /All Status|All|Pending/i }).first();
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('pending');
      await page.waitForTimeout(900);
      await shot(page, 'behaviour-pending-only', 'Filter to "Pending" incidents — these have been logged by teachers and are waiting for your approval as grade head');
    }

    // View incident details modal
    const viewBtn = page.locator('button[title="View Details"]').first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'behaviour-incident-detail-modal', 'Incident Details: review the full description, severity and consequences applied — add your admin notes and approve or reject');
      // Approve from modal if approve button visible
      const approveInModal = page.locator('button[title="Approve"], button').filter({ hasText: /Approve/i }).last();
      if (await approveInModal.count() > 0) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    // Approve a pending incident directly from the list
    await go(page, '/grade-head/behaviour');
    const approveBtn = page.locator('button[title="Approve"]').first();
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'behaviour-incident-approved', 'Incident approved — status updates instantly and the teacher who logged it receives a notification');
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 9 — LOG INCIDENT (as grade head acting as teacher)
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Log Incident');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/behaviour/log');
    await shot(page, 'log-incident-form', 'Grade heads can log incidents directly — useful when witnessing behaviour in corridors, assemblies or during cover lessons');

    // Fill the form
    await selectOption(page, 'All Classes', 'Grade 8', 'Grade 8B');
    await page.waitForTimeout(500);
    await selectOption(page, 'Search and select a student...', 'Ethan', 'Ethan');
    await page.waitForTimeout(400);
    await selectOption(page, 'Search and select incident type...', 'Disrespect', 'Disrespect');
    await page.waitForTimeout(400);
    await page.fill('textarea[placeholder="Describe what happened..."]',
      'Ethan was rude to Mrs Williams in the corridor during period 3. When redirected, he raised his voice. This is the second incident this week.');
    await page.waitForTimeout(300);
    await page.locator('label').filter({ hasText: 'Verbal redirection / private talk' }).click();
    await page.waitForTimeout(200);
    await page.locator('label').filter({ hasText: 'Parent contact' }).click().catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, 'log-incident-filled', 'Fill in the incident details — as grade head your incidents carry authority and are visible to the admin immediately');

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await shot(page, 'log-incident-submitted', 'Incident logged — it is recorded under the student\'s profile and triggers a parent notification if configured');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 10 — MERITS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Merits');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/merits');
    await shot(page, 'merits-list', 'Merits & Demerits: all merit awards across your grade — see which students are excelling and which teachers are recognising positive behaviour');

    // Award merit form
    await go(page, '/grade-head/merits/award');
    await shot(page, 'award-merit-form', 'Award Merit: grade heads can award merits to any student in their grade, not just their own class');
    await selectOption(page, 'All Classes', 'Grade 8', 'Grade 8B');
    await page.waitForTimeout(500);
    await selectOption(page, 'Search and select a student...', 'Zoe', 'Zoe');
    await page.waitForTimeout(400);
    await selectOption(page, 'Search and select merit type...', 'Leadership', 'Leadership');
    await page.waitForTimeout(400);
    await page.fill('textarea[placeholder="Describe why this merit is being awarded..."]',
      'Zoe organised the Grade 8 community clean-up drive entirely on her own initiative and motivated 15 classmates to participate.');
    await page.waitForTimeout(300);
    await shot(page, 'award-merit-filled', 'Fill in the merit details — click "Award Merit" to see the confirmation before finalising');
    // Submit to get confirmation modal
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    await shot(page, 'award-merit-confirmation', 'Review the merit details in the confirmation modal — click "Confirm Award" to save and notify the parent');
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm Award/i }).first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(2500);
      await shot(page, 'award-merit-success', 'Merit awarded successfully — Zoe\'s merit points are updated and her parents receive an automatic notification');
    }
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 11 — DETENTION SESSIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Detention Sessions');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/detention-sessions');
    await shot(page, 'detention-sessions-list', 'Detention Sessions: manage all detention sessions for your grade — view upcoming sessions, student assignments and teacher on duty');

    // Open qualifying students
    const qualCard = page.locator('div, button').filter({ hasText: /Qualifying Students/i }).first();
    if (await qualCard.count() > 0) {
      await qualCard.click();
      await page.waitForTimeout(1200);
      await shot(page, 'detention-qualifying-students', 'Qualifying Students: the system automatically flags students in your grade who have accumulated enough demerit points for detention');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    // View session details for first session
    const viewBtn = page.locator('button').filter({ hasText: /View Details|Take Register/i }).first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'detention-session-details', 'Session Details: see which students are assigned, who is on duty, and take the live attendance register on the day of detention');
      const closeBtn = page.locator('button').filter({ hasText: /^Close$/ }).last();
      if (await closeBtn.count() > 0) await closeBtn.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 12 — DISCIPLINE CENTER
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Discipline Center');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/discipline');
    await shot(page, 'discipline-center', 'Discipline Centre: a comprehensive view of discipline activity across your entire grade — incident categories, severity breakdown and at-risk student flags');
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(500);
    await shot(page, 'discipline-center-leaderboards', 'Scroll down to see the behaviour leaderboards — top students for merits and students with the highest demerit counts in your grade');

    await go(page, '/grade-head/discipline-rules');
    await idle(page);
    await shot(page, 'discipline-rules', 'Discipline Rules: the consequence thresholds that apply to your grade — points at which warnings, detentions or suspensions are automatically triggered');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 13 — CONSEQUENCE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Consequence Management');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/consequence-management');
    await shot(page, 'consequence-management', 'Consequence Management: track every consequence assigned to students in your grade — verify completion, mark as done and follow up with parents');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 14 — REPORTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Reports');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/reports');
    await shot(page, 'reports-overview', 'Reports: generate grade-level behaviour, merit and detention reports — filter by date, class or individual student and export for parent meetings');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await shot(page, 'reports-charts', 'Visual analytics show grade trends over time — ideal for presenting behaviour data at staff meetings or to the principal');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 15 — NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Notifications');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/notifications');
    await shot(page, 'notifications', 'Notifications: incident approvals, parent messages, detention reminders and escalation alerts — everything that needs your attention as grade head');
    await ctx.close();
  }

  // ═══════════════════════════════════════════════════════════
  // 16 — SETTINGS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📸 Settings');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/grade-head/settings');
    await shot(page, 'settings-profile', 'Settings — Profile tab: update your name, email and phone number; your role and grade responsibility are shown as read-only information');

    // Switch to Password tab
    const passwordTab = page.locator('button').filter({ hasText: /Password/i }).first();
    if (await passwordTab.count() > 0) {
      await passwordTab.click();
      await page.waitForTimeout(600);
      await shot(page, 'settings-password', 'Settings — Password tab: change your password securely at any time without contacting the admin');
    }

    // Switch to Preferences tab
    const prefsTab = page.locator('button').filter({ hasText: /Preferences/i }).first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(600);
      await shot(page, 'settings-preferences', 'Settings — Preferences tab: set your language (English, Afrikaans, Zulu or Xhosa) and notification preferences');
    }
    await ctx.close();
  }

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();
  console.log(`\n✅ Done — ${files.length} screenshots in ./screenshots/grade-head/`);
  files.forEach(f => console.log(`   ${f}`));
})();
