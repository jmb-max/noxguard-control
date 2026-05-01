-- ============================================================
-- NoxGuard Control - Tablas nuevas (7 formularios)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- FORM 5: Control Armas y Comunicaciones
create table if not exists control_armas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, guard_id uuid,
  fecha_hora text, placa_unidad text, cedula_agente text,
  nombre_agente text, celular text, ubicacion text,
  nombre_puesto text,
  mov_entrega boolean default false,
  mov_cambio boolean default false,
  mov_retiro boolean default false,
  observaciones text, fotos jsonb
);

-- FORM 6: Ronda Patrulla Ingenio Risaralda
create table if not exists ronda_ingenio (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, guard_id uuid,
  fecha_hora text, placa_unidad text, cedula_guarda text,
  nombre_guarda text, celular text, ubicacion text,
  codigo_qr text, fecha_hora_escaneo text,
  riesgos text, novedad_control text, observaciones_generales text,
  fotos jsonb, firma text
);

-- FORM 7: Ronda Hospital Santa Mónica
create table if not exists ronda_hospital (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, guard_id uuid,
  fecha_hora text, placa_unidad text, cedula_guarda text,
  nombre_guarda text, celular text, ubicacion text,
  puntos jsonb,
  nombre_guarda_firma text, observaciones_generales text,
  fotos jsonb, firma text
);

-- FORM 8: Supervisión Diaria Vigilancia Física
create table if not exists supervision_diaria (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, supervisor_id uuid,
  fecha_hora text, placa_unidad text, cedula_supervisor text,
  nombre_supervisor text, celular text, ubicacion text,
  numero_puesto text, nombre_cliente text, direccion text,
  ruta text, zona text, unidad_supervision text, servicio text,
  nombre_vigilante text, observaciones text, fotos jsonb
);

-- FORM 9: Supervisión General
create table if not exists supervision_general (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, supervisor_id uuid,
  fecha_hora text, placa_unidad text, cedula_supervisor text,
  nombre_supervisor text, celular text, ubicacion text,
  numero_puesto text, nombre_cliente text, direccion text,
  ruta text, zona text, unidad_supervision text,
  nombre_guarda text, puesto text,
  novedades_programacion text, observaciones_titular text,
  faltas_servicio text, acciones_disciplinarias text,
  presentacion jsonb, armamento boolean default false,
  serial_armamento text, estado_armamento text,
  salvoconducto boolean default false, aseo_mantenimiento text,
  observaciones_armamento text, municion text,
  comunicaciones boolean default false, tipo_elemento text,
  estado_medio text, serial_medio text, transmision text,
  observacion_comunicacion text,
  elementos jsonb, eventos jsonb,
  observaciones_finales text, fotos jsonb
);

-- FORM 10: Reporte de Descargues ARA
create table if not exists descargues_ara (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, guard_id uuid,
  fecha_hora text, placa_unidad text, cedula_agente text,
  nombre_agente text, celular text, ubicacion text,
  codigo_sap text, nombre_tienda text, fecha_descargue text,
  hora_inicial text, hora_final text, duracion_descargue text,
  observaciones_generales text, nombre_supervisor_motorizado text,
  fotos jsonb, firma text
);

-- FORM 11: Visita Cliente Operativa
create table if not exists visita_cliente (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  form_no text, coordinator_id uuid,
  fecha_hora_inicio text, fecha_hora_final text,
  placa_unidad text, cedula_coordinador text,
  nombre_coordinador text, celular text, ubicacion text,
  nombre_cliente text, nit_cliente text,
  persona_atiende text, cargo_persona text,
  asistentes jsonb, compromisos jsonb,
  observaciones text, calificacion_servicio numeric,
  fotos jsonb
);
