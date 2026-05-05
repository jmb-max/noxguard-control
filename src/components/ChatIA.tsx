'use client'
/**
 * ChatIA — Widget flotante de consulta conversacional.
 * Esquina inferior derecha, siempre visible en el dashboard.
 * Guardas no tienen acceso (el API Route lo bloquea y aquí también se oculta).
 */

import { useState, useRef, useEffect } from 'react'

interface Mensaje {
  id: string
  tipo: 'user' | 'assistant' | 'error'
  texto: string
  rows?: Record<string, any>[]
  sql?: string
  timestamp: Date
}

interface Props {
  userRol: string
  userName: string
}

const BOTONES_RAPIDOS = [
  { key: 'eventos_hoy',    label: '📊 Eventos hoy' },
  { key: 'novedades',      label: '⚠️ Novedades' },
  { key: 'eventos_semana', label: '📅 Esta semana' },
  { key: 'ultimos_eventos',label: '🕐 Últimos registros' },
]

const SUGERENCIAS = [
  '¿Cuántos eventos tuvo ARA esta semana?',
  '¿Qué puesto tiene más novedades?',
  '¿Cuál fue el último reporte en Urgencias?',
  '¿Cuántas inspecciones de contenedor en abril?',
  '¿Qué guardas han reportado hoy?',
]

export default function ChatIA({ userRol, userName }: Props) {
  // Guardas no ven el widget
  if (userRol === 'guarda') return null

  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [consultasHoy, setConsultasHoy] = useState(0)
  const [limite, setLimite] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Mensaje de bienvenida al abrir
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([{
        id: 'bienvenida',
        tipo: 'assistant',
        texto: `Hola ${userName.split(' ')[0]} 👋 Soy tu asistente de datos. Puedo responder preguntas sobre eventos, novedades, guardas y puestos. ¿Qué quieres saber?`,
        timestamp: new Date(),
      }])
    }
  }, [abierto])

  const enviar = async (pregunta: string, queryRapida?: string) => {
    if (!pregunta.trim() && !queryRapida) return
    if (cargando) return

    const msgUser: Mensaje = {
      id: Date.now().toString(),
      tipo: 'user',
      texto: pregunta || BOTONES_RAPIDOS.find(b => b.key === queryRapida)?.label || '',
      timestamp: new Date(),
    }
    setMensajes(prev => [...prev, msgUser])
    setInput('')
    setCargando(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, queryRapida }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMensajes(prev => [...prev, {
          id: Date.now().toString(),
          tipo: 'error',
          texto: data.error ?? 'Error al consultar',
          timestamp: new Date(),
        }])
        return
      }

      setConsultasHoy(data.meta?.consultasHoy ?? 0)
      setLimite(data.meta?.limite ?? 0)

      const msgBot: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: 'assistant',
        texto: data.sqlError
          ? `⚠️ Error en la consulta: ${data.sqlError}`
          : data.explicacion || 'Aquí están los resultados:',
        rows: data.rows,
        sql: data.sql ?? undefined,
        timestamp: new Date(),
      }
      setMensajes(prev => [...prev, msgBot])

    } catch {
      setMensajes(prev => [...prev, {
        id: Date.now().toString(),
        tipo: 'error',
        texto: 'Error de conexión. Intenta de nuevo.',
        timestamp: new Date(),
      }])
    } finally {
      setCargando(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar(input)
    }
  }

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: abierto ? '#F05A28' : '#0B1D3A',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(11,29,58,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'all 0.2s',
          color: '#fff',
        }}
        title="Chat IA — Consulta tus datos"
      >
        {abierto ? '✕' : '🤖'}
      </button>

      {/* ── Panel del chat ── */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 400, height: 560,
          background: '#fff',
          border: '1px solid #D0D9E8',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(11,29,58,0.18)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Outfit, sans-serif',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: '#0B1D3A',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Asistente NoxGuard</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                  {limite > 0
                    ? `${consultasHoy}/${limite} consultas hoy`
                    : 'Consultas ilimitadas'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMensajes([])}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}
              title="Limpiar conversación"
            >
              🗑️ Limpiar
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mensajes.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.tipo === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '9px 13px',
                  borderRadius: m.tipo === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.tipo === 'user' ? '#0B1D3A' : m.tipo === 'error' ? '#FEE2E2' : '#F4F1EB',
                  color: m.tipo === 'user' ? '#fff' : m.tipo === 'error' ? '#DC2626' : '#0B1D3A',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  {m.texto}
                </div>

                {/* Tabla de resultados */}
                {m.rows && m.rows.length > 0 && (
                  <div style={{ width: '100%', marginTop: 6, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#F4F1EB' }}>
                          {Object.keys(m.rows[0]).map(k => (
                            <th key={k} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, color: '#0B1D3A', borderBottom: '1px solid #D0D9E8', whiteSpace: 'nowrap' }}>
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.rows.slice(0, 15).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #E8E3D8', background: i % 2 === 0 ? '#fff' : '#FAF9F5' }}>
                            {Object.values(row).map((v: any, j) => (
                              <td key={j} style={{ padding: '4px 8px', color: '#3D5277', whiteSpace: 'nowrap' }}>
                                {v === null ? '—' : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : typeof v === 'number' ? v.toLocaleString('es-CO') : String(v).slice(0, 40)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {m.rows.length > 15 && (
                      <div style={{ fontSize: 10, color: '#A0AFC4', padding: '4px 8px' }}>
                        Mostrando 15 de {m.rows.length} resultados
                      </div>
                    )}
                  </div>
                )}

                {/* Sin resultados */}
                {m.rows && m.rows.length === 0 && !m.texto.includes('Error') && (
                  <div style={{ fontSize: 11, color: '#A0AFC4', marginTop: 4, padding: '0 2px' }}>
                    Sin resultados para ese período.
                  </div>
                )}

                <div style={{ fontSize: 9, color: '#A0AFC4', marginTop: 3, padding: '0 2px' }}>
                  {m.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {cargando && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#F4F1EB', borderRadius: '14px 14px 14px 4px', width: 'fit-content' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#7A90B0',
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Botones rápidos */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #F0EDE6', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BOTONES_RAPIDOS.map(b => (
              <button
                key={b.key}
                onClick={() => enviar(b.label, b.key)}
                disabled={cargando}
                style={{
                  padding: '4px 10px', borderRadius: 99, border: '1px solid #D0D9E8',
                  background: '#fff', color: '#3D5277', fontSize: 10, fontWeight: 600,
                  cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.5 : 1,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Sugerencia aleatoria como placeholder */}
          <div style={{ padding: '0 14px 10px', display: 'flex', gap: 8 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={SUGERENCIAS[Math.floor(Date.now() / 10000) % SUGERENCIAS.length]}
              rows={2}
              disabled={cargando}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #D0D9E8', borderRadius: 10,
                padding: '8px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif',
                color: '#0B1D3A', outline: 'none', background: '#F9F8F5',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={() => enviar(input)}
              disabled={cargando || !input.trim()}
              style={{
                width: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !cargando ? '#F05A28' : '#D0D9E8',
                color: '#fff', cursor: input.trim() && !cargando ? 'pointer' : 'not-allowed',
                fontSize: 16, transition: 'background 0.2s',
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
