const { createClient } = require("@supabase/supabase-js");
const postgres = require("postgres");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

let sql = null;
if (databaseUrl) {
  sql = postgres(databaseUrl, {
    ssl: "require",
  });
}

module.exports = {
  supabase,
  supabaseAdmin,
  sql,
};
