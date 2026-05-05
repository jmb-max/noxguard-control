-- ============================================================
-- 2026-05-05 — F0: Deuda técnica para dashboard unificado
-- ============================================================
--
-- Contexto: las 11 tablas de formularios guardan `ubicacion` como
-- texto libre, sin asociación formal a clientes/puestos. Eso impide:
--   - Filtros por cliente/puesto en dashboard (no se puede agrupar)
--   - Vista de cliente final (RLS por cliente_id imposible)
--   - KPIs por cliente
--   - Mapa con marcadores precisos
--   - Identificación consistente de "novedades" cross-tabla
--
-- Esta migración agrega 6 columnas a las 11 tablas:
--
--   cliente_id          UUID FK clientes(id)   — quién es el cliente final
--   puesto_id           UUID FK puestos(id)    — qué puesto físico
--   tiene_novedad       BOOLEAN DEFAULT false  — flag uniforme cross-tabla
--   descripcion_novedad TEXT                   — texto libre de la novedad
--   coords_lat          NUMERIC                — GPS lat (numérico, queryable)
--   coords_lng          NUMERIC                — GPS lng
--
-- Todas son nullable para que rows existentes no rompan. La nullabilidad
-- se puede endurecer después con backfills si se quiere.
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS y los FK constraints son
-- creados solo si no existen (DO block).
-- ============================================================

DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'inspecciones_contenedor','control_armas','atencion_alarmas','supervision_diaria',
    'chequeos_moto','alertas_riesgos','ronda_ingenio','supervision_general',
    'visita_cliente','descargues_ara','ronda_hospital'
  ];
  fk_cliente_name text;
  fk_puesto_name text;
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    -- 1. Agregar columnas (idempotente)
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS cliente_id UUID', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS puesto_id UUID', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tiene_novedad BOOLEAN DEFAULT false', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS descripcion_novedad TEXT', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS coords_lat NUMERIC', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS coords_lng NUMERIC', t);

    -- 2. Asegurar default false para tiene_novedad incluso si la columna ya existía
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tiene_novedad SET DEFAULT false', t);
    EXECUTE format('UPDATE public.%I SET tiene_novedad = false WHERE tiene_novedad IS NULL', t);

    -- 3. Crear FK constraints si no existen (chequear pg_constraint)
    fk_cliente_name := t || '_cliente_id_fkey';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE n.nspname = 'public' AND cl.relname = t AND c.conname = fk_cliente_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL',
        t, fk_cliente_name
      );
    END IF;

    fk_puesto_name := t || '_puesto_id_fkey';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE n.nspname = 'public' AND cl.relname = t AND c.conname = fk_puesto_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (puesto_id) REFERENCES public.puestos(id) ON DELETE SET NULL',
        t, fk_puesto_name
      );
    END IF;

    -- 4. Indices para queries del dashboard (filter by cliente/puesto/fecha)
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_cliente_id ON public.%I(cliente_id)', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_puesto_id  ON public.%I(puesto_id)',  t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_novedad    ON public.%I(tiene_novedad) WHERE tiene_novedad = true', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_created_at ON public.%I(created_at DESC)', t, t);

    RAISE NOTICE 'Tabla % actualizada', t;
  END LOOP;
END $$;

-- ============================================================
-- Verificación: contar columnas nuevas en las 11 tablas
-- (debe devolver 11 rows con count=6 cada una)
-- ============================================================
-- SELECT table_name, count(*) AS cols_nuevas
-- FROM information_schema.columns
-- WHERE table_schema='public'
--   AND table_name IN ('inspecciones_contenedor','control_armas','atencion_alarmas','supervision_diaria',
--                      'chequeos_moto','alertas_riesgos','ronda_ingenio','supervision_general',
--                      'visita_cliente','descargues_ara','ronda_hospital')
--   AND column_name IN ('cliente_id','puesto_id','tiene_novedad','descripcion_novedad','coords_lat','coords_lng')
-- GROUP BY table_name ORDER BY table_name;
