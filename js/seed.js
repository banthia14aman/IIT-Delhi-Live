// Demo seed data for IITD Live.
// seed(now) is deterministic for a given `now`: most events are placed relative to it,
// so "Tonight" and "This week" always have content whenever the demo is opened.

export const HOSTELS = [
  'Aravali', 'Girnar', 'Himadri', 'Jwalamukhi', 'Kailash', 'Karakoram', 'Kumaon',
  'Nilgiri', 'Satpura', 'Shivalik', 'Udaigiri', 'Vindhyachal', 'Zanskar', 'Day Scholar',
];

export const DEMO_ACCOUNTS = [
  { email: 'student@iitd.ac.in', label: 'IITD student' },
  { email: 'friend@gmail.com', label: 'Outsider (non-IITD friend)' },
  { email: 'organiser@iitd.ac.in', label: 'Organiser (Music Club, RDV Demo Fest)' },
  { email: 'admin@iitd.ac.in', label: 'Admin' },
];

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

// ---------- small deterministic helpers ----------

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTools(rand) {
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const token = () => { const c = Array.from({ length: 8 }, () => pick(CODE_CHARS)).join(''); return `${c.slice(0, 4)}-${c.slice(4)}`; };
  const code = () => Array.from({ length: 6 }, () => pick(CODE_CHARS)).join('');
  return { int, pick, token, code };
}

const pad = (n) => String(n).padStart(2, '0');
export const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ist = (s) => new Date(`${s}+05:30`).toISOString(); // fixed-date fest events, in IST

// ---------- people ----------

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan', 'Kabir',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Meera', 'Isha', 'Kavya', 'Riya', 'Tanvi', 'Nisha',
  'Harsh', 'Pranav', 'Yash', 'Siddharth', 'Varun', 'Nikhil', 'Rahul', 'Aman', 'Karthik', 'Abhinav',
  'Sneha', 'Pooja', 'Shreya', 'Aditi', 'Neha', 'Priya', 'Ritika', 'Simran', 'Tanya', 'Zoya',
  'Mohit', 'Dev', 'Parth', 'Raghav', 'Utkarsh', 'Tushar', 'Gaurav', 'Akash', 'Manav', 'Vedant'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Das',
  'Banerjee', 'Mukherjee', 'Joshi', 'Kulkarni', 'Mehta', 'Chopra', 'Malhotra', 'Bansal', 'Goyal', 'Jain',
  'Rao', 'Menon', 'Pillai', 'Saxena', 'Mishra', 'Tiwari', 'Yadav', 'Chauhan', 'Bhat', 'Khan'];
const DEPTS = ['CS', 'EE', 'ME', 'CH', 'CE', 'MT', 'PH', 'TT', 'BB', 'MS'];
// Rough relative hostel sizes, so breakdowns look like a real campus.
const HOSTEL_WEIGHT = {
  Aravali: 3, Kumaon: 3, Nilgiri: 2.5, Karakoram: 2, Jwalamukhi: 2, Shivalik: 2, Satpura: 2,
  Zanskar: 1.5, Girnar: 1.5, Vindhyachal: 1.5, Udaigiri: 1.2, Himadri: 1.2, Kailash: 1.2, 'Day Scholar': 1,
};

function weightedHostel(rand) {
  const total = Object.values(HOSTEL_WEIGHT).reduce((a, b) => a + b, 0);
  let x = rand() * total;
  for (const [h, w] of Object.entries(HOSTEL_WEIGHT)) { if ((x -= w) < 0) return h; }
  return 'Aravali';
}

function person(id, t, rand, extra = {}) {
  const dept = t.pick(DEPTS);
  const year = t.int(2021, 2025);
  const roll = t.int(10001, 10999);
  const name = `${t.pick(FIRST)} ${t.pick(LAST)}`;
  return {
    id,
    email: `${dept.toLowerCase()}${String(year).slice(2)}${roll}@iitd.ac.in`,
    name,
    entry_no: `${year}${dept}${roll}`,
    hostel: weightedHostel(rand),
    phone: `9${t.int(100000000, 999999999)}`,
    role: 'student',
    is_iitd: true,
    ...extra,
  };
}

// ---------- seed ----------

export function seed(now = new Date()) {
  now = new Date(now);
  const rand = mulberry32(20261015);
  const t = makeTools(rand);
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;

  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + 1).getTime() - 1;
  const at = (dayOffset, h, m = 0) => new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + dayOffset, h, m);
  const plus = (d, minutes) => new Date(d.getTime() + minutes * MIN);

  // A slot later today. If its preferred time has already ended, move it to just after `now`
  // (still today), so "Tonight" is never empty.
  let tonightIdx = 0;
  const tonight = (h, m, durMin) => {
    let start = at(0, h, m);
    if (start.getTime() + durMin * MIN <= now.getTime()) {
      tonightIdx += 1;
      start = new Date(Math.min(now.getTime() + (10 + 15 * tonightIdx) * MIN, endOfToday - 60 * 1000));
    }
    return [start, plus(start, durMin)];
  };
  const liveNow = () => {
    const start = new Date(Math.max(day0.getTime(), now.getTime() - 40 * MIN));
    return [start, new Date(now.getTime() + 80 * MIN)];
  };
  const slot = (dayOffset, h, m, durMin) => { const s = at(dayOffset, h, m); return [s, plus(s, durMin)]; };

  // --- profiles ---
  const profiles = [
    { id: 'u_student', email: 'student@iitd.ac.in', name: 'Aarav Mehta', entry_no: '2023CS10421', hostel: 'Aravali', phone: '9811000001', role: 'student', is_iitd: true },
    { id: 'u_friend', email: 'friend@gmail.com', name: 'Riya Kapoor', entry_no: '', hostel: '', phone: '9811000002', role: 'student', is_iitd: false },
    { id: 'u_organiser', email: 'organiser@iitd.ac.in', name: 'Ishaan Verma', entry_no: '2022EE10567', hostel: 'Kumaon', phone: '9811000003', role: 'organiser', is_iitd: true },
    { id: 'u_admin', email: 'admin@iitd.ac.in', name: 'Campus Admin', entry_no: 'STAFF-001', hostel: 'Day Scholar', phone: '9811000004', role: 'admin', is_iitd: true },
  ];
  const students = [];
  for (let i = 1; i <= 260; i++) {
    const p = person(`u_p${String(i).padStart(3, '0')}`, t, rand);
    students.push(p);
    profiles.push(p);
  }
  const outsiders = [];
  for (let i = 1; i <= 24; i++) {
    const name = `${t.pick(FIRST)} ${t.pick(LAST)}`;
    const p = {
      id: `u_x${String(i).padStart(2, '0')}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}${t.int(10, 99)}@gmail.com`,
      name, entry_no: '', hostel: '', phone: `9${t.int(100000000, 999999999)}`, role: 'student', is_iitd: false,
    };
    outsiders.push(p);
    profiles.push(p);
  }

  // --- clubs (real IITD bodies are verified; one third-party vendor is not) ---
  const clubDefs = [
    ['c_brca', 'BRCA', 'brca'],
    ['c_rdv', 'Rendezvous (RDV) Team', 'rdv', 'u_organiser'],
    ['c_edc', 'eDC IIT Delhi', 'edc'],
    ['c_caic', 'Tryst / CAIC', 'tryst-caic'],
    ['c_music', 'Music Club', 'music-club', 'u_organiser'],
    ['c_dance', 'Dance Club', 'dance-club'],
    ['c_drama', 'Dramatics Club', 'dramatics-club'],
    ['c_lit', 'Literary Club (Literati)', 'literary-club'],
    ['c_dev', 'DevClub', 'devclub'],
    ['c_robo', 'Robotics Club', 'robotics-club'],
    ['c_bnc', 'Business & Consulting Club', 'bnc'],
    ['c_dms_mkt', 'DMS Marketing Club', 'dms-marketing'],
    ['c_dms_fin', 'DMS Finance Club', 'dms-finance'],
    ['c_dms_con', 'DMS Consulting Club', 'dms-consulting'],
    ['c_nss', 'NSS IIT Delhi', 'nss'],
    ['c_bsa', 'BSA (Board for Sports Activities)', 'bsa'],
    ['c_skill', 'Skill Workshop Co.', 'skill-workshop-co'],
  ];
  const clubs = clubDefs.map(([id, name, slug, owner]) => {
    let owner_id = owner;
    if (!owner_id) {
      // Every other club gets its own organiser account (a seeded student promoted to organiser).
      const p = person(`u_own_${id.slice(2)}`, t, rand, { role: 'organiser' });
      if (id === 'c_skill') Object.assign(p, { email: 'contact@skillworkshop.example', entry_no: '', hostel: '', is_iitd: false });
      profiles.push(p);
      owner_id = p.id;
    }
    return { id, name, slug, owner_id, verified: id !== 'c_skill', instagram: '' };
  });

  // --- fests ---
  const fests = [
    { id: 'f_becon', cover: 'iitd-dogra-keynote', name: 'BECon 2027', slug: 'becon-2027', starts_on: '2027-01-29', ends_on: '2027-01-31', tagline: "eDC IIT Delhi's entrepreneurship summit: talks, pitches, startup expo", dates_tbc: true, sample: false },
    { id: 'f_tryst', cover: 'iitd-lhc-courtyard', name: 'Tryst 2027', slug: 'tryst-2027', starts_on: '2027-02-26', ends_on: '2027-03-01', tagline: "IIT Delhi's tech and management fest", dates_tbc: true, sample: false },
    { id: 'f_rdv', cover: 'iitd-rdv-neon-tree', name: 'Rendezvous 2027', slug: 'rendezvous-2027', starts_on: '2027-09-24', ends_on: '2027-09-27', tagline: "IIT Delhi's cultural fest: competitions and four pronites", dates_tbc: true, sample: false },
    { id: 'f_demo', cover: 'iitd-rdv-ribbons', name: 'RDV Demo Fest', slug: 'rdv-demo-fest', starts_on: localDate(at(0, 12)), ends_on: localDate(at(2, 12)), tagline: 'A three-day sample fest to show the schedule view', dates_tbc: false, sample: true },
  ];

  // --- events ---
  const events = [];
  const E = (spec) => {
    const [s, e] = spec.when;
    delete spec.when;
    events.push({
      fest_id: null, description: '', category: 'Social', poster_emoji: '🎉', poster_color: '#4F46E5',
      price: 0, eligibility: 'open', iitd_first_until: null, capacity: null, overbook_pct: 0,
      reg_mode: 'platform', external_url: null, team_min: 1, team_max: 1, featured: false,
      status: 'published', live_note: null, live_note_at: null, sample: true,
      ...spec,
      starts_at: new Date(s).toISOString(),
      ends_at: new Date(e).toISOString(),
    });
  };

  // Tonight
  E({ id: 'e_open_mic', club_id: 'c_music', title: 'Open Mic Night', category: 'Music', venue: 'SAC',
    description: 'Bring a song, a poem or a bit. Sign-ups at the door, 5 minutes each. Acoustic guitar and keyboard provided.',
    when: tonight(19, 0, 150), poster_emoji: '🎤', poster_color: '#D9480F', eligibility: 'iitd_only', featured: true });
  E({ id: 'e_battle_bands', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Battle of Bands', category: 'Music', venue: 'OAT',
    description: 'Six college bands, one stage. Rock, indie and fusion sets judged live. Gates open 30 minutes early.',
    when: tonight(20, 0, 180), poster_emoji: '🎸', poster_color: '#C2255C', featured: true });
  E({ id: 'e_street_play', club_id: 'c_brca', title: 'BRCA Inter-hostel Street Play Finals', category: 'Drama', venue: 'Main Building lawns',
    description: 'Hostel nukkad teams compete for points in the BRCA cultural cup. Sit on the lawns, cheer for your hostel.',
    when: liveNow(), poster_emoji: '🎭', poster_color: '#2B8A3E', eligibility: 'iitd_only' });
  E({ id: 'e_quiz', club_id: 'c_lit', title: 'Literati General Quiz', category: 'Literary', venue: 'LHC',
    description: 'Teams of up to 3, register on the spot. Prelims at 9, finals right after. Prizes for the top three teams.',
    when: tonight(21, 0, 120), poster_emoji: '🧠', poster_color: '#5F3DC4', eligibility: 'iitd_only',
    live_note: 'Moved to LHC 108, same time.', live_note_at: new Date(now.getTime() - 20 * MIN).toISOString() });
  E({ id: 'e_movie', club_id: 'c_brca', title: 'Movie Night: Interstellar', category: 'Film', venue: 'Dogra Hall',
    description: 'Big screen, good sound, free popcorn while it lasts.',
    when: tonight(21, 30, 170), poster_emoji: '🎬', poster_color: '#1C7ED6', eligibility: 'iitd_only' });
  E({ id: 'e_standup', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Stand-up Comedy Night', category: 'Comedy', venue: 'Seminar Hall',
    description: 'Three campus comics and one surprise headliner. Seating is limited.',
    when: tonight(18, 30, 90), poster_emoji: '😂', poster_color: '#F08C00', price: 99, capacity: 120 });

  // This week
  E({ id: 'e_dj_night', club_id: 'c_rdv', fest_id: 'f_demo', title: 'DJ Night at OAT', category: 'Music', venue: 'OAT',
    description: 'The closing night of the demo fest. IITD students get first access to passes; open to guests after that.',
    when: slot(1, 21, 0, 210), poster_emoji: '🎧', poster_color: '#7048E8', price: 199, capacity: 800, overbook_pct: 10,
    iitd_first_until: new Date(now.getTime() + 3 * HOUR).toISOString(), featured: true });
  E({ id: 'e_fashion', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Fashion Show: Threads', category: 'Fest', venue: 'OAT',
    description: 'Eight hostel and college teams walk themed collections.', when: slot(1, 18, 0, 120), poster_emoji: '👗', poster_color: '#E64980' });
  E({ id: 'e_treasure', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Campus Treasure Hunt', category: 'Fest', venue: 'Main Building lawns',
    description: 'Clues all over campus. Teams of 2 to 4.', when: slot(1, 15, 0, 150), poster_emoji: '🗺️', poster_color: '#5C940D',
    price: 50, eligibility: 'iitd_only', team_min: 2, team_max: 4 });
  E({ id: 'e_classical', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Classical Night', category: 'Music', venue: 'Dogra Hall',
    description: 'Hindustani vocal and sitar recital.', when: slot(2, 19, 0, 120), poster_emoji: '🪕', poster_color: '#A61E4D' });
  E({ id: 'e_dance_faceoff', club_id: 'c_rdv', fest_id: 'f_demo', title: 'Dance Face-off', category: 'Dance', venue: 'SAC',
    description: 'Crew vs crew, judged by the Dance Club alumni.', when: slot(2, 17, 0, 120), poster_emoji: '💃', poster_color: '#D6336C' });
  E({ id: 'e_arduino', club_id: 'c_robo', title: 'Arduino 101 Workshop', category: 'Workshop', venue: 'LHC',
    description: 'Hands-on: blink, sensors, a tiny line follower. Kit provided for the session. Bring a laptop.',
    when: slot(1, 17, 0, 120), poster_emoji: '🤖', poster_color: '#0B7285', price: 49, capacity: 40, eligibility: 'iitd_only' });
  E({ id: 'e_hiphop', club_id: 'c_dance', title: 'Hip-hop Basics Workshop', category: 'Dance', venue: 'SAC',
    description: 'Grooves, footwork and a short routine. No experience needed.', when: slot(1, 18, 30, 90),
    poster_emoji: '🕺', poster_color: '#E8590C', price: 79, capacity: 60, eligibility: 'iitd_only' });
  E({ id: 'e_hackathon', club_id: 'c_dev', title: 'DevClub 24h Hackathon', category: 'Tech', venue: 'Bharti School',
    description: 'Build anything in 24 hours. Teams of 2 to 4. Food and Wi-Fi on us.', when: slot(2, 10, 0, 24 * 60),
    poster_emoji: '💻', poster_color: '#1864AB', capacity: 120, eligibility: 'iitd_only', team_min: 2, team_max: 4, featured: true });
  E({ id: 'e_case_comp', club_id: 'c_dms_con', title: 'Consult Quest: Case Competition', category: 'Business', venue: 'Seminar Hall',
    description: 'Teams of 3 to 4 crack a live consulting case. Open to IITD and other B-schools.', when: slot(3, 14, 0, 240),
    poster_emoji: '📊', poster_color: '#364FC7', team_min: 3, team_max: 4 });
  E({ id: 'e_edc_talk', club_id: 'c_edc', title: 'Startup Talk: From Hostel Room to Seed Round', category: 'Talk', venue: 'Seminar Hall',
    description: 'IITD alumni founders on finding co-founders, first customers and first cheques.', when: slot(2, 18, 0, 90),
    poster_emoji: '🚀', poster_color: '#F76707' });
  E({ id: 'e_fin_lecture', club_id: 'c_dms_fin', title: 'Guest Lecture: Markets in 2027', category: 'Talk', venue: 'Dogra Hall',
    description: 'A fund manager on rates, the rupee and what to read.', when: slot(4, 17, 30, 90), poster_emoji: '📈', poster_color: '#2F9E44' });
  E({ id: 'e_trials', club_id: 'c_bsa', title: 'Football Team Trials', category: 'Sports', venue: 'Hostel lawns',
    description: 'Inter-IIT squad trials. Bring boots and water.', when: slot(3, 7, 0, 120), poster_emoji: '⚽', poster_color: '#2B8A3E', eligibility: 'iitd_only' });
  E({ id: 'e_blood', club_id: 'c_nss', title: 'Blood Donation Camp', category: 'Social', venue: 'Exhibition Hall',
    description: 'With AIIMS blood bank. Eat breakfast before you come.', when: slot(2, 10, 0, 360), poster_emoji: '🩸', poster_color: '#C92A2A', capacity: 150 });
  E({ id: 'e_andha_yug', club_id: 'c_drama', title: 'Andha Yug: Dramatics Club Production', category: 'Drama', venue: 'Dogra Hall',
    description: "Dharamvir Bharati's play, staged by the Dramatics Club.", when: slot(4, 19, 30, 120), poster_emoji: '🎭', poster_color: '#495057' });
  E({ id: 'e_hacking', club_id: 'c_skill', title: 'Ethical Hacking Workshop', category: 'Workshop', venue: 'LHC',
    description: 'Two-day paid workshop by an external vendor. Certificate on completion.', when: slot(5, 10, 0, 420),
    poster_emoji: '🛡️', poster_color: '#212529', price: 1499, capacity: 50 });
  E({ id: 'e_brand_wars', club_id: 'c_dms_mkt', title: 'Brand Wars', category: 'Business', venue: 'Seminar Hall',
    description: 'Pitch a brand turnaround in 10 minutes. Teams of 2 to 3.', when: slot(5, 15, 0, 180),
    poster_emoji: '🏷️', poster_color: '#862E9C', price: 100, team_min: 2, team_max: 3 });
  E({ id: 'e_writing', club_id: 'c_lit', title: 'Creative Writing Workshop', category: 'Literary', venue: 'LHC',
    description: 'Short fiction prompts and feedback circles.', when: slot(6, 16, 0, 120), poster_emoji: '✍️', poster_color: '#5F3DC4',
    capacity: 30, eligibility: 'iitd_only' });
  E({ id: 'e_caic_showcase', club_id: 'c_caic', title: 'CAIC Clubs Tech Showcase', category: 'Tech', venue: 'Exhibition Hall',
    description: 'Robots, drones, rockets and apps from every CAIC club. Find a club to join.', when: slot(6, 11, 0, 300),
    poster_emoji: '🛰️', poster_color: '#0C8599', eligibility: 'iitd_only' });

  // Later
  E({ id: 'e_nss_teach', club_id: 'c_nss', title: 'Saturday Teaching Drive', category: 'Social', venue: 'Main Building lawns',
    description: 'Teach kids from nearby schools for two hours.', when: slot(8, 9, 0, 120), poster_emoji: '📚', poster_color: '#E67700', eligibility: 'iitd_only' });
  E({ id: 'e_bnc_talk', club_id: 'c_bnc', title: 'Cracking Consulting Interviews', category: 'Talk', venue: 'Bharti School',
    description: 'Guesstimates, case frameworks and mock interviews with seniors.', when: slot(9, 18, 0, 90), poster_emoji: '💼', poster_color: '#1971C2' });
  E({ id: 'e_open_source', club_id: 'c_dev', title: 'Intro to Open Source', category: 'Tech', venue: 'LHC',
    description: 'Make your first pull request in 90 minutes.', when: slot(10, 17, 0, 90), poster_emoji: '🐙', poster_color: '#343A40',
    capacity: 80, eligibility: 'iitd_only' });
  E({ id: 'e_becon_pass', club_id: 'c_edc', fest_id: 'f_becon', title: 'BECon 2027 Summit Pass', category: 'Fest', venue: 'Exhibition Hall',
    description: 'Access to all keynote sessions and the startup expo. Dates to be confirmed by eDC.', when: [ist('2027-01-29T10:00:00'), ist('2027-01-31T18:00:00')],
    poster_emoji: '🏛️', poster_color: '#F59F00', price: 99, sample: false, featured: true });
  E({ id: 'e_becon_pitch', club_id: 'c_edc', fest_id: 'f_becon', title: 'BECon Pitch Competition', category: 'Business', venue: 'Dogra Hall',
    description: 'Pitch to investors. Registration runs on Unstop.', when: [ist('2027-01-30T11:00:00'), ist('2027-01-30T17:00:00')],
    poster_emoji: '🎯', poster_color: '#E8590C', reg_mode: 'external', external_url: 'https://unstop.com/', sample: false, team_min: 1, team_max: 4 });
  E({ id: 'e_tryst_hack', club_id: 'c_caic', fest_id: 'f_tryst', title: 'Tryst Hackathon', category: 'Tech', venue: 'Bharti School',
    description: '36-hour national hackathon. Registration runs on Unstop.', when: [ist('2027-02-26T18:00:00'), ist('2027-02-28T06:00:00')],
    poster_emoji: '⚡', poster_color: '#1098AD', reg_mode: 'external', external_url: 'https://unstop.com/', sample: false, team_min: 2, team_max: 4 });
  E({ id: 'e_robowars', club_id: 'c_robo', fest_id: 'f_tryst', title: 'Robowars at Tryst', category: 'Tech', venue: 'OAT',
    description: 'Combat robots, 15 kg class. Teams of 3 to 5. Fee per person.', when: [ist('2027-02-27T10:00:00'), ist('2027-02-27T19:00:00')],
    poster_emoji: '🦾', poster_color: '#495057', price: 300, team_min: 3, team_max: 5, sample: false });
  E({ id: 'e_rdv_pronite', club_id: 'c_rdv', fest_id: 'f_rdv', title: 'Rendezvous 2027 Pronite', category: 'Fest', venue: 'OAT',
    description: 'Headline concert of RDV 2027. Artist and dates to be announced.', when: [ist('2027-09-25T19:30:00'), ist('2027-09-25T23:00:00')],
    poster_emoji: '🎆', poster_color: '#9C36B5', price: 499, sample: false });

  // Past + draft
  E({ id: 'e_speranza', club_id: 'c_brca', title: "Speranza Freshers' Night", category: 'Fest', venue: 'OAT',
    description: 'Welcome night for the new batch.', when: slot(-3, 19, 0, 180), poster_emoji: '🌟', poster_color: '#F08C00', eligibility: 'iitd_only' });
  E({ id: 'e_acoustic_draft', club_id: 'c_music', title: 'Acoustic Evening (draft)', category: 'Music', venue: 'Hostel lawns',
    description: 'Unplugged sets under the trees.', when: slot(12, 19, 0, 120), poster_emoji: '🪕', poster_color: '#D9480F', status: 'draft' });

  // --- teams + registrations ---
  const teams = [];
  const registrations = [];
  const usedCodes = new Set();
  const newCode = () => { let c; do { c = t.code(); } while (usedCodes.has(c)); usedCodes.add(c); return c; };
  let clock = now.getTime() - 96 * HOUR; // created_at advances so confirmed rows are older than waitlisted ones
  const reg = (event_id, user_id, status, team_id = null) => {
    clock += t.int(1, 30) * MIN;
    const created_at = new Date(Math.min(clock, now.getTime() - MIN)).toISOString();
    const r = { id: `r_${registrations.length + 1}`, event_id, user_id, team_id, status, qr_token: t.token(), created_at, checked_in_at: null };
    registrations.push(r);
    return r;
  };

  // Weighted sample without replacement (Efraimidis-Spirakis), so each event can lean to some hostels.
  const sample = (pool, n, bias = {}) => pool
    .map((p) => ({ p, k: Math.pow(rand(), 1 / (bias[p.hostel] || 1)) }))
    .sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.p);

  const TEAM_NAMES = ['Null Pointers', 'Segfault Squad', 'Byte Me', 'Ctrl Alt Elite', 'The Debuggers', 'Stack Smashers',
    'Hostel 404', 'Mess Food Survivors', 'Night Owls', 'Late Submitters', 'Green Chillies', 'Chai & Code',
    'The Outliers', 'Case Closed', 'Brainstormers', 'Zero Day', 'Momentum', 'Paper Planes', 'Kernel Panic', 'Third Floor'];

  const fill = (event_id, going, opts = {}) => {
    const ev = events.find((e) => e.id === event_id);
    const pool = students.filter((p) => !opts.skip || !opts.skip.includes(p.id));
    const people = sample(pool, going + (opts.waitlisted || 0), opts.bias);
    const nOut = ev.eligibility === 'open' ? (opts.outsiders || 0) : 0;
    people.splice(Math.floor(going / 2), 0, ...outsiders.slice(0, nOut));
    const confirmed = people.slice(0, going + nOut);
    const waiting = people.slice(going + nOut);
    if (ev.team_max > 1) {
      let i = 0; let n = 0;
      while (i < confirmed.length) {
        const size = Math.min(t.int(ev.team_min, ev.team_max), confirmed.length - i);
        if (size < ev.team_min) break;
        const members = confirmed.slice(i, i + size);
        const team = { id: `t_${event_id.slice(2)}_${++n}`, event_id, name: TEAM_NAMES[(n - 1) % TEAM_NAMES.length] + (n > TEAM_NAMES.length ? ` ${n}` : ''), captain_id: members[0].id, invite_code: newCode() };
        teams.push(team);
        members.forEach((m) => reg(event_id, m.id, 'confirmed', team.id));
        i += size;
      }
    } else {
      confirmed.forEach((p) => reg(event_id, p.id, 'confirmed'));
    }
    waiting.forEach((p) => reg(event_id, p.id, 'waitlisted'));
    if (opts.checkedIn) {
      registrations.filter((r) => r.event_id === event_id && r.status === 'confirmed').forEach((r) => {
        if (rand() < opts.checkedIn) {
          r.status = 'checked_in';
          r.checked_in_at = new Date(Math.min(new Date(ev.starts_at).getTime() + t.int(0, 40) * MIN, now.getTime())).toISOString();
        }
      });
    }
  };

  // Past event first (oldest registrations), then the rest.
  fill('e_speranza', 200, { checkedIn: 0.85 });
  // Demo student's own passes.
  const mine = reg('e_speranza', 'u_student', 'checked_in');
  mine.checked_in_at = new Date(new Date(events.find((e) => e.id === 'e_speranza').starts_at).getTime() + 12 * MIN).toISOString();
  reg('e_open_mic', 'u_student', 'confirmed');
  teams.push({ id: 't_my_hack', event_id: 'e_hackathon', name: 'Aravali Night Coders', captain_id: 'u_student', invite_code: 'HACK42' });
  usedCodes.add('HACK42');
  reg('e_hackathon', 'u_student', 'confirmed', 't_my_hack');
  reg('e_hackathon', students[0].id, 'confirmed', 't_my_hack');
  const skipMine = ['u_student', students[0].id];

  fill('e_open_mic', 64, { bias: { Aravali: 2, Nilgiri: 2 } });
  fill('e_battle_bands', 210, { bias: { Aravali: 2, Kumaon: 2 }, outsiders: 14 });
  fill('e_street_play', 150, { bias: { Aravali: 5, Kumaon: 4 }, checkedIn: 0.6 });
  fill('e_quiz', 45);
  fill('e_movie', 80);
  fill('e_standup', 117); // 3 seats left
  fill('e_dj_night', 186, { bias: { Aravali: 2, Karakoram: 1.5 } });
  fill('e_fashion', 130, { outsiders: 10 });
  fill('e_treasure', 40);
  fill('e_classical', 70, { outsiders: 4 });
  fill('e_dance_faceoff', 110, { bias: { Himadri: 2, Kailash: 2 } });
  fill('e_arduino', 37); // 3 seats left
  fill('e_hiphop', 60, { waitlisted: 6 }); // full, with a waitlist
  fill('e_hackathon', 46, { skip: skipMine });
  fill('e_case_comp', 36, { outsiders: 8 });
  fill('e_edc_talk', 95, { outsiders: 6 });
  fill('e_fin_lecture', 40);
  fill('e_trials', 30, { bias: { Kumaon: 2 } });
  fill('e_blood', 72);
  fill('e_andha_yug', 90, { outsiders: 5 });
  fill('e_hacking', 4, { outsiders: 2 });
  fill('e_brand_wars', 24);
  fill('e_writing', 22);
  fill('e_caic_showcase', 50);
  fill('e_nss_teach', 18);
  fill('e_bnc_talk', 30);
  fill('e_open_source', 20);
  fill('e_becon_pass', 15, { outsiders: 3 });
  fill('e_robowars', 0);
  fill('e_rdv_pronite', 12);

  // Cover photos (openly licensed, see assets/img/credits.json), keyed into site/assets/img/<key>.webp.
  const COVERS = {
    // Real IIT Delhi photos (Wikimedia Commons, CC BY-SA / CC0) matched to the event or its venue;
    // the four stock covers stay where no honest IITD photo existed.
    e_open_mic: 'iitd-open-mic-canopy', e_battle_bands: 'iitd-fest-band-red', e_street_play: 'iitd-lhc-atrium-play',
    e_quiz: 'iitd-lhc-lobby', e_movie: 'iitd-dogra-roof', e_standup: 'iitd-night-light-beams', e_dj_night: 'iitd-pronite-stage',
    e_fashion: 'fashion', e_treasure: 'iitd-main-building-lawn', e_classical: 'iitd-fest-night-lanterns',
    e_dance_faceoff: 'iitd-trophies', e_arduino: 'iitd-lhc-lab', e_hiphop: 'iitd-sac-front', e_hackathon: 'iitd-bharti-night',
    e_case_comp: 'iitd-library-balconies', e_edc_talk: 'iitd-research-park', e_fin_lecture: 'iitd-dogra-roof-edge',
    e_trials: 'iitd-sports-ground-sunrise', e_blood: 'blood', e_andha_yug: 'iitd-dogra-stage-view',
    e_hacking: 'iitd-lhc-pyramid-dark', e_brand_wars: 'iitd-main-building-night', e_writing: 'iitd-library-reading-room',
    e_caic_showcase: 'techexpo', e_nss_teach: 'iitd-main-lawn-students', e_bnc_talk: 'iitd-bharti-view',
    e_open_source: 'iitd-lhc-front', e_becon_pass: 'iitd-dogra-keynote', e_becon_pitch: 'iitd-dogra-main-building',
    e_tryst_hack: 'iitd-lhc-glass-facade', e_robowars: 'robowars', e_rdv_pronite: 'iitd-pronite-stage',
    e_speranza: 'iitd-fest-night-crowd', e_acoustic_draft: 'iitd-open-mic-canopy',
  };
  for (const e of events) e.cover = COVERS[e.id] || null;

  return { profiles, clubs, fests, events, teams, registrations };
}
