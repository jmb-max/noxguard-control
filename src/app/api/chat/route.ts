import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Límites por rol (espejo de la función SQL) ─────────────────────────────
const LIMITES: Record<string, number> = {
  admin: 999, directivo: 30, coordinador: 20, supervisor: 10, cliente: 5, guarda: 0,
}

// ── Botones rápidos predefinidos ───────────────────────────────────────────
const QUERIES_RAPIDAS: Record<string, string> = {
  'eventos_hoy':        'SELECT tipo_label, COUNT(*) as total FROM v_eventos_unificados WHERE DATE(fecha) = CURRENT_DATE GROUP BY tipo_label ORDER BY total DESC',
  'novedades':          'SELECT tipo_label, fecha, resumen, descripcion_novedad FROM v_eventos_unificados WHERE tiene_novedad = true ORDER BY fecha DESC LIMIT 20',
  'eventos_semana':     'SELECT tipo_label, COUNT(*) as total FROM v_eventos_unificados WHERE fecha >= NOW() - INTERVAL \'7 days\' GROUP BY tipo_label ORDER BY total DESC',
  'ultimos_eventos':    'SELECT tipo_label, fecha, resumen FROM v_eventos_unificados ORDER BY fecha DESC LIMIT 10',
}

// ── Prompt del sistema ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un asistente de análisis operacional para PSI NoxGuard.
Tu rol: traducir preguntas en español a SQL que consulta la vista v_eventos_unificados.

ESQUEMA DE LA VISTA v_eventos_unificados:
- tipo_evento: text (slug: inspeccion_contenedor, control_armas, atencion_alarmas, supervision_diaria, supervision_general, chequeo_moto, alerta_riesgos, ronda_ingenio, ronda_hospital, visita_cliente, descargues_ara)
- tipo_label: text (nombre legible del tipo)
- id: uuid
- form_no: text
- fecha: timestamptz
- cliente_id: uuid
- puesto_id: uuid  
- autor_id: uuid
- autor_rol: text (guarda, supervisor, coordinador)
- tiene_novedad: boolean
- descripcion_novedad: text
- coords_lat / coords_lng: numeric
- resumen: text (resumen corto del evento)
- placa: text

TABLAS ADICIONALES disponibles (solo lectura):
- clientes (id, nombre, ciudad, tipo)
- puestos (id, nombre, numero, cliente_id)
- usuarios (id, nombre, email, rol)

REGLAS:
1. Responde SOLO con un JSON con esta forma exacta:
   { "sql": "SELECT ...", "explicacion": "texto breve de lo que hace la query" }
2. La query SIEMPRE debe incluir LIMIT (máx 50 filas)
3. Solo SELECT — nunca INSERT, UPDATE, DELETE, DROP
4. Si la pregunta no puede responderse con estos datos, responde:
   { "sql": null, "explicacion": "No tengo datos para responder eso" }
5. Para JOINs con nombres legibles usa:
   LEFT JOIN clientes c ON c.id = e.cliente_id
   LEFT JOIN puestos p ON p.id = e.puesto_id
   LEFT JOIN usuarios u ON u.id::text = e.autor_id::text
6. Las fechas van en zona horaria de Bogotá (America/Bogota)
7. Sé conciso y directo — sin explicaciones largas`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // ── Autenticación ────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, rol, nombre')
      .eq('auth_id', user.id)
      .single()

    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 })

    const rol = usuario.rol as string

    // ── Guardas sin acceso ───────────────────────────────────────────────────
    if (rol === 'guarda') {
      return NextResponse.json({ error: 'El chat IA no está disponible para guardas' }, { status: 403 })
    }

    const { pregunta, queryRapida } = await req.json()
    if (!pregunta && !queryRapida) {
      return NextResponse.json({ error: 'Pregunta vacía' }, { status: 400 })
    }

    // ── Verificar cuota antes de llamar a Claude ─────────────────────────────
    const { data: usageHoy } = await supabase
      .from('ia_usage')
      .select('consultas_count')
      .eq('usuario_id', usuario.id)
      .eq('fecha', new Date().toISOString().split('T')[0])
      .single()

    const consultasHoy = usageHoy?.consultas_count ?? 0
    const limite = LIMITES[rol] ?? 0

    if (consultasHoy >= limite) {
      return NextResponse.json({
        error: `Límite diario alcanzado (${consultasHoy}/${limite} consultas). Se reinicia a medianoche.`
      }, { status: 429 })
    }

    // ── Filtros por rol (inyectados en el contexto del prompt) ───────────────
    let filtroRol = ''
    if (rol === 'supervisor') {
      filtroRol = '-- IMPORTANTE: Solo datos del supervisor actual. Aplica filtro por autor_id cuando sea relevante.'
    } else if (rol === 'cliente') {
      filtroRol = '-- IMPORTANTE: Solo datos del cliente del usuario. Aplica filtro WHERE cliente_id = (su cliente_id).'
    }

    let sql: string | null = null
    let explicacion = ''
    let tokensInput = 0
    let tokensOutput = 0

    // ── Query rápida predefinida (sin LLM) ───────────────────────────────────
    if (queryRapida && QUERIES_RAPIDAS[queryRapida]) {
      sql = QUERIES_RAPIDAS[queryRapida]
      explicacion = ({
        eventos_hoy:     'Eventos registrados hoy por tipo',
        novedades:       'Últimas novedades reportadas',
        eventos_semana:  'Eventos de los últimos 7 días por tipo',
        ultimos_eventos: 'Los 10 eventos más recientes',
      } as Record<string, string>)[queryRapida] ?? 'Consulta predefinida'
      tokensInput = 0
      tokensOutput = 0
    } else {
      // ── Text-to-SQL con Claude Haiku ────────────────────────────────────────
      const userPrompt = filtroRol
        ? `${filtroRol}\n\nPregunta: ${pregunta}`
        : `Pregunta: ${pregunta}`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      })

      tokensInput  = response.usage.input_tokens
      tokensOutput = response.usage.output_tokens

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''

      try {
        // Parsear JSON de la respuesta
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          sql         = parsed.sql ?? null
          explicacion = parsed.explicacion ?? ''
        }
      } catch {
        return NextResponse.json({ error: 'Error procesando respuesta del modelo' }, { status: 500 })
      }
    }

    // ── Ejecutar SQL en Supabase ─────────────────────────────────────────────
    let rows: any[] = []
    let sqlError = null

    if (sql) {
      // Validación básica: solo SELECT
      const sqlClean = sql.trim().toUpperCase()
      if (!sqlClean.startsWith('SELECT')) {
        return NextResponse.json({ error: 'Solo se permiten consultas de lectura' }, { status: 400 })
      }

      const { data, error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        sqlError = error.message
      } else {
        rows = (data as any)?.rows ?? []
      }
    }

    // ── Registrar uso en ia_usage ────────────────────────────────────────────
    await supabase.rpc('registrar_uso_ia', {
      p_usuario_id:    usuario.id,
      p_tokens_input:  tokensInput,
      p_tokens_output: tokensOutput,
      p_modelo:        'haiku',
    })

    return NextResponse.json({
      sql,
      explicacion,
      rows,
      sqlError,
      meta: {
        consultasHoy: consultasHoy + 1,
        limite,
        rol,
        tokensInput,
        tokensOutput,
      }
    })

  } catch (err: any) {
    console.error('Chat IA error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
