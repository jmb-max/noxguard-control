-- ============================================================
-- 2026-05-05 — Drop sync triggers rotos a tabla `registros`
-- ============================================================
--
-- Contexto: existen 7 funciones trigger `sync_<tabla>_to_registros()` 
-- que intentan espejar inserts hacia una tabla agnóstica `registros`.
--
-- Problema: los triggers fueron escritos contra un schema imaginario.
-- Referencian columnas que NO existen en las tablas-fuente:
--   - NEW.cliente_id           (ninguna tabla la tiene)
--   - NEW.guarda_id            (las tablas tienen `guard_id`, no "a")
--   - NEW.fecha                (las tablas tienen `fecha_hora`)
--   - NEW.cantidad_armas       (no existe)
--   - NEW.inspecciones_realizadas (no existe)
--   - NEW.cantidad_bultos      (no existe)
--   - NEW.turno                (no existe)
--
-- Resultado: TODO insert a las 7 tablas falla con error 42703
-- "record \"new\" has no field \"cliente_id\"". Esto bloquea
-- 7 de 11 formularios en producción.
--
-- Las funciones nunca pudieron haber ejecutado sin error.
-- Tabla `registros` está vacía (nada depende de ellas).
-- Dashboard lee de tablas tipadas directamente, no de `registros`.
--
-- Acción: dropear las 7 funciones con CASCADE — esto elimina
-- también los triggers que las invocan en cada tabla.
--
-- Si en el futuro se decide implementar el patrón agnóstico,
-- los triggers deben reescribirse contra el schema real.
-- ============================================================

DROP FUNCTION IF EXISTS public.sync_control_armas_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_descargues_ara_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_ronda_hospital_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_ronda_ingenio_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_supervision_diaria_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_supervision_general_to_registros() CASCADE;
DROP FUNCTION IF EXISTS public.sync_visita_cliente_to_registros() CASCADE;

-- Verificación: estas queries deben devolver 0 filas después del drop
-- SELECT proname FROM pg_proc WHERE proname LIKE 'sync_%_to_registros';
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE '%sync%registros%';
