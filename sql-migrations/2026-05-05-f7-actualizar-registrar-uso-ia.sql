-- ============================================================
-- 2026-05-05 — F7: Actualizar función registrar_uso_ia
-- ============================================================
-- Cambios:
--   - Guardas: límite 0 (sin acceso al chat IA)
--   - Admin: límite 999 (ilimitado en práctica)
--   - Precios actualizados a Claude Haiku 4.5:
--     input: $0.0000008/token, output: $0.000004/token
--   - Solo registra si el usuario tiene cuota disponible
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_uso_ia(
  p_usuario_id uuid,
  p_tokens_input integer,
  p_tokens_output integer,
  p_modelo text DEFAULT 'haiku'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rol text;
  v_limite_diario integer;
  v_consultas_hoy integer;
  v_costo_input  float := 0.0000008;
  v_costo_output float := 0.000004;
  v_costo_total  float;
  v_permitido    boolean;
BEGIN
  SELECT rol INTO v_rol FROM usuarios WHERE id = p_usuario_id;

  v_limite_diario := CASE v_rol
    WHEN 'admin'       THEN 999
    WHEN 'directivo'   THEN 30
    WHEN 'coordinador' THEN 20
    WHEN 'supervisor'  THEN 10
    WHEN 'cliente'     THEN 5
    WHEN 'guarda'      THEN 0
    ELSE 0
  END;

  SELECT COALESCE(consultas_count, 0) INTO v_consultas_hoy
  FROM ia_usage
  WHERE usuario_id = p_usuario_id AND fecha = current_date;

  v_permitido   := v_consultas_hoy < v_limite_diario;
  v_costo_total := (p_tokens_input * v_costo_input) + (p_tokens_output * v_costo_output);

  IF v_permitido THEN
    INSERT INTO ia_usage (usuario_id, fecha, consultas_count, tokens_input, tokens_output, costo_estimado)
    VALUES (p_usuario_id, current_date, 1, p_tokens_input, p_tokens_output, v_costo_total)
    ON CONFLICT (usuario_id, fecha) DO UPDATE SET
      consultas_count = ia_usage.consultas_count + 1,
      tokens_input    = ia_usage.tokens_input    + p_tokens_input,
      tokens_output   = ia_usage.tokens_output   + p_tokens_output,
      costo_estimado  = ia_usage.costo_estimado  + v_costo_total,
      updated_at      = now();
  END IF;

  RETURN json_build_object(
    'permitido',     v_permitido,
    'consultas_hoy', v_consultas_hoy + CASE WHEN v_permitido THEN 1 ELSE 0 END,
    'limite',        v_limite_diario,
    'rol',           v_rol,
    'costo',         v_costo_total
  );
END;
$$;
