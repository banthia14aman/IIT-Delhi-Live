// End-to-end check against the live Supabase project, driving the real UI in Chromium.
//   python3 -m http.server 8766 -d site &   node tools/e2e_live.cjs [eventId]
// Student registers → pass in wallet → checker looks it up (name/entry no.) → collects ₹ and admits →
// second scan rejected → organiser sees the gate team → admin panel loads → a new account can sign up.
// It writes real rows (one registration, a few scans, one throwaway account); clean up with the SQL it prints.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.BASE || 'http://localhost:8766/';
const EVENT = process.argv[2] || 'e_dj_night';
const PASSWORD = 'iitdlive2026';

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const fresh = async () => {
    const ctx = await browser.newContext({ viewport: { width: 400, height: 860 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    return p;
  };
  const login = async (p, email) => {
    await p.goto(`${BASE}#/login`);
    await p.click(`[data-action="demo-login"][data-email="${email}"]`);
    await p.waitForFunction(() => !location.hash.startsWith('#/login'), null, { timeout: 15000 });
  };
  const step = (s) => console.log('✓', s);

  // 1. Anonymous browse
  let p = await fresh();
  await p.goto(BASE);
  await p.waitForSelector('.card, .spot', { timeout: 15000 });
  step(`feed renders (${await p.locator('.card, .spot').count()} cards)`);

  // 2. Student registers
  await login(p, 'student@iitd.ac.in');
  await p.goto(`${BASE}#/e/${EVENT}`);
  await p.click('[data-action="register"]');
  await p.waitForSelector('.sheet .pass__code, .pass__code', { timeout: 15000 });
  await p.goto(`${BASE}#/wallet?pass=x`);
  const code = (await p.locator(`.pass:has-text("DJ Night") .pass__code`).first().textContent()).trim();
  assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.ok(await p.locator('.pass:has-text("DJ Night")').first().textContent().then((t) => t.includes('at the gate')), 'pass shows ₹ due at the gate');
  step(`student registered, pass ${code} shows payment due`);

  // 3. Checker at the gate
  p = await fresh();
  await login(p, 'checker@iitd.ac.in');
  await p.goto(`${BASE}#/org/scan?event=${EVENT}`);
  await p.waitForFunction((id) => document.querySelector('#gate-event')?.value === id, EVENT, { timeout: 15000 });
  await p.fill('#scan-code', code.toLowerCase().replace('-', ''));
  await p.press('#scan-code', 'Enter');
  await p.waitForSelector('#scan-result .verdict--ok', { timeout: 15000 });
  const card = await p.locator('#scan-result').textContent();
  assert.ok(card.includes('Aarav Mehta') && card.includes('2023CS10421') && card.includes('Aravali'), 'holder name, entry no. and hostel shown');
  assert.ok(card.includes('Collect ₹199'), 'unpaid ticket asks for cash');
  step('lookup shows name, entry no., hostel and ₹199 due');
  await p.click('[data-action="gate-admit"]');
  await p.waitForSelector('#scan-result .verdict__name', { timeout: 15000 });
  await p.waitForFunction(() => /Admitted/.test(document.querySelector('#scan-result')?.textContent || ''), null, { timeout: 15000 });
  step('admitted after collecting cash');
  await p.click('[data-action="scan-next"]');
  await p.fill('#scan-code', code);
  await p.press('#scan-code', 'Enter');
  await p.waitForSelector('#scan-result .verdict--bad', { timeout: 15000 });
  assert.match(await p.locator('#scan-result .verdict__name').textContent(), /Already used/);
  step('second scan rejected: already used');
  await p.click('[data-action="scan-next"]');
  await p.fill('#scan-code', 'ZZZZ-ZZZZ');
  await p.press('#scan-code', 'Enter');
  await p.waitForSelector('#scan-result .verdict--bad', { timeout: 15000 });
  step('unknown code rejected');
  await p.waitForFunction((n) => (document.querySelector('#scan-log')?.textContent || '').includes(n), 'Aarav Mehta', { timeout: 20000 });
  step('gate log lists the scans');

  // 4. Organiser dashboard
  p = await fresh();
  await login(p, 'organiser@iitd.ac.in');
  await p.goto(`${BASE}#/org/e/${EVENT}`);
  await p.waitForFunction(() => document.querySelectorAll('tr[data-row]').length > 0, null, { timeout: 15000 });
  await p.waitForFunction(() => (document.querySelector('#gt-h')?.closest('section')?.textContent || '').includes('Kabir'), null, { timeout: 15000 });
  step('organiser sees attendees and the gate team');

  // 5. Admin
  p = await fresh();
  await login(p, 'admin@iitd.ac.in');
  await p.goto(`${BASE}#/admin`);
  await p.waitForFunction(() => /live tickets/.test(document.querySelector('.strip')?.textContent || ''), null, { timeout: 15000 });
  await p.waitForFunction(() => /Tapped Register/.test(document.body.textContent), null, { timeout: 15000 });
  step('admin overview + funnel load');
  await p.goto(`${BASE}#/admin?tab=people`);
  await p.fill('#adm-q', 'kabir');
  await p.waitForFunction(() => /checker@iitd\.ac\.in/.test(document.querySelector('.adm')?.textContent || ''), null, { timeout: 15000 });
  step('admin people search finds the checker');

  // 6. Sign up a throwaway account
  p = await fresh();
  const email = `e2e+${Date.now()}@example.com`;
  await p.goto(`${BASE}#/login?mode=signup`);
  await p.fill('#su-name', 'E2E Tester');
  await p.fill('#login-email', email);
  await p.fill('#login-password', 'e2e-password-1');
  await p.click('form[data-form="signup"] [type="submit"]');
  await p.waitForFunction(() => !location.hash.startsWith('#/login'), null, { timeout: 20000 });
  step(`signed up ${email}`);

  await browser.close();
  const real = errors.filter((e) => !/favicon|Failed to load resource.*(404|400)/.test(e));
  if (real.length) { console.log('console errors:\n ', real.join('\n  ')); process.exitCode = 1; }
  console.log(`\nCleanup SQL:\n  delete from public.checkin_log where code = '${code}' or code = 'ZZZZ-ZZZZ';\n  delete from public.registrations where qr_token = '${code}';\n  delete from auth.users where email = '${email}';\n  delete from public.profiles where email = '${email}';`);
})().catch((err) => { console.error('✗', err.message); process.exit(1); });
