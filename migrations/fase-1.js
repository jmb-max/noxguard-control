const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar credenciales desde .env.local (NUNCA hardcodear service_role)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local no encontrado en', envPath);
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function fase1() {
  console.log('🔄 FASE 1: Migración Profiles → Usuarios...\n');

  try {
    // PASO 1: Crear tabla usuarios
    console.log('📝 PASO 1: Crear tabla usuarios...');
    const { error: createError } = await supabase.rpc('exec', {
      sql: `create table if not exists usuarios (
        id uuid primary key default gen_random_uuid(),
        auth_id uuid references auth.users(id) on delete cascade unique,
        nombre text,
        email text unique not null,
        rol text not null check (rol in ('directivo','coordinador','supervisor','guarda','cliente')),
        zona text,
        ruta text,
        placa text,
        activo boolean default true,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );`
    });

    if (createError && !createError.message.includes('already exists')) {
      console.error('❌ Error creando tabla:', createError);
      return;
    }
    console.log('✅ Tabla usuarios creada\n');

    // PASO 2: Migrar datos
    console.log('📝 PASO 2: Migrando datos de profiles...');
    const { error: migrateError } = await supabase.rpc('exec', {
      sql: `insert into usuarios (auth_id, email, rol, activo, created_at)
      select 
        id,
        COALESCE((select email from auth.users where auth.users.id = profiles.id), 'unknown@psi.co'),
        case 
          when role = 'guard' then 'guarda'
          when role = 'supervisor' then 'supervisor'
          when role = 'admin' then 'coordinador'
          else 'guarda'
        end,
        true,
        created_at
      from profiles
      on conflict (auth_id) do nothing;`
    });

    if (migrateError) {
      console.error('❌ Error migrando datos:', migrateError);
      return;
    }
    console.log('✅ Datos migrados\n');

    // PASO 3: Crear índices
    console.log('📝 PASO 3: Creando índices...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `create index if not exists idx_usuarios_email on usuarios(email);
      create index if not exists idx_usuarios_auth_id on usuarios(auth_id);
      create index if not exists idx_usuarios_rol on usuarios(rol);`
    });

    if (indexError) {
      console.error('❌ Error creando índices:', indexError);
      return;
    }
    console.log('✅ Índices creados\n');

    // PASO 4: Habilitar RLS
    console.log('📝 PASO 4: Habilitando RLS...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: `alter table usuarios enable row level security;
      create policy if not exists "usuarios_read_self" on usuarios for select using (auth_id = auth.uid());
      create policy if not exists "usuarios_update_self" on usuarios for update using (auth_id = auth.uid());
      create policy if not exists "admin_full_access" on usuarios for all using (exists (select 1 from usuarios where auth_id = auth.uid() and rol = 'coordinador'));`
    });

    if (rlsError) {
      console.error('❌ Error habilitando RLS:', rlsError);
      return;
    }
    console.log('✅ RLS habilitado\n');

    // VALIDACIÓN
    console.log('=' .repeat(60));
    console.log('🔍 VALIDACIÓN FASE 1\n');

    // Query 1: Contar usuarios
    const { data: usuarioCount, error: err1 } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact' });

    console.log(`✅ Total usuarios creados: ${usuarioCount?.length || 0}`);

    // Query 2: Distribución de roles
    const { data: roleDistribution, error: err2 } = await supabase.rpc('exec', {
      sql: `select rol, count(*) as cantidad from usuarios group by rol order by cantidad desc;`
    });

    console.log('\n📊 Distribución de roles:');
    if (roleDistribution) {
      roleDistribution.forEach(row => {
        console.log(`   ${row.rol}: ${row.cantidad}`);
      });
    }

    // Query 3: RLS status
    const { data: rlsStatus, error: err3 } = await supabase.rpc('exec', {
      sql: `select tablename, rowsecurity from pg_tables where tablename = 'usuarios';`
    });

    console.log(`\n🔐 RLS Habilitado: ${rlsStatus?.[0]?.rowsecurity ? 'SÍ' : 'NO'}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ FASE 1 COMPLETADA\n');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fase1();
