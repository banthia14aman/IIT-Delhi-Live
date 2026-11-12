// POST {email, password, name} -> creates an already-confirmed account (the default mailer can't email
// arbitrary inboxes, so the usual confirm-your-email sign-up can't work). The browser then logs in normally.
// ponytail: no inbox check and no rate limit; for real use, switch to OTP sign-in with a proper SMTP sender.
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const name = String(body?.name ?? '').trim().slice(0, 80);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
  if (/@demo\.iitd\.ac\.in$/.test(email)) return json({ error: 'That address is reserved for demo data.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'Use 8 to 72 characters for your password.' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return json({ error: taken ? 'An account with this email already exists. Log in instead.' : 'Couldn’t create the account. Try again.' }, taken ? 409 : 400);
  }
  return json({ ok: true });
});
