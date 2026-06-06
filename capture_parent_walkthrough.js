/**
 * Parent Portal Interactive Walkthrough
 * Acts as Jane Smith (parent1@school.com), parent of Liam Ndlovu and Aisha Patel,
 * demonstrating every feature of the parent-facing portal.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL  = 'http://localhost:5000/api';
const OUT = '/home/user/westgold_disciplinary_system/screenshots/parent';
const VP  = { width: 1440, height: 900 };
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function shot(page, name, desc = '') {
  stepNum++;
  const num = String(stepNum).padStart(2, '0');
  const file = path.join(OUT, `${num}-${name}.png`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${num}-${name}.png${desc ? '  —  ' + desc : ''}`);
}

async function idle(page) {
  await page.waitForLoadState('networkidle', { timeout: 14000 }).catch(() => {});
  await page.waitForTimeout(700);
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

(async () => {
  // Login
  const { token, user } = await apiLogin('parent1@school.com', 'parent123', 'ws2025');
  if (!user.children || user.children.length === 0) {
    throw new Error('No children returned — check parent_id fix in students table');
  }
  const childId1 = user.children[0].id; // Liam
  const childId2 = user.children[1].id; // Aisha
  console.log(`✅ Parent login OK — ${user.name} | children: ${user.children.map(c => c.first_name).join(', ')}`);

  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // ── 1. LOGIN PAGE ─────────────────────────────────────────────────────────
  console.log('\n📸 Login...');
  {
    const ctx = await browser.newContext({ viewport: VP });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 25000 });
    await shot(page, 'login-page',
      'Parents access the school portal through the same login page — enter your school email and password');

    // Fill credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passInput  = page.locator('input[type="password"]').first();
    await emailInput.fill('parent1@school.com');
    await passInput.fill('parent123');
    await shot(page, 'login-credentials-filled',
      'Enter your registered email and password — parents use the same login page as teachers and administrators');

    await ctx.close();
  }

  // ── 2. DASHBOARD ──────────────────────────────────────────────────────────
  console.log('\n📸 Dashboard...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent');
    await shot(page, 'dashboard-overview',
      'Parent dashboard: your central hub showing a summary of all your children\'s behaviour, merits, attendance and upcoming detentions');

    // Scroll down to see charts
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(1200);
    await shot(page, 'dashboard-charts',
      'Scroll down to see monthly behaviour and attendance trend charts — track progress at a glance without opening individual reports');

    // Scroll down more to see notifications & recent activity
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    await shot(page, 'dashboard-recent-activity',
      'Recent activity feed and unread notifications — the dashboard surfaces the most important updates so you never miss a critical alert');

    await ctx.close();
  }

  // ── 3. MY CHILDREN ────────────────────────────────────────────────────────
  console.log('\n📸 My Children...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/children');
    await shot(page, 'children-overview',
      'My Children: a card for each child linked to your account — demerit totals, merit points and attendance rate shown at a glance');

    // Click into Liam's card if available
    try {
      const childCard = page.locator(`a[href*="/parent/children/${childId1}"], button`).filter({ hasText: /Liam/i }).first();
      const cardExists = await childCard.count();
      if (cardExists) {
        await childCard.click();
        await idle(page);
        await shot(page, 'child-profile-liam',
          'Child profile for Liam Ndlovu — full overview of behaviour incidents, merits and attendance with trend graphs');

        // Scroll for more detail
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(1000);
        await shot(page, 'child-profile-liam-detail',
          'Scroll to see the detailed activity timeline — every incident and merit logged by teachers is visible here');
      } else {
        // Navigate directly
        await go(page, `/parent/children/${childId1}`);
        await shot(page, 'child-profile-liam',
          'Child profile for Liam Ndlovu — complete behaviour, merit and attendance overview');
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(1000);
        await shot(page, 'child-profile-liam-detail',
          'Detailed activity timeline showing every incident and merit logged by teachers');
      }
    } catch (e) {
      await go(page, `/parent/children/${childId1}`);
      await shot(page, 'child-profile-liam', 'Child profile — Liam Ndlovu');
    }

    // Go back and open Aisha's profile
    await go(page, `/parent/children/${childId2}`);
    await shot(page, 'child-profile-aisha',
      'Aisha Patel\'s profile — click between children to compare performance and monitor each child individually');

    await ctx.close();
  }

  // ── 4. BEHAVIOUR / INCIDENTS ──────────────────────────────────────────────
  console.log('\n📸 Behaviour incidents...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/behaviour');
    await shot(page, 'behaviour-all-incidents',
      'Behaviour report: every incident logged for your children by any teacher — incident type, severity, date and demerit points');

    // Filter by child
    try {
      const childFilter = page.locator('select, [role="combobox"]').filter({ hasText: /all children|all students/i }).first();
      if (await childFilter.count() > 0) {
        await childFilter.selectOption({ label: /Liam/i });
        await idle(page);
        await shot(page, 'behaviour-filtered-liam',
          'Filter incidents by child — useful when you have multiple children and want to focus on one at a time');
      }
    } catch (e) { /* filter not always visible */ }

    // Click on an incident row to see details
    try {
      const firstRow = page.locator('table tbody tr, [data-testid="incident-row"], .incident-card').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await idle(page);
        await shot(page, 'behaviour-incident-detail',
          'Incident detail: full description, teacher notes, severity level and any consequence assigned — tap to read the teacher\'s account of events');
        // Close modal if open
        const closeBtn = page.locator('button').filter({ hasText: /close|dismiss|×/i }).last();
        if (await closeBtn.count() > 0) await closeBtn.click();
        await page.waitForTimeout(600);
      }
    } catch (e) { /* no row */ }

    await ctx.close();
  }

  // ── 5. MERITS ─────────────────────────────────────────────────────────────
  console.log('\n📸 Merits...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/merits');
    await shot(page, 'merits-overview',
      'Merits & Awards: positive recognitions awarded to your children by their teachers — category, description and merit points earned');

    // Scroll down for more
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await shot(page, 'merits-detail',
      'Each merit entry shows which teacher awarded it, what it was for, and how many merit points were added to your child\'s running total');

    await ctx.close();
  }

  // ── 6. ATTENDANCE ─────────────────────────────────────────────────────────
  console.log('\n📸 Attendance...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/attendance');
    await idle(page);
    await shot(page, 'attendance-overview',
      'Attendance overview: daily attendance records for all your children — present, absent and late entries colour-coded for quick review');

    // Try to filter/navigate — some portals have a date range
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await shot(page, 'attendance-records',
      'Scroll to see the full attendance calendar — absences are highlighted so you can quickly identify any patterns or missing notes');

    await ctx.close();
  }

  // ── 7. DETENTIONS ─────────────────────────────────────────────────────────
  console.log('\n📸 Detentions...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/detentions');
    await shot(page, 'detentions-overview',
      'Detentions: all detention assignments for your children — date, time, location and reason so you can plan accordingly');

    // Scroll for more
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await shot(page, 'detentions-detail',
      'Each detention record shows the session details and current status — "Assigned" means confirmed, "Attended" means completed');

    await ctx.close();
  }

  // ── 8. INTERVENTIONS ──────────────────────────────────────────────────────
  console.log('\n📸 Interventions...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/interventions');
    await shot(page, 'interventions-overview',
      'Interventions: support programmes assigned to your children — counselling, academic support, mentoring and their progress status');

    // Try filter toggle
    try {
      const filterBtn = page.locator('button').filter({ hasText: /filter|show filter/i }).first();
      if (await filterBtn.count() > 0) {
        await filterBtn.click();
        await page.waitForTimeout(600);
        await shot(page, 'interventions-filters',
          'Use filters to narrow by child, intervention type or status — helpful when managing multiple active support programmes');
        await filterBtn.click();
        await page.waitForTimeout(400);
      }
    } catch (e) { /* filter not present */ }

    await ctx.close();
  }

  // ── 9. CONSEQUENCES ───────────────────────────────────────────────────────
  console.log('\n📸 Consequences...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/consequences');
    await shot(page, 'consequences-overview',
      'Consequences: formal consequences assigned to your children — detention notices, verbal warnings and other disciplinary actions requiring your acknowledgement');

    // Try to click a consequence to view details
    try {
      const viewBtn = page.locator('button').filter({ hasText: /view|details|eye/i }).first();
      if (await viewBtn.count() > 0) {
        await viewBtn.click();
        await idle(page);
        await shot(page, 'consequence-details-modal',
          'Consequence detail modal: full description of the consequence, reason, date range and any additional notes from the administrator');

        // Try to acknowledge
        const acknowledgeBtn = page.locator('button').filter({ hasText: /acknowledge/i }).first();
        if (await acknowledgeBtn.count() > 0) {
          await acknowledgeBtn.click();
          await page.waitForTimeout(600);
          await shot(page, 'consequence-acknowledge-modal',
            'Acknowledge the consequence to confirm you have been informed — add notes if needed before submitting your acknowledgement');

          // Fill notes
          const notesField = page.locator('textarea').first();
          if (await notesField.count() > 0) {
            await notesField.fill('Thank you for letting me know. I have spoken with Liam about this and he understands the consequence.');
          }
          await page.waitForTimeout(500);
          await shot(page, 'consequence-acknowledge-filled',
            'Add a parent response note to document your acknowledgement — this is visible to the school administrator');

          // Submit
          const submitBtn = page.locator('button').filter({ hasText: /submit|confirm/i }).last();
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await idle(page);
            await shot(page, 'consequence-acknowledged-success',
              'Consequence acknowledged — the school can see you have been informed and the status updates accordingly');
          }
        } else {
          // Just close the details modal
          const closeBtn = page.locator('button').filter({ hasText: /close|×/i }).last();
          if (await closeBtn.count() > 0) await closeBtn.click();
          await page.waitForTimeout(400);
        }
      }
    } catch (e) {
      console.log('  (no consequence actions available — skipping interaction)');
    }

    await ctx.close();
  }

  // ── 10. MESSAGES ──────────────────────────────────────────────────────────
  console.log('\n📸 Messages...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/messages');
    await shot(page, 'messages-inbox',
      'Messages — Inbox: direct messages from teachers and administrators — the school uses this to send detention notices, welfare updates and general communications');

    // Switch to sent messages
    try {
      const sentTab = page.locator('button, [role="tab"]').filter({ hasText: /sent/i }).first();
      if (await sentTab.count() > 0) {
        await sentTab.click();
        await idle(page);
        await shot(page, 'messages-sent',
          'Sent messages: a record of every message you have sent to teachers and administrators — useful for following up on previous correspondence');
      }
    } catch (e) { /* no tabs */ }

    // Open compose new message
    try {
      const newMsgBtn = page.locator('button').filter({ hasText: /new message|compose|write/i }).first();
      if (await newMsgBtn.count() > 0) {
        await newMsgBtn.click();
        await page.waitForTimeout(800);
        await shot(page, 'messages-compose-modal',
          'Compose a new message: contact any teacher or the school administrator directly through the portal — no need to call or visit in person');

        // Fill the form
        const receiverSelect = page.locator('select[name="receiver_id"], select').first();
        if (await receiverSelect.count() > 0) {
          // Select the first available option (skip the empty one)
          const options = await receiverSelect.locator('option').all();
          for (const opt of options) {
            const val = await opt.getAttribute('value');
            if (val && val !== '') {
              await receiverSelect.selectOption(val);
              break;
            }
          }
        }

        const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
        if (await subjectInput.count() > 0) {
          await subjectInput.fill('Query about Liam\'s detention on 8 June');
        }

        const msgTextarea = page.locator('textarea[name="message"], textarea').first();
        if (await msgTextarea.count() > 0) {
          await msgTextarea.fill(
            'Good day,\n\nI would like to understand what specific behaviour led to the detention on 8 June. ' +
            'I have already spoken with Liam at home and would appreciate more context so we can address this together.\n\nKind regards,\nJane Smith'
          );
        }

        await page.waitForTimeout(600);
        await shot(page, 'messages-compose-filled',
          'Fill in the recipient, subject and your message — use this to query incidents, arrange meetings or share concerns about your child');

        // Send the message
        const sendBtn = page.locator('button[type="submit"], button').filter({ hasText: /send/i }).last();
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
          await idle(page);
          await shot(page, 'messages-sent-confirmation',
            'Message sent — it appears in your Sent folder and the teacher receives a notification to reply through the portal');
        }
      }
    } catch (e) {
      console.log('  (compose form not available — skipping)');
    }

    await ctx.close();
  }

  // ── 11. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log('\n📸 Notifications...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/notifications');
    await shot(page, 'notifications-list',
      'Notifications: all alerts sent to you by the school — incident reports, merit awards, detention notices and announcements in one place');

    // Try marking a notification as read
    try {
      const unreadItem = page.locator('[class*="unread"], .notification-item').first();
      if (await unreadItem.count() > 0) {
        await unreadItem.click();
        await idle(page);
        await shot(page, 'notifications-read',
          'Click a notification to mark it as read — unread items appear highlighted and the count badge on the bell icon updates immediately');
      }
    } catch (e) { /* no unread */ }

    // Scroll down for older notifications
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await shot(page, 'notifications-older',
      'Scroll to see older notifications — the system keeps a full history so you can always refer back to past communications from the school');

    await ctx.close();
  }

  // ── 12. PROFILE ───────────────────────────────────────────────────────────
  console.log('\n📸 Profile...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/profile');
    await shot(page, 'profile-overview',
      'Your parent profile: name, contact number and relationship to child — keep these up to date so the school can reach you quickly');

    // Update phone number
    try {
      const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone" i]').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('+27 82 555 1234');
      }
      const workPhoneInput = page.locator('input[name="work_phone"], input[placeholder*="work" i]').first();
      if (await workPhoneInput.count() > 0) {
        await workPhoneInput.fill('+27 11 234 5678');
      }
      const relationInput = page.locator('input[name="relationship_to_child"], input[placeholder*="relationship" i]').first();
      if (await relationInput.count() > 0) {
        await relationInput.fill('Mother');
      }
      await page.waitForTimeout(600);
      await shot(page, 'profile-editing',
        'Update your contact details at any time — the school uses these for SMS and call notifications when urgent matters arise');

      // Scroll for address and emergency contacts
      await page.evaluate(() => window.scrollBy(0, 350));
      await page.waitForTimeout(600);
      await shot(page, 'profile-emergency-contacts',
        'Scroll to find emergency contact fields — add an alternative contact person the school can reach if you are unavailable');

      // Save
      const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await idle(page);
        await shot(page, 'profile-saved',
          'Profile updated — changes are saved immediately and the school\'s records reflect your latest contact information');
      }
    } catch (e) {
      console.log('  (profile form interaction skipped)');
    }

    await ctx.close();
  }

  // ── 13. SETTINGS ──────────────────────────────────────────────────────────
  console.log('\n📸 Settings...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent/settings');
    await shot(page, 'settings-profile-tab',
      'Settings — Profile tab: manage your personal details, emergency contacts and home address in one comprehensive form');

    // Password tab
    try {
      const passTab = page.locator('button, [role="tab"]').filter({ hasText: /password/i }).first();
      if (await passTab.count() > 0) {
        await passTab.click();
        await page.waitForTimeout(700);
        await shot(page, 'settings-password-tab',
          'Settings — Password tab: change your login password securely — enter your current password to confirm your identity first');
      }
    } catch (e) { /* tab not visible */ }

    // School & Children tab
    try {
      const schoolTab = page.locator('button, [role="tab"]').filter({ hasText: /school|children/i }).first();
      if (await schoolTab.count() > 0) {
        await schoolTab.click();
        await page.waitForTimeout(700);
        await shot(page, 'settings-school-children-tab',
          'Settings — School & Children tab: view your linked school and all children linked to your account — use Link Child to add another child via their unique link code');
      }
    } catch (e) { /* tab not visible */ }

    // Preferences tab
    try {
      const prefTab = page.locator('button, [role="tab"]').filter({ hasText: /prefer|language|notif/i }).first();
      if (await prefTab.count() > 0) {
        await prefTab.click();
        await page.waitForTimeout(700);
        await shot(page, 'settings-preferences-tab',
          'Settings — Preferences tab: choose your display language (English, Afrikaans, Zulu or Xhosa) and set your notification preferences for SMS and email alerts');
      }
    } catch (e) { /* tab not visible */ }

    await ctx.close();
  }

  // ── 14. NOTIFICATION BELL & QUICK SEARCH ─────────────────────────────────
  console.log('\n📸 Notification bell & sidebar navigation...');
  {
    const { page, ctx } = await newPage(browser, token, user);
    await go(page, '/parent');
    // Click the notification bell
    try {
      const bell = page.locator('button[aria-label*="notif" i], button').filter({ hasText: /bell/i }).first();
      const bellByIcon = page.locator('button svg[data-lucide="Bell"], button:has(svg)').first();
      const target = await bell.count() > 0 ? bell : bellByIcon;
      if (await target.count() > 0) {
        await target.click();
        await page.waitForTimeout(900);
        await shot(page, 'notification-bell-dropdown',
          'The notification bell in the top bar shows your unread count — click it to see a quick preview of the latest alerts without leaving the current page');
        // Dismiss
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    } catch (e) { /* bell not found */ }

    // Sidebar showing all nav items
    await shot(page, 'sidebar-navigation',
      'Sidebar navigation gives you fast access to every section of the parent portal — My Children, Behaviour, Merits, Attendance, Detentions, Messages and Settings');

    await ctx.close();
  }

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));
  console.log(`\n✅ Done — ${files.length} screenshots saved to ./screenshots/parent/`);
  files.sort().forEach(f => console.log(`   ${f}`));
})();
