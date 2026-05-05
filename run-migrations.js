#!/usr/bin/env node
/**
 * Script para ejecutar migraciones SQL en Supabase vía la RPC public.exec_sql
 * (que debe haberse creado primero ejecutando manualmente el SQL en
 *  sql-migrations/2026-05-05-bootstrap-exec-sql-rpc.sql).
 *
 * Uso: node run-migrations.js <archivo.sql>
 *
 * Lee SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL de .env.local
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// --- Cargar .env.local ---
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found at', envPath);
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const hostname = new URL(SUPABASE_URL).hostname;

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ sql });
    const options = {
      hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node run-migrations.js <archivo.sql>');
    process.exit(1);
  }
  const fullPath = path.isAbsolute(file) ? file : path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.error('❌ File not found:', fullPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`🚀 Running migration: ${file}\n`);
  const result = await executeSQL(sql);
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));
  if (result.data?.ok === false) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
