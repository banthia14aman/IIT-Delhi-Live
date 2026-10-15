// Run with: node --test site/tests/*.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { store, HOSTELS, DEMO_ACCOUNTS } from '../js/store.js';
import { seed } from '../js/seed.js';

const HOUR = 3600 * 1000;
const inHours = (h) => new Date(Date.now() + h * HOUR).toISOString();

// Organiser (owns Music Club) creates a published event with the given overrides.
function makeEvent(overrides = {}) {
  store.login('organiser@iitd.ac.in');
  const ev = store.saveEvent({
    club_id: 'c_music', title: 'Test Event', venue: 'SAC', category: 'Music',
    starts_at: inHours(24), ends_at: inHours(26), status: 'published', ...overrides,
  });
  store.logout();
  return ev;
}

function as(email, fn) {
  store.login(email);
  try { return fn(); } finally { store.logout(); }
}

beforeEach(() => store.reset());

test('exports hostels and demo accounts', () => {
  assert.equal(HOSTELS.length, 14);
  assert.ok(HOSTELS.includes('Day Scholar'));
  assert.deepEqual(DEMO_ACCOUNTS.map((a) => a.email),
    ['student@iitd.ac.in', 'friend@gmail.com', 'organiser@iitd.ac.in', 'admin@iitd.ac.in']);
});

test('login sets is_iitd from the email domain, incl. subdomains', () => {
  assert.equal(store.login('Someone@IITD.AC.IN').is_iitd, true);
  assert.equal(store.login('mba@dms.iitd.ac.in').is_iitd, true);
  assert.equal(store.login('x@gmail.com').is_iitd, false);
  assert.equal(store.needsOnboarding(), true);
  store.updateProfile({ name: 'X' });
  assert.equal(store.needsOnboarding(), false); // outsiders only need a name
  store.login('student@iitd.ac.in');
  assert.equal(store.needsOnboarding(), false);
});

test('register requires login', () => {
  store.logout();
  assert.throws(() => store.register('e_battle_bands'), /log in/i);
});

test('outsider is blocked from iitd_only events', () => {
  as('friend@gmail.com', () => {
    assert.throws(() => store.register('e_open_mic'), /only for IIT Delhi/);
  });
  const ev = makeEvent({ eligibility: 'iitd_only' });
  as('friend@gmail.com', () => assert.throws(() => store.register(ev.id), /only for IIT Delhi/));
  as('student@iitd.ac.in', () => assert.equal(store.register(ev.id).status, 'confirmed'));
});

test('iitd_first window blocks outsiders until it passes', () => {
  const early = makeEvent({ eligibility: 'open', iitd_first_until: inHours(3) });
  as('friend@gmail.com', () => assert.throws(() => store.register(early.id), /IITD students get first access until/));
  as('student@iitd.ac.in', () => assert.equal(store.register(early.id).status, 'confirmed'));

  const opened = makeEvent({ eligibility: 'open', iitd_first_until: inHours(-1) });
  as('friend@gmail.com', () => assert.equal(store.register(opened.id).status, 'confirmed'));

  // Seeded DJ night has an IITD-first window a few hours away.
  as('friend@gmail.com', () => assert.throws(() => store.register('e_dj_night'), /first access/));
});

test('external and closed events reject registration', () => {
  as('student@iitd.ac.in', () => {
    assert.throws(() => store.register('e_becon_pitch'), /organiser's site/);
    assert.throws(() => store.register('e_street_play'), /closed/); // already started
  });
});

test('capacity + overbook: extra registrants are waitlisted', () => {
  const ev = makeEvent({ capacity: 2, overbook_pct: 50 }); // limit = floor(2 * 1.5) = 3
  const statuses = ['a', 'b', 'c', 'd', 'e'].map((u) => as(`${u}@iitd.ac.in`, () => store.register(ev.id).status));
  assert.deepEqual(statuses, ['confirmed', 'confirmed', 'confirmed', 'waitlisted', 'waitlisted']);
  const read = store.event(ev.id);
  assert.equal(read.going, 3);
  assert.equal(read.waitlisted, 2);
  assert.equal(read.seats_left, 0);
});

test('cancel promotes the oldest waitlisted registration', () => {
  const ev = makeEvent({ capacity: 2, overbook_pct: 0 });
  const r1 = as('p1@iitd.ac.in', () => store.register(ev.id));
  as('p2@iitd.ac.in', () => store.register(ev.id));
  const r3 = as('p3@iitd.ac.in', () => store.register(ev.id));
  const r4 = as('p4@iitd.ac.in', () => store.register(ev.id));
  assert.equal(r3.status, 'waitlisted');
  assert.equal(r4.status, 'waitlisted');

  as('p1@iitd.ac.in', () => assert.equal(store.cancel(r1.id).status, 'cancelled'));
  as('p3@iitd.ac.in', () => assert.equal(store.event(ev.id).my_registration.status, 'confirmed'));
  as('p4@iitd.ac.in', () => assert.equal(store.event(ev.id).my_registration.status, 'waitlisted'));
  assert.equal(store.event(ev.id).going, 2);
});

test('duplicate registration is rejected', () => {
  as('student@iitd.ac.in', () => {
    assert.throws(() => store.register('e_open_mic'), /already registered/); // seeded pass
    const ev = makeEvent();
    store.login('student@iitd.ac.in');
    store.register(ev.id);
    assert.throws(() => store.register(ev.id), /already registered/);
  });
});

test('team events: create, join by code, team_max enforced, solo disallowed', () => {
  const ev = makeEvent({ team_min: 2, team_max: 3 });
  as('solo@iitd.ac.in', () => assert.throws(() => store.register(ev.id), /team event/));

  const cap = as('cap@iitd.ac.in', () => store.register(ev.id, { teamName: 'Rockets' }));
  const team = store.team(as('cap@iitd.ac.in', () => store.wallet().find((w) => w.event.id === ev.id).team.invite_code));
  assert.match(team.team.invite_code, /^[A-HJ-KM-NP-Z2-9]{6}$/);
  assert.equal(team.team.captain_id, as('cap@iitd.ac.in', () => store.me().id));
  assert.equal(cap.team_id, team.team.id);

  const code = team.team.invite_code;
  as('m2@iitd.ac.in', () => assert.equal(store.register(ev.id, { teamCode: code.toLowerCase() }).team_id, team.team.id));
  as('m3@iitd.ac.in', () => store.register(ev.id, { teamCode: code }));
  as('m4@iitd.ac.in', () => assert.throws(() => store.register(ev.id, { teamCode: code }), /full/));
  assert.equal(store.team(code).members.length, 3);
  assert.equal(store.team(code).members[0].email, 'cap@iitd.ac.in');

  as('m5@iitd.ac.in', () => assert.throws(() => store.register(ev.id, { teamCode: 'ZZZZZZ' }), /not valid/));
  // A code from another event's team does not work here.
  as('m5@iitd.ac.in', () => assert.throws(() => store.register(ev.id, { teamCode: 'HACK42' }), /not valid/));
});

test('checkIn: ok, already checked in, invalid pass, not your event', () => {
  const ev = makeEvent();
  const reg = as('guest@iitd.ac.in', () => store.register(ev.id));

  store.login('organiser@iitd.ac.in');
  const first = store.checkIn(reg.qr_token);
  assert.equal(first.ok, true);
  assert.equal(first.profile.email, 'guest@iitd.ac.in');
  assert.equal(first.event.id, ev.id);
  assert.deepEqual(
    (({ ok, reason }) => ({ ok, reason }))(store.checkIn(reg.qr_token)),
    { ok: false, reason: 'already checked in' });
  assert.deepEqual(store.checkIn('not-a-real-token'), { ok: false, reason: 'invalid pass' });

  // Organiser does not own BRCA, so a BRCA pass is not theirs to scan.
  const brcaPass = as('student@iitd.ac.in', () => store.register('e_movie'));
  store.login('organiser@iitd.ac.in');
  assert.deepEqual(store.checkIn(brcaPass.qr_token), { ok: false, reason: 'not your event' });

  // Admin can check in anywhere.
  store.login('admin@iitd.ac.in');
  assert.equal(store.checkIn(brcaPass.qr_token).ok, true);
  assert.equal(store.stats('e_movie').checked_in >= 1, true);
});

test('checkIn rejects waitlisted and cancelled passes', () => {
  const ev = makeEvent({ capacity: 1 });
  const a = as('a1@iitd.ac.in', () => store.register(ev.id));
  const b = as('b1@iitd.ac.in', () => store.register(ev.id));
  store.login('organiser@iitd.ac.in');
  assert.equal(store.checkIn(b.qr_token).ok, false); // waitlisted
  as('a1@iitd.ac.in', () => store.cancel(a.id)); // promotes b
  store.login('organiser@iitd.ac.in');
  assert.equal(store.checkIn(a.qr_token).reason, 'registration cancelled');
  assert.equal(store.checkIn(b.qr_token).ok, true);
});

test('organiser views are guarded', () => {
  store.login('organiser@iitd.ac.in');
  assert.ok(store.attendees('e_open_mic').length > 0);
  assert.throws(() => store.attendees('e_movie'), /Not your event/);
  assert.throws(() => store.saveEvent({ club_id: 'c_brca', title: 'x', starts_at: inHours(5) }), /clubs you run/);
  assert.equal(store.event('e_acoustic_draft').status, 'draft'); // own draft visible
  store.logout();
  assert.equal(store.event('e_acoustic_draft'), null); // hidden from public
  assert.ok(!store.events({ tab: 'all' }).some((e) => e.status !== 'published'));
});

test('ics is a valid VCALENDAR with CRLF line endings', () => {
  const ics = store.ics('e_battle_bands');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('\r\nBEGIN:VEVENT\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.match(ics, /\r\nDTSTART:\d{8}T\d{6}Z\r\n/);
  assert.match(ics, /\r\nSUMMARY:Battle of Bands\r\n/);
  assert.ok(!/[^\r]\n/.test(ics), 'every newline is CRLF');
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test('toCSV quotes commas, quotes and newlines', () => {
  const ev = makeEvent();
  as('quoted@iitd.ac.in', () => {
    store.updateProfile({ name: 'Rao, "Ace"\nJr', hostel: 'Aravali', entry_no: '2024cs10001' });
    store.register(ev.id);
  });
  store.login('organiser@iitd.ac.in');
  const csv = store.toCSV(ev.id);
  const [header] = csv.split('\r\n');
  assert.equal(header, 'name,email,entry_no,hostel,phone,iitd,status,team,registered_at,checked_in_at');
  assert.ok(csv.includes('"Rao, ""Ace""\nJr",quoted@iitd.ac.in,2024CS10001,Aravali,,yes,confirmed,'));
});

test('tonight tab from seed has 4-6 events, all starting today and not ended', () => {
  const tonight = store.events({ tab: 'tonight' });
  assert.ok(tonight.length >= 4 && tonight.length <= 6, `got ${tonight.length}`);
  const today = new Date().toDateString();
  for (const e of tonight) {
    assert.equal(new Date(e.starts_at).toDateString(), today);
    assert.ok(new Date(e.ends_at) > new Date());
  }
});

test('seed is relative to now: tonight works late at night and early morning', () => {
  for (const hour of [0, 1, 9, 18, 22, 23]) {
    const now = new Date(); now.setHours(hour, 50, 0, 0);
    const s = seed(now);
    const tonight = s.events.filter((e) => e.status === 'published'
      && new Date(e.starts_at).toDateString() === now.toDateString() && new Date(e.ends_at) > now);
    assert.ok(tonight.length >= 4 && tonight.length <= 6, `hour ${hour}: ${tonight.length}`);
  }
});

test('computed fields and filters', () => {
  const e = store.event('e_arduino');
  assert.equal(e.club.name, 'Robotics Club');
  assert.equal(e.seats_left, 3);
  assert.ok(e.closes_in_ms > 0);
  assert.equal(Object.values(e.by_hostel).reduce((a, b) => a + b, 0), e.going);
  assert.equal(store.event('e_hiphop').waitlisted, 6);
  assert.equal(store.event('e_quiz').live_note, 'Moved to LHC 108, same time.');
  assert.ok(store.events({ tab: 'all', price: 'paid' }).every((x) => x.price > 0));
  assert.ok(store.events({ tab: 'all', eligibility: 'iitd_only' }).every((x) => x.eligibility === 'iitd_only'));
  assert.ok(store.events({ tab: 'all', q: 'hackathon' }).length >= 2);
  assert.ok(store.categories().includes('Music'));
  assert.equal(store.fest('rdv-demo-fest').events.length, 7);
  assert.equal(store.club('skill-workshop-co').club.verified, false);
  const week = store.events({ tab: 'week' });
  assert.ok(week.length > 10);
});

test('wallet lists upcoming passes first and excludes cancelled', () => {
  store.login('student@iitd.ac.in');
  const w = store.wallet();
  assert.ok(w.length >= 3);
  assert.equal(w[w.length - 1].event.id, 'e_speranza'); // past event last
  const hack = w.find((x) => x.event.id === 'e_hackathon');
  assert.equal(hack.team.invite_code, 'HACK42');
  store.cancel(w.find((x) => x.event.id === 'e_open_mic').registration.id);
  assert.ok(!store.wallet().some((x) => x.event.id === 'e_open_mic'));
});

test('subscribe fires on writes and can unsubscribe', () => {
  let calls = 0;
  const off = store.subscribe(() => { calls += 1; });
  store.login('student@iitd.ac.in');
  store.logout();
  off();
  store.login('student@iitd.ac.in');
  assert.equal(calls, 2);
});

test('admin-only toggles and createClub', () => {
  store.login('student@iitd.ac.in');
  assert.throws(() => store.setVerified('c_skill', true), /Admins only/);
  const club = store.createClub('Astronomy Club');
  assert.equal(club.verified, false);
  assert.equal(store.me().role, 'organiser');
  assert.equal(store.myClubs().length, 1);
  store.login('admin@iitd.ac.in');
  assert.equal(store.setVerified(club.id, true).verified, true);
  assert.equal(store.setFeatured('e_quiz', true).featured, true);
});

test('postUpdate sets a live note', () => {
  store.login('organiser@iitd.ac.in');
  const ev = store.postUpdate('e_open_mic', 'Starting 15 min late');
  assert.equal(ev.live_note, 'Starting 15 min late');
  assert.ok(ev.live_note_at);
});

test('pass codes are short and typeable at the gate', () => {
  const ev = makeEvent();
  const reg = as('guest@iitd.ac.in', () => store.register(ev.id));
  assert.match(reg.qr_token, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  store.login('organiser@iitd.ac.in');
  // Lowercase, no dash, stray spaces: still accepted.
  assert.equal(store.checkIn(` ${reg.qr_token.replace('-', '').toLowerCase()} `).ok, true);
});
