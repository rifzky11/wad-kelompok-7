const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// The API authenticates requests with its own JWT, so Supabase RLS cannot
// derive auth.uid() from the incoming token. The service key keeps database
// access behind this authenticated backend instead of exposing RLS bypass to
// the browser.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = {
  supabase,
};
