'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ContextoOperativo, { EMPTY_CONTEXTO, validarContexto, type ContextoValue } from '@/components/ContextoOperativo'

interface Props { userId: string; userEmail: string }
interface Asistente { nombre: string; cargo: string; foto: { preview: string; name: string } | null }
interface Compromiso { tema: string; fecha: string; responsable: string }

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
interface Photo { preview: string; name: string }
function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: Photo | null; onChange: (v: Photo | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const h = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onChange({ preview: ev.target?.result as string, name: f.name }); r.readAsDataURL(f) }
  return <Field label={label}>{value ? (<div style={{ position: 'relative' }}><img src={value.preview} alt={id} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #15803D', display: 'block' }} /><button type="button" onClick={() => onChange(null)} style={{ position: 'absolute', top: 4, right: 4, background: '#DC2626', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>✕</button></div>) : (<><div onClick={() => ref.current?.click()} style={{ border: '2px dashed #D0D9E8', borderRadius: 8, background: '#F4F1EB', height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 3 }}><span style={{ fontSize: 18 }}>📷</span><span style={{ fontSize: 10, color: '#7A90B0', fontWeight: 600 }}>Adjuntar</span></div><input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={h} /></>)}</Field>
}

export default function VisitaClienteForm({ userId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<ContextoValue>(EMPTY_CONTEXTO)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [f, setF] = useState({
    fechaHoraInicio: localISO, fechaHoraFinal: '',
    placaUnidad: '', cedulaCoordinador: '', nombreCoordinador: '', celular: '', ubicacion: '',
    nombreCliente: '', nitCliente: '', personaAtiende: '', cargoPersona: '',
    observaciones: '', calificacionServicio: '',
  })
  const [asistentes, setAsistentes] = useState<Asistente[]>([{ nombre: '', cargo: '', foto: null }])
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({ fotoVisita1: null, fotoVisita2: null })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))

  const req = [f.placaUnidad, f.cedulaCoordinador, f.nombreCoordinador, f.nombreCliente, f.personaAtiende, f.observaciones]
  const progreso = Math.round(req.filter(Boolean).length / req.length * 100)

  const updAsistente = (i: number, k: keyof Asistente, v: string | Photo | null) =>
    setAsistentes(p => p.map((a, idx) => idx === i ? { ...a, [k]: v } : a))
  const updCompromiso = (i: number, k: keyof Compromiso, v: string) =>
    setCompromisos(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ctxErr = validarContexto(ctx)
    if (ctxErr) { alert(ctxErr); return }
    setLoading(true)
    const asistentesData = asistentes.map(a => ({ nombre: a.nombre, cargo: a.cargo, foto: a.foto?.name || null }))
    const { error } = await supabase.from('visita_cliente').insert({
      form_no: formNo, coordinator_id: userId,
      fecha_hora_inicio: f.fechaHoraInicio, fecha_hora_final: f.fechaHoraFinal || null,
      placa_unidad: f.placaUnidad,
      cedula_coordinador: f.cedulaCoordinador, nombre_coordinador: f.nombreCoordinador,
      celular: f.celular, ubicacion: f.ubicacion,
      nombre_cliente: f.nombreCliente, nit_cliente: f.nitCliente,
      persona_atiende: f.personaAtiende, cargo_persona: f.cargoPersona,
      asistentes: asistentesData,
      compromisos: compromisos,
      observaciones: f.observaciones,
      calificacion_servicio: f.calificacionServicio ? parseFloat(f.calificacionServicio) : null,
      fotos: { fotoVisita1: photos.fotoVisita1?.name || null, fotoVisita2: photos.fotoVisita2?.name || null },
      ...ctx,
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>¡Visita Registrada!</div>
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
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', margin: 0 }}>Visita Cliente Operativa</h1>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '4px 0 0', fontWeight: 500 }}>Acta con asistentes, compromisos y firmas</p>
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
<Section num={1} icon="👤" title="Datos del Coordinador">
        <G2>
          <Field label="Fecha/Hora Inicio"><input style={inp} type="datetime-local" value={f.fechaHoraInicio} onChange={set('fechaHoraInicio')} /></Field>
          <Field label="Fecha/Hora Final"><input style={inp} type="datetime-local" value={f.fechaHoraFinal} onChange={set('fechaHoraFinal')} /></Field>
          <Field label="Placa Unidad" req><input style={inp} value={f.placaUnidad} onChange={up('placaUnidad')} placeholder="NUX271" /></Field>
          <Field label="Cédula" req><input style={inp} value={f.cedulaCoordinador} onChange={set('cedulaCoordinador')} placeholder="1040843672" /></Field>
          <Field label="Nombre Coordinador" req><input style={inp} value={f.nombreCoordinador} onChange={set('nombreCoordinador')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Dirección" /></Field>
          </div>
        </G2>
      </Section>

      <Section num={2} icon="🏢" title="Datos del Cliente">
        <G2>
          <Field label="Nombre Cliente" req><input style={inp} value={f.nombreCliente} onChange={set('nombreCliente')} placeholder="Ej: Jerónimo Martín's" /></Field>
          <Field label="NIT / Ubicación"><input style={inp} value={f.nitCliente} onChange={set('nitCliente')} placeholder="Ej: Tienda Ara Plaza Verdi Jamundí" /></Field>
          <Field label="Persona que Atiende" req><input style={inp} value={f.personaAtiende} onChange={set('personaAtiende')} placeholder="Nombre" /></Field>
          <Field label="Cargo"><input style={inp} value={f.cargoPersona} onChange={set('cargoPersona')} placeholder="Ej: JDT" /></Field>
        </G2>
      </Section>

      <Section num={3} icon="👥" title="Asistentes">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7A90B0' }}>Asistentes: {asistentes.length}</span>
          {asistentes.length < 6 && (
            <button type="button" onClick={() => setAsistentes(p => [...p, { nombre: '', cargo: '', foto: null }])}
              style={{ background: '#F05A28', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', cursor: 'pointer' }}>
              + Agregar Asistente
            </button>
          )}
        </div>
        {asistentes.map((a, i) => (
          <div key={i} style={{ background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1D3A', marginBottom: 10 }}>Asistente {i + 1}</div>
            <G2>
              <Field label="Nombre"><input style={inp} value={a.nombre} onChange={e => updAsistente(i, 'nombre', e.target.value)} placeholder="Nombre completo" /></Field>
              <Field label="Cargo"><input style={inp} value={a.cargo} onChange={e => updAsistente(i, 'cargo', e.target.value)} placeholder="Cargo" /></Field>
            </G2>
            <div style={{ marginTop: 10 }}>
              <PhotoField id={`fotoAsistente${i}`} label="Foto" value={a.foto} onChange={v => updAsistente(i, 'foto', v)} />
            </div>
          </div>
        ))}
      </Section>

      <Section num={4} icon="📌" title="Compromisos">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7A90B0' }}>Compromisos: {compromisos.length}</span>
          {compromisos.length < 6 && (
            <button type="button" onClick={() => setCompromisos(p => [...p, { tema: '', fecha: '', responsable: '' }])}
              style={{ background: '#0B1D3A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', cursor: 'pointer' }}>
              + Agregar Compromiso
            </button>
          )}
        </div>
        {compromisos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span style={{ background: '#E8E3D8', borderRadius: 99, padding: '6px 14px', fontSize: 11, color: '#7A90B0', fontWeight: 600 }}>Sin compromisos generados</span>
          </div>
        )}
        {compromisos.map((c, i) => (
          <div key={i} style={{ background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1D3A', marginBottom: 10 }}>Compromiso {i + 1}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Tema"><input style={inp} value={c.tema} onChange={e => updCompromiso(i, 'tema', e.target.value)} placeholder="Descripción del compromiso" /></Field>
              </div>
              <Field label="Fecha Límite"><input style={inp} type="date" value={c.fecha} onChange={e => updCompromiso(i, 'fecha', e.target.value)} /></Field>
              <Field label="Responsable"><input style={inp} value={c.responsable} onChange={e => updCompromiso(i, 'responsable', e.target.value)} placeholder="Nombre" /></Field>
            </div>
          </div>
        ))}
      </Section>

      <Section num={5} icon="📝" title="Observaciones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Observaciones" req>
            <textarea style={ta} value={f.observaciones} onChange={set('observaciones')} placeholder="Ej: Se pasa revista en las instalaciones..." />
          </Field>
          <Field label="Calificación del Servicio (1-5)">
            <input style={inp} type="number" min="1" max="5" step="0.5" value={f.calificacionServicio} onChange={set('calificacionServicio')} placeholder="Ej: 4.5" />
          </Field>
          <G2>
            <PhotoField id="fotoVisita1" label="Foto Visita 1" value={photos.fotoVisita1} onChange={sp('fotoVisita1')} />
            <PhotoField id="fotoVisita2" label="Foto Visita 2" value={photos.fotoVisita2} onChange={sp('fotoVisita2')} />
          </G2>
        </div>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Visita →'}
      </button>
    </form>
  )
}
