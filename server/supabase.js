// Server-side Supabase access for the serverless functions. Uses the service-role key,
// which bypasses row level security, so every caller must be checked before use.
const URL_BASE = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra = {}) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...extra };
}

async function check(res, what) {
  if (!res.ok) throw new Error(`Supabase ${what} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Rows from a table. `query` is a PostgREST filter string, e.g. "id=eq.1&select=*". */
async function select(table, query) {
  return check(await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, { headers: headers() }), `select ${table}`);
}

async function patch(table, query, body) {
  return check(
    await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(body),
    }),
    `update ${table}`,
  );
}

/** The user behind a signed-in browser session, or null if the token is not valid. */
async function userFromToken(jwt) {
  const res = await fetch(`${URL_BASE}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${jwt}` },
  });
  return res.ok ? res.json() : null;
}

module.exports = { select, patch, userFromToken };
