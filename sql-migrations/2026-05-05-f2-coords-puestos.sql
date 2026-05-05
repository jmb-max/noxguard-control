-- ============================================================
-- 2026-05-05 — F2: Agregar coords GPS a tabla puestos
-- ============================================================
--
-- Agrega coords_lat y coords_lng a puestos para markers del mapa.
-- Idempotente (ADD COLUMN IF NOT EXISTS).
-- Las coords se llenan manualmente desde el Panel Admin del dashboard.
-- ============================================================

ALTER TABLE public.puestos
  ADD COLUMN IF NOT EXISTS coords_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS coords_lng NUMERIC;
