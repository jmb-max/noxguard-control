-- NoxGuard Control - Esquema de Base de Datos
-- Ejecutar en Supabase SQL Editor

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- Tabla de perfiles (extiende auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('guard', 'supervisor', 'admin')) default 'guard',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'guard');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabla principal: Inspecciones de Contenedor
create table if not exists inspecciones_contenedor (
  id uuid default gen_random_uuid() primary key,
  form_no text,
  guard_id uuid references profiles(id),
  -- Datos Generales
  usuario_gestor text,
  fecha_elaboracion date,
  placa_veh text,
  cedula_conductor text,
  nombre_conductor text,
  celular_conductor text,
  ubicacion text,
  -- Unidad de cargue
  tamano_contenedor text,
  num_contenedor text,
  -- Sellos
  sello_botella text,
  sello_sticker text,
  sello_guaya text,
  sello_asignado text,
  sello_adicional text,
  sello_satelital boolean default true,
  dispositivo_sat text,
  sello_recibido boolean default true,
  -- Lugar llenado
  lugar_llenado text,
  muelle text,
  -- Inspector técnico
  insp_tec_apellidos text,
  insp_tec_nombres text,
  insp_tec_doc text,
  -- Transporte
  empresa text,
  marca_vehiculo text,
  placa_vehiculo text,
  placa_remolque text,
  conductor_nombre text,
  conductor_doc text,
  -- Canino
  guia_apellidos text,
  guia_nombre text,
  guia_doc text,
  can_nombre text,
  can_raza text,
  can_microchip text,
  -- Inspecciones antinarcóticos
  insp_vehiculo boolean default true,
  insp_veh_hora_inicio time,
  insp_veh_hora_fin time,
  insp_veh_obs text,
  insp_contenedor boolean default true,
  insp_cont_hora_inicio time,
  insp_cont_hora_fin time,
  insp_cont_obs text,
  insp_mercancia boolean default true,
  insp_merc_hora_inicio time,
  insp_merc_hora_fin time,
  insp_merc_obs text,
  -- Llenado
  hora_inicio_llenado time,
  hora_fin_llenado time,
  responsable_llenado text,
  doc_responsable text,
  obs_final text,
  -- Cierre
  fecha_salida date,
  guia_responsable text,
  -- Metadata
  fotos jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table inspecciones_contenedor enable row level security;

-- Políticas profiles
create policy "users_own_profile" on profiles
  for all using (auth.uid() = id);

create policy "supervisors_view_all_profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('supervisor', 'admin'))
  );

-- Políticas inspecciones
create policy "guards_own_inspections" on inspecciones_contenedor
  for all using (guard_id = auth.uid());

create policy "supervisors_view_all_inspections" on inspecciones_contenedor
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('supervisor', 'admin'))
  );

-- Para cambiar un usuario a supervisor (ejecutar manualmente):
-- update profiles set role = 'supervisor' where id = 'UUID_DEL_USUARIO';
-- update profiles set role = 'admin' where id = 'UUID_DEL_USUARIO';

-- Columnas adicionales v1.1
ALTER TABLE inspecciones_contenedor 
  ADD COLUMN IF NOT EXISTS sello_sticker text,
  ADD COLUMN IF NOT EXISTS can_microchip text,
  ADD COLUMN IF NOT EXISTS marca_vehiculo text,
  ADD COLUMN IF NOT EXISTS placa_remolque text,
  ADD COLUMN IF NOT EXISTS ubicacion_gps text,
  ADD COLUMN IF NOT EXISTS insp_tec_apellidos text,
  ADD COLUMN IF NOT EXISTS insp_tec_nombres text,
  ADD COLUMN IF NOT EXISTS insp_tec_doc text;
