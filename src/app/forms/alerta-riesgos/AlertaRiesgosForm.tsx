'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#3D5277' }}>{label}{req && <span style={{ color: '#F05A28', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  )
}

function G2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

interface Photo { preview: string; name: string }
function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: Photo | null; onChange: (v: Photo | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const h = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = (ev) => onChange({ preview: ev.target?.result as string, name: f.name }); r.readAsDataURL(f)
  }
  return (
    <Field label={label}>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value.preview} alt={id} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #15803D', display: 'block' }} />
          <button type="button" onClick={() => onChange(null)} style={{ position: 'absolute', top: 4, right: 4, background: '#DC2626', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <>
          <div onClick={() => ref.current?.click()} style={{ border: '2px dashed #D0D9E8', borderRadius: 8, background: '#F4F1EB', height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 3 }}>
            <span style={{ fontSize: 18 }}>📷</span><span style={{ fontSize: 10, color: '#7A90B0', fontWeight: 600 }}>Adjuntar</span>
          </div>
          <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={h} />
        </>
      )}
    </Field>
  )
}

export default function AlertaRiesgosForm({ userId, userEmail }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasFirma, setHasFirma] = useState(false)

  const [f, setF] = useState({
    usuarioGestor: userEmail, fechaElaboracion: new Date().toISOString().split('T')[0],
    placaVeh: '', cedulaGuarda: '', nombreGuarda: '', celular: '', ubicacion: '',
    nombreCliente: '', nombrePuesto: '', nombreSupervisor: '', cedulaSupervisor: '',
    identificacionRiesgo: '', descripcionAlerta: '', recomendaciones: '',
  })
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({ fotoRiesgo1: null, fotoRiesgo2: null })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.strokeStyle = '#0B1D3A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    let drawing = false
    const pos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect()
      if (e instanceof TouchEvent) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top }
    }
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const draw = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasFirma(true) }
    const end = () => { drawing = false }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', end)
    return () => {
      canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', draw); canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', end)
    }
  }, [submitted])

  const clearFirma = () => { const c = canvasRef.current; if (!c) return; c.getContext('2d')?.clearRect(0, 0, c.width, c.height); setHasFirma(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('alertas_riesgos').insert({
      form_no: formNo, guard_id: userId,
      usuario_gestor: f.usuarioGestor, fecha_elaboracion: f.fechaElaboracion,
      placa_veh: f.placaVeh, cedula_guarda: f.cedulaGuarda, nombre_guarda: f.nombreGuarda,
      celular: f.celular, ubicacion: f.ubicacion,
      nombre_cliente: f.nombreCliente, nombre_puesto: f.nombrePuesto,
      nombre_supervisor: f.nombreSupervisor, cedula_supervisor: f.cedulaSupervisor,
      identificacion_riesgo: f.identificacionRiesgo, descripcion_alerta: f.descripcionAlerta,
      recomendaciones: f.recomendaciones,
      firma: hasFirma ? 'firmado' : 'sin-firma',
      fotos: { foto1: photos.fotoRiesgo1?.name || null, foto2: photos.fotoRiesgo2?.name || null },
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>¡Alerta Registrada!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{new Date().toLocaleString('es-CO')}</div>
      </div>
      <button onClick={() => setSubmitted(false)} style={{ marginTop: 16, width: '100%', padding: 14, background: '#fff', border: '2px solid #0B1D3A', borderRadius: 8, color: '#0B1D3A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Volver al menú</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>

      <div style={{ marginBottom: 16 }}>
        <a href="/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B1D3A', textDecoration: 'none' }}>
          ← Volver a formularios
        </a>
      </div>

      <Section num={1} icon="👤" title="Datos Generales">
        <G2>
          <Field label="Usuario Gestor" req><input style={inp} value={f.usuarioGestor} onChange={set('usuarioGestor')} /></Field>
          <Field label="Fecha Elaboración"><input style={inp} type="date" value={f.fechaElaboracion} onChange={set('fechaElaboracion')} /></Field>
          <Field label="Placa del Vehículo" req><input style={inp} value={f.placaVeh} onChange={up('placaVeh')} placeholder="NUX271" /></Field>
          <Field label="Cédula" req><input style={inp} value={f.cedulaGuarda} onChange={set('cedulaGuarda')} placeholder="1040843672" /></Field>
          <Field label="Nombres y Apellidos" req><input style={inp} value={f.nombreGuarda} onChange={set('nombreGuarda')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
        </G2>
        <div style={{ marginTop: 12 }}><Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Dirección del puesto" /></Field></div>
      </Section>

      <Section num={2} icon="🏢" title="Datos del Puesto">
        <G2>
          <Field label="Nombre del Cliente y Operación" req><input style={inp} value={f.nombreCliente} onChange={set('nombreCliente')} placeholder="Cliente ABC" /></Field>
          <Field label="Nombre del Puesto" req><input style={inp} value={f.nombrePuesto} onChange={set('nombrePuesto')} placeholder="Puesto Norte" /></Field>
          <Field label="Nombre Supervisor / Ejecutivo" req><input style={inp} value={f.nombreSupervisor} onChange={set('nombreSupervisor')} placeholder="Carlos Pérez" /></Field>
          <Field label="Cédula Supervisor"><input style={inp} value={f.cedulaSupervisor} onChange={set('cedulaSupervisor')} placeholder="1234567890" /></Field>
        </G2>
      </Section>

      <Section num={3} icon="⚠️" title="Alerta de Riesgo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Identificación del Riesgo Encontrado" req>
            <input style={inp} value={f.identificacionRiesgo} onChange={set('identificacionRiesgo')} placeholder="Ej: Zona sin iluminación en acceso norte" />
          </Field>
          <Field label="Descripción de la Alerta de Riesgo" req>
            <textarea style={ta} value={f.descripcionAlerta} onChange={set('descripcionAlerta')} placeholder="Describir detalladamente el riesgo observado..." />
          </Field>
          <Field label="Recomendaciones">
            <textarea style={ta} value={f.recomendaciones} onChange={set('recomendaciones')} placeholder="Acciones sugeridas para mitigar el riesgo..." />
          </Field>
        </div>
      </Section>

      <Section num={4} icon="📷" title="Evidencia y Firma">
        <G2>
          <PhotoField id="fotoRiesgo1" label="Foto de evidencia 1" value={photos.fotoRiesgo1} onChange={sp('fotoRiesgo1')} />
          <PhotoField id="fotoRiesgo2" label="Foto de evidencia 2" value={photos.fotoRiesgo2} onChange={sp('fotoRiesgo2')} />
        </G2>
        <div style={{ marginTop: 14 }}>
          <Field label="Firma del Guarda">
            <div style={{ border: '1.5px solid #D0D9E8', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
              <canvas ref={canvasRef} width={500} height={110} style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#7A90B0' }}>{hasFirma ? '✓ Firma registrada' : 'Firme con el dedo'}</span>
              {hasFirma && <button type="button" onClick={clearFirma} style={{ background: 'none', border: '1px solid #D0D9E8', borderRadius: 6, padding: '2px 10px', fontSize: 11, cursor: 'pointer', color: '#7A90B0' }}>Limpiar</button>}
            </div>
          </Field>
        </div>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Alerta →'}
      </button>
    </form>
  )
}
