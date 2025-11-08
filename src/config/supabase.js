// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Anon Key must be defined in .env file");
}

// Ekspor klien Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
