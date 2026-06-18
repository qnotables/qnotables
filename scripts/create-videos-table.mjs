/**
 * One-time migration: creates the `videos` table via Supabase REST SQL endpoint.
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/create-videos-table.mjs
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const statements = [
  `CREATE TABLE IF NOT EXISTS videos (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title         text NOT NULL,
    description   text,
    category      text,
    date          date,
    external_url  text,
    video_url     text,
    thumbnail_url text,
    published     boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos (created_at DESC)`,
  `CREATE OR REPLACE FUNCTION set_updated_at()
   RETURNS TRIGGER LANGUAGE plpgsql AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$`,
  `DROP TRIGGER IF EXISTS videos_set_updated_at ON videos`,
  `CREATE TRIGGER videos_set_updated_at
     BEFORE UPDATE ON videos
     FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
]

for (const sql of statements) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ sql }),
  })

  if (!res.ok) {
    const text = await res.text()
    // If exec_sql RPC doesn't exist, use the pg endpoint directly
    if (text.includes("exec_sql")) {
      console.log("exec_sql RPC not found, trying /pg endpoint...")
      const pgRes = await fetch(`${url}/pg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ query: sql }),
      })
      if (!pgRes.ok) {
        const pgText = await pgRes.text()
        console.warn(`Statement skipped (may already exist): ${pgText.slice(0, 200)}`)
      } else {
        console.log("Statement executed via /pg.")
      }
    } else {
      console.warn(`Statement skipped (may already exist): ${text.slice(0, 200)}`)
    }
  } else {
    console.log("Statement executed.")
  }
}

console.log("Migration complete.")
