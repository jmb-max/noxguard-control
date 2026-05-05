'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ContextoOperativo, { EMPTY_CONTEXTO, validarContexto, type ContextoValue } from '@/components/ContextoOperativo'

interface Props { userId: string; userEmail: string }

const inp: React.CSSProperties = { background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 8, padding: '10px 12px', color: '#0B1D3A', fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

function Section({ num, icon, title, children }: { num: number; icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 12, boxShadow: '0 2px 8px rgba(11,29,58,0.08)', marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #D0D9E8', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(90deg,#FFF7F4 0%,white 100%)' }}>
        <div style={{ width: 24, height: 24, background: '#F05A28', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{num}</div>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}
function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#3D5277' }}>{label}{req && <span style={{ color: '#F05A28', marginLeft: 2 }}>*</span>}</label>{children}</div>
}
function G2({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div> }
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <div style={{ display: 'flex', gap: 8 }}>{[true, false].map(v => <button key={String(v)} type="button" onClick={() => onChange(v)} style={{ flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: `1.5px solid ${value === v ? (v ? '#15803D' : '#DC2626') : '#D0D9E8'}`, background: value === v ? (v ? '#DCFCE7' : '#FEE2E2') : '#F4F1EB', color: value === v ? (v ? '#15803D' : '#DC2626') : '#7A90B0' }}>{v ? '✓ SÍ' : '✕ NO'}</button>)}</div>
}
interface Photo { preview: string; name: string }
function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: Photo | null; onChange: (v: Photo | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const h = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onChange({ preview: ev.target?.result as string, name: f.name }); r.readAsDataURL(f) }
  return <Field label={label}>{value ? (<div style={{ position: 'relative' }}><img src={value.preview} alt={id} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #15803D', display: 'block' }} /><button type="button" onClick={() => onChange(null)} style={{ position: 'absolute', top: 4, right: 4, background: '#DC2626', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>✕</button></div>) : (<><div onClick={() => ref.current?.click()} style={{ border: '2px dashed #D0D9E8', borderRadius: 8, background: '#F4F1EB', height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 3 }}><span style={{ fontSize: 18 }}>📷</span><span style={{ fontSize: 10, color: '#7A90B0', fontWeight: 600 }}>Adjuntar</span></div><input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={h} /></>)}</Field>
}

export default function RondaIngenioForm({ userId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<ContextoValue>(EMPTY_CONTEXTO)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasFirma, setHasFirma] = useState(false)

  const [f, setF] = useState({
    fechaHora: localISO,
    placaUnidad: '', cedulaGuarda: '', nombreGuarda: '', celular: '', ubicacion: '',
    codigoQR: '', fechaHoraEscaneo: localISO,
    riesgos: '', novedadControl: '', observacionesGenerales: '',
  })
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({ fotoEscenario: null, fotoAdicional: null })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))

  const req = [f.placaUnidad, f.cedulaGuarda, f.nombreGuarda, f.codigoQR, f.riesgos, f.novedadControl]
  const progreso = Math.round(req.filter(Boolean).length / req.length * 100)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#0B1D3A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    let drawing = false
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (e instanceof TouchEvent) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
    }
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const draw = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasFirma(true) }
    const end = () => { drawing = false }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', end)
    return () => { canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', draw); canvas.removeEventListener('mouseup', end); canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', end) }
  }, [submitted])

  const clearFirma = () => { const canvas = canvasRef.current; if (!canvas) return; canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setHasFirma(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ctxErr = validarContexto(ctx)
    if (ctxErr) { alert(ctxErr); return }
    setLoading(true)
    const firmaData = hasFirma ? canvasRef.current?.toDataURL() : null
    const { error } = await supabase.from('ronda_ingenio').insert({
      form_no: formNo, guard_id: userId,
      fecha_hora: f.fechaHora, placa_unidad: f.placaUnidad,
      cedula_guarda: f.cedulaGuarda, nombre_guarda: f.nombreGuarda,
      celular: f.celular, ubicacion: f.ubicacion,
      codigo_qr: f.codigoQR, fecha_hora_escaneo: f.fechaHoraEscaneo,
      riesgos: f.riesgos, novedad_control: f.novedadControl,
      observaciones_generales: f.observacionesGenerales,
      fotos: { fotoEscenario: photos.fotoEscenario?.name || null, fotoAdicional: photos.fotoAdicional?.name || null },
      firma: firmaData ? 'firmado' : null,
      ...ctx,
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>¡Ronda Registrada!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{formNo}</div>
      </div>
      <button onClick={() => window.location.href = '/forms'} style={{ marginTop: 16, width: '100%', padding: 14, background: '#fff', border: '2px solid #0B1D3A', borderRadius: 8, color: '#0B1D3A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Volver al menú</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <a href="/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B1D3A', textDecoration: 'none' }}>← Volver a formularios</a>
      </div>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', margin: 0 }}>Ronda Patrulla Ingenio Risaralda</h1>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '4px 0 0', fontWeight: 500 }}>Escaneo QR por escenario, riesgos y novedades</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0' }}>PROGRESO</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1D3A' }}>{progreso}%</span>
        </div>
        <div style={{ height: 6, background: '#D0D9E8', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progreso}%`, background: progreso === 100 ? '#15803D' : '#F05A28', borderRadius: 99, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      
      <ContextoOperativo value={ctx} onChange={setCtx} />
<Section num={1} icon="👤" title="Datos del Agente">
        <G2>
          <Field label="Fecha y Hora"><input style={inp} type="datetime-local" value={f.fechaHora} onChange={set('fechaHora')} /></Field>
          <Field label="Placa Unidad" req><input style={inp} value={f.placaUnidad} onChange={up('placaUnidad')} placeholder="NUX271" /></Field>
          <Field label="Cédula Guarda" req><input style={inp} value={f.cedulaGuarda} onChange={set('cedulaGuarda')} placeholder="1040843672" /></Field>
          <Field label="Nombre Guarda" req><input style={inp} value={f.nombreGuarda} onChange={set('nombreGuarda')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
          <Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Dirección" /></Field>
        </G2>
      </Section>

      <Section num={2} icon="📍" title="Punto de Control QR">
        <G2>
          <Field label="Código QR" req><input style={inp} value={f.codigoQR} onChange={set('codigoQR')} placeholder="Ej: Entrada La Bodega" /></Field>
          <Field label="Fecha/Hora Escaneo"><input style={inp} type="datetime-local" value={f.fechaHoraEscaneo} onChange={set('fechaHoraEscaneo')} /></Field>
        </G2>
      </Section>

      <Section num={3} icon="📋" title="Reporte del Punto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Riesgos identificados" req>
            <textarea style={ta} value={f.riesgos} onChange={set('riesgos')} placeholder="No se identifica riesgo" />
          </Field>
          <Field label="Novedad de Control" req>
            <textarea style={ta} value={f.novedadControl} onChange={set('novedadControl')} placeholder="Escenario sin novedad" />
          </Field>
          <Field label="Observaciones Generales">
            <textarea style={ta} value={f.observacionesGenerales} onChange={set('observacionesGenerales')} placeholder="Sin novedad al momento" />
          </Field>
        </div>
      </Section>

      <Section num={4} icon="📷" title="Evidencia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <G2>
            <PhotoField id="fotoEscenario" label="Foto del Escenario" value={photos.fotoEscenario} onChange={sp('fotoEscenario')} />
            <PhotoField id="fotoAdicional" label="Foto Adicional" value={photos.fotoAdicional} onChange={sp('fotoAdicional')} />
          </G2>
          <Field label="Firma Digital">
            <div style={{ border: '1.5px solid #D0D9E8', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
              <canvas ref={canvasRef} width={500} height={120} style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#7A90B0' }}>{hasFirma ? '✓ Firma registrada' : 'Firme con el dedo o mouse'}</span>
              {hasFirma && <button type="button" onClick={clearFirma} style={{ background: 'none', border: '1px solid #D0D9E8', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', color: '#7A90B0' }}>Limpiar</button>}
            </div>
          </Field>
        </div>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Ronda →'}
      </button>
    </form>
  )
}
