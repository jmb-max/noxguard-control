-- ============================================================
-- 2026-05-05 — Fix RLS: dashboard no veía registros
-- ============================================================
--
-- Síntoma: Dashboard muestra "0 registros" para admin/supervisor
--          aunque la tabla inspecciones_contenedor tiene rows.
--
-- Causa: La policy `supervisors_view_all_inspections` consulta la
--        tabla `profiles` (vieja), pero los roles del sistema viven
--        en la tabla `usuarios` (nueva, migrada en fase-1).
--
-- Las dos posibilidades:
--   profiles.id    profiles.role        → tabla vieja
--   usuarios.auth_id  usuarios.rol      → tabla nueva (post-fase-1)
--
-- Y los nombres de roles también cambiaron:
--   profiles: 'guard', 'supervisor', 'admin'
--   usuarios: 'guarda', 'supervisor', 'coordinador', 'directivo', 'admin', 'cliente'
--
-- Acción: reemplazar policy para que lea de `usuarios` y reconozca
--         los roles que pueden ver TODOS los registros (no solo los suyos):
--   - admin: ve todo
--   - directivo: ve todo
--   - coordinador: ve todo
--   - supervisor: ve todo (de su zona en futuro, hoy todo)
--   - guarda: NO (mantiene policy guards_own_inspections)
--   - cliente: NO por ahora (se hará política específica después)
-- ============================================================

-- 1. Drop policy antigua que apunta a profiles
DROP POLICY IF EXISTS supervisors_view_all_inspections ON public.inspecciones_contenedor;

-- 2. Recrear policy apuntando a usuarios + roles correctos
CREATE POLICY managers_view_all_inspections ON public.inspecciones_contenedor
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_id = auth.uid()
        AND u.activo = true
        AND u.rol IN ('admin', 'directivo', 'coordinador', 'supervisor')
    )
  );

-- 3. Aplicar el mismo fix a las otras 10 tablas de formularios
--    (preventivamente — aunque hoy estén vacías, mañana van a tener data
--     y el dashboard de cada vista necesitará leer)
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'control_armas','atencion_alarmas','supervision_diaria','chequeos_moto',
    'alertas_riesgos','ronda_ingenio','supervision_general','visita_cliente',
    'descargues_ara','ronda_hospital'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    -- Drop cualquier policy vieja que mire profiles
    EXECUTE format('DROP POLICY IF EXISTS supervisors_view_all_%I ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS managers_view_all_%I ON public.%I', t, t);
    -- Crear policy nueva
    EXECUTE format($q$
      CREATE POLICY managers_view_all_%I ON public.%I
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.usuarios u
            WHERE u.auth_id = auth.uid()
              AND u.activo = true
              AND u.rol IN ('admin', 'directivo', 'coordinador', 'supervisor')
          )
        )
    $q$, t, t);
  END LOOP;
END $$;
