-- ============================================================
-- 2026-05-05 — Bootstrap: RPC exec_sql para automatización
-- ============================================================
--
-- Crea una función RPC que permite ejecutar SQL arbitrario a 
-- través de PostgREST cuando se llama con service_role key.
--
-- Esto desbloquea automatización de migraciones, queries de 
-- diagnóstico, fixes de schema, etc. desde herramientas externas
-- sin necesidad de connection string Postgres directo.
--
-- SEGURIDAD:
-- - SECURITY DEFINER ejecuta como el owner de la función (postgres)
-- - REVOKE de PUBLIC + GRANT solo a service_role asegura que solo
--   llamadas con la service_role key (que ya tiene poder absoluto)
--   puedan invocarla. No es una escalación de privilegios.
-- - Anon y authenticated NO pueden llamarla.
--
-- Después de correr este SQL, las migraciones futuras pueden 
-- aplicarse automáticamente vía:
--   POST /rest/v1/rpc/exec_sql  body: {"sql": "ALTER TABLE ..."}
--   con header  Authorization: Bearer <service_role>
-- ============================================================

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Ejecutar el SQL. Si es un SELECT, capturamos las filas como jsonb.
  -- Si es DDL/DML, devolvemos un jsonb con metadata.
  BEGIN
    EXECUTE format('SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', sql) INTO result;
    RETURN jsonb_build_object('ok', true, 'rows', result);
  EXCEPTION WHEN OTHERS THEN
    -- Si falló como SELECT (porque es DDL/DML), intentar ejecutarlo crudo
    BEGIN
      EXECUTE sql;
      RETURN jsonb_build_object('ok', true, 'rows', null, 'note', 'non-select statement executed');
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
    END;
  END;
END;
$$;

-- Restringir acceso: solo service_role puede invocar
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql(text) IS
'Ejecuta SQL arbitrario. Solo accesible vía service_role key. Bootstrap para automatización de migraciones.';
