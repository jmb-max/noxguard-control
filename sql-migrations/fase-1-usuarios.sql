-- FASE 1: Migración Profiles → Usuarios
-- Ejecutar en: https://supabase.com/dashboard/project/tyfzjqzcpgwcjnxozaaf/sql

-- PASO 1: Crear tabla usuarios
create table usuarios (
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
);

-- PASO 2: Migrar datos de profiles a usuarios
insert into usuarios (auth_id, email, rol, activo, created_at)
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
on conflict (auth_id) do nothing;

-- PASO 3: Crear índices para performance
create index idx_usuarios_email on usuarios(email);
create index idx_usuarios_auth_id on usuarios(auth_id);
create index idx_usuarios_rol on usuarios(rol);

-- PASO 4: RLS en usuarios
alter table usuarios enable row level security;

create policy "usuarios_read_self" on usuarios for select 
  using (auth_id = auth.uid());

create policy "usuarios_update_self" on usuarios for update 
  using (auth_id = auth.uid());

create policy "admin_full_access" on usuarios for all 
  using (
    exists (select 1 from usuarios where auth_id = auth.uid() and rol = 'coordinador')
  );

-- ============================================================
-- VALIDACIÓN FASE 1
-- ============================================================

-- Query 1: Contar usuarios creados
select 
  'Total usuarios creados' as validacion,
  count(*) as cantidad
from usuarios;

-- Query 2: Verificar mapeo de roles es correcto
select 
  'Distribución de roles' as validacion,
  rol,
  count(*) as cantidad
from usuarios
group by rol
order by cantidad desc;

-- Query 3: Verificar que no hay duplicados en auth_id
select 
  'Duplicados auth_id' as validacion,
  count(*) as cantidad
from usuarios
group by auth_id
having count(*) > 1;

-- Query 4: Verificar RLS está habilitado
select
  'RLS en tabla usuarios' as validacion,
  schemaname,
  tablename,
  rowsecurity
from pg_tables 
where tablename = 'usuarios';

-- Query 5: Verificar índices fueron creados
select 
  'Índices creados' as validacion,
  indexname,
  tablename
from pg_indexes
where tablename = 'usuarios'
order by indexname;
