-- ============================================================
-- 2026-05-05 — F1: Vista unificada de eventos para dashboard
-- ============================================================
--
-- Une las 11 tablas tipadas en una sola fuente agnóstica que el
-- dashboard puede consumir con filtros server-side, paginación y
-- counts eficientes.
--
-- Cada row del view representa un evento de campo, con:
--   - tipo_evento     : slug que identifica el formulario fuente
--   - tipo_label      : nombre amigable para mostrar
--   - id              : id del row en su tabla origen
--   - fecha           : timestamp normalizado (created_at o fecha_*)
--   - cliente_id      : FK
--   - puesto_id       : FK
--   - autor_id        : guard_id / supervisor_id / coordinator_id
--   - autor_rol       : 'guarda' | 'supervisor' | 'coordinador'
--   - tiene_novedad   : BOOLEAN
--   - descripcion_novedad : TEXT
--   - coords_lat / coords_lng : NUMERIC
--   - resumen         : TEXT corto específico del tipo (p.ej. placa,
--                       contenedor, código QR, etc.) para mostrar en
--                       la columna "RESUMEN" de la tabla del dashboard
--   - form_no         : etiqueta No.XXXX del formulario
--
-- RLS: la vista hereda los policies de las tablas subyacentes 
-- (PostgreSQL aplica RLS antes del UNION). No requiere policies propias.
-- ============================================================

DROP VIEW IF EXISTS public.v_eventos_unificados CASCADE;

CREATE VIEW public.v_eventos_unificados AS
-- 1) Inspección de contenedores
SELECT 
  'inspeccion_contenedor'::text AS tipo_evento,
  'Inspección Contenedor'::text AS tipo_label,
  id, form_no, created_at,
  COALESCE(created_at, NULL) AS fecha,
  cliente_id, puesto_id,
  guard_id AS autor_id, 'guarda'::text AS autor_rol,
  COALESCE(tiene_novedad, false) AS tiene_novedad,
  descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(num_contenedor, ''),
    NULLIF(placa_veh, '')
  ) AS resumen,
  placa_veh AS placa,
  ubicacion AS ubicacion_texto
FROM public.inspecciones_contenedor

UNION ALL
-- 2) Control armas y comunicaciones
SELECT 
  'control_armas','Control Armas',
  id, form_no, created_at,
  created_at AS fecha,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    CASE WHEN mov_entrega THEN 'Entrega' WHEN mov_cambio THEN 'Cambio' WHEN mov_retiro THEN 'Retiro' ELSE NULL END,
    NULLIF(nombre_puesto, '')
  ),
  placa_unidad, ubicacion
FROM public.control_armas

UNION ALL
-- 3) Atención de alarmas
SELECT 
  'atencion_alarmas','Atención Alarma',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(codigo_evento, ''),
    NULLIF(nombre_cliente, '')
  ),
  placa_veh, ubicacion
FROM public.atencion_alarmas

UNION ALL
-- 4) Supervisión diaria
SELECT 
  'supervision_diaria','Supervisión Diaria',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  supervisor_id, 'supervisor',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(numero_puesto, ''),
    NULLIF(nombre_cliente, '')
  ),
  placa_unidad, ubicacion
FROM public.supervision_diaria

UNION ALL
-- 5) Chequeo moto
SELECT 
  'chequeo_moto','Chequeo Moto',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(placa_moto, ''),
    CONCAT(km_inicial::text, '→', km_final::text, ' km')
  ),
  placa_unidad, ubicacion
FROM public.chequeos_moto

UNION ALL
-- 6) Alertas de riesgos
SELECT 
  'alerta_riesgos','Alerta Riesgo',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(identificacion_riesgo, ''),
    NULLIF(nombre_puesto, '')
  ),
  placa_veh, ubicacion
FROM public.alertas_riesgos

UNION ALL
-- 7) Ronda Ingenio
SELECT 
  'ronda_ingenio','Ronda Ingenio',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(codigo_qr, ''),
    NULLIF(nombre_guarda, '')
  ),
  placa_unidad, ubicacion
FROM public.ronda_ingenio

UNION ALL
-- 8) Supervisión general
SELECT 
  'supervision_general','Supervisión General',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  supervisor_id, 'supervisor',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(numero_puesto, ''),
    NULLIF(nombre_cliente, '')
  ),
  placa_unidad, ubicacion
FROM public.supervision_general

UNION ALL
-- 9) Visita cliente
SELECT 
  'visita_cliente','Visita Cliente',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  coordinator_id, 'coordinador',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(nombre_cliente, ''),
    NULLIF(persona_atiende, '')
  ),
  placa_unidad, ubicacion
FROM public.visita_cliente

UNION ALL
-- 10) Descargues ARA
SELECT 
  'descargues_ara','Descargue ARA',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(codigo_sap, ''),
    NULLIF(nombre_tienda, '')
  ),
  placa_unidad, ubicacion
FROM public.descargues_ara

UNION ALL
-- 11) Ronda Hospital
SELECT 
  'ronda_hospital','Ronda Hospital',
  id, form_no, created_at,
  created_at,
  cliente_id, puesto_id,
  guard_id, 'guarda',
  COALESCE(tiene_novedad, false), descripcion_novedad,
  coords_lat, coords_lng,
  CONCAT_WS(' · ',
    NULLIF(nombre_guarda, ''),
    NULLIF(nombre_guarda_firma, '')
  ),
  placa_unidad, ubicacion
FROM public.ronda_hospital;

-- Permisos: las vistas heredan RLS de las tablas base, pero hay que
-- garantizar que el rol authenticated puede SELECT desde la vista.
GRANT SELECT ON public.v_eventos_unificados TO authenticated;
GRANT SELECT ON public.v_eventos_unificados TO anon;
