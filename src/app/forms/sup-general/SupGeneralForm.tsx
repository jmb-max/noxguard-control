'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ContextoOperativo, { EMPTY_CONTEXTO, validarContexto, type ContextoValue } from '@/components/ContextoOperativo'

interface Props { userId: string; userEmail: string }

const inp: React.CSSProperties = { background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 8, padding: '10px 12px', color: '#0B1D3A', fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, minHeight: 72, resize: 'vertical' as const }

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

const PRESENTACION_LABELS: Record<string, string> = {
  uniforme: 'Uniforme',
  placaApellido: 'Placa / Apellido',
  actitudServicio: 'Actitud de Servicio',
  presentacionPersonal: 'Presentación Personal',
  carnetSuperintencia: 'Carnet Superintendencia',
  carpetaConsignas: 'Carpeta de Consignas',
}

const ELEMENTOS_LABELS: Record<string, string> = {
  linterna: 'Linterna',
  garret: 'Garret',
  espejoVehicular: 'Espejo Vehicular',
}

const EVENTOS_LABELS: Record<string, string> = {
  comunicados: 'Comunicados',
  capacitacion: 'Capacitación',
  novedades: 'Novedades',
  condicionInsegura: 'Condición Insegura',
  actosInseguros: 'Actos Inseguros',
}

export default function SupGeneralForm({ userId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<ContextoValue>(EMPTY_CONTEXTO)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [f, setF] = useState({
    fechaHora: localISO,
    placaUnidad: '', cedulaSupervisor: '', nombreSupervisor: '', celular: '', ubicacion: '',
    numeroPuesto: '', nombreCliente: '', direccion: '', ruta: '', zona: '', unidadSupervision: '',
    nombreGuarda: '', puesto: '',
    novedadesProgramacion: '', observacionesTitular: '', faltasServicio: '', accionesDisciplinarias: '',
    serialArmamento: '', estadoArmamento: '', aseoMantenimiento: '', observacionesArmamento: '', municion: '',
    tipoElemento: 'Celular', estadoMedio: '', serialMedio: '', transmision: '', observacionComunicacion: '',
    observacionesElementos: '', observacionesFinales: '',
  })
  const [presentacion, setPresentacion] = useState<Record<string, boolean>>({})
  const [armamento, setArmamento] = useState(false)
  const [salvoconducto, setSalvoconducto] = useState(false)
  const [comunicaciones, setComunicaciones] = useState(false)
  const [elementos, setElementos] = useState<Record<string, boolean>>({})
  const [eventos, setEventos] = useState<Record<string, boolean>>({})
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({
    fotoArmamento: null, fotoComunicacion: null, fotoEvidencia: null, fotoPresentacion: null,
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))

  const req = [f.placaUnidad, f.cedulaSupervisor, f.nombreSupervisor, f.numeroPuesto, f.nombreCliente, f.nombreGuarda]
  const progreso = Math.round(req.filter(Boolean).length / req.length * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ctxErr = validarContexto(ctx)
    if (ctxErr) { alert(ctxErr); return }
    setLoading(true)
    const { error } = await supabase.from('supervision_general').insert({
      form_no: formNo, supervisor_id: userId,
      fecha_hora: f.fechaHora, placa_unidad: f.placaUnidad,
      cedula_supervisor: f.cedulaSupervisor, nombre_supervisor: f.nombreSupervisor,
      celular: f.celular, ubicacion: f.ubicacion,
      numero_puesto: f.numeroPuesto, nombre_cliente: f.nombreCliente,
      direccion: f.direccion, ruta: f.ruta, zona: f.zona,
      unidad_supervision: f.unidadSupervision,
      nombre_guarda: f.nombreGuarda, puesto: f.puesto,
      novedades_programacion: f.novedadesProgramacion,
      observaciones_titular: f.observacionesTitular,
      faltas_servicio: f.faltasServicio,
      acciones_disciplinarias: f.accionesDisciplinarias,
      presentacion: presentacion,
      armamento: armamento,
      serial_armamento: f.serialArmamento, estado_armamento: f.estadoArmamento,
      salvoconducto: salvoconducto,
      aseo_mantenimiento: f.aseoMantenimiento,
      observaciones_armamento: f.observacionesArmamento,
      municion: f.municion,
      comunicaciones: comunicaciones,
      tipo_elemento: f.tipoElemento, estado_medio: f.estadoMedio,
      serial_medio: f.serialMedio, transmision: f.transmision,
      observacion_comunicacion: f.observacionComunicacion,
      elementos: elementos,
      eventos: eventos,
      observaciones_finales: f.observacionesFinales,
      fotos: {
        fotoArmamento: photos.fotoArmamento?.name || null,
        fotoComunicacion: photos.fotoComunicacion?.name || null,
        fotoEvidencia: photos.fotoEvidencia?.name || null,
        fotoPresentacion: photos.fotoPresentacion?.name || null,
      },
      ...ctx,
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>¡Supervisión Registrada!</div>
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
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', margin: 0 }}>Supervisión General</h1>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '4px 0 0', fontWeight: 500 }}>Armamento, comunicaciones, uniforme y actitud</p>
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
<Section num={1} icon="👤" title="Datos del Supervisor">
        <G2>
          <Field label="Fecha y Hora"><input style={inp} type="datetime-local" value={f.fechaHora} onChange={set('fechaHora')} /></Field>
          <Field label="Placa Unidad" req><input style={inp} value={f.placaUnidad} onChange={up('placaUnidad')} placeholder="NUX271" /></Field>
          <Field label="Cédula" req><input style={inp} value={f.cedulaSupervisor} onChange={set('cedulaSupervisor')} placeholder="1040843672" /></Field>
          <Field label="Nombre Supervisor" req><input style={inp} value={f.nombreSupervisor} onChange={set('nombreSupervisor')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
          <Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Dirección" /></Field>
        </G2>
      </Section>

      <Section num={2} icon="🏢" title="Datos del Puesto">
        <G2>
          <Field label="N° Puesto" req><input style={inp} value={f.numeroPuesto} onChange={set('numeroPuesto')} placeholder="001" /></Field>
          <Field label="Nombre Cliente" req><input style={inp} value={f.nombreCliente} onChange={set('nombreCliente')} placeholder="Tienda ARA" /></Field>
          <Field label="Dirección"><input style={inp} value={f.direccion} onChange={set('direccion')} placeholder="Calle 20 # 7-40" /></Field>
          <Field label="Ruta"><input style={inp} value={f.ruta} onChange={up('ruta')} placeholder="RUTA A" /></Field>
          <Field label="Zona"><input style={inp} value={f.zona} onChange={set('zona')} placeholder="Norte" /></Field>
          <Field label="Unidad Supervisión"><input style={inp} value={f.unidadSupervision} onChange={up('unidadSupervision')} placeholder="MOTO 01" /></Field>
          <Field label="Nombre Guarda" req><input style={inp} value={f.nombreGuarda} onChange={set('nombreGuarda')} placeholder="Carlos López" /></Field>
          <Field label="Puesto"><input style={inp} value={f.puesto} onChange={set('puesto')} placeholder="Ej: Recorredor, Portero" /></Field>
        </G2>
      </Section>

      <Section num={3} icon="📋" title="Novedades del Servicio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Novedades de Programación"><textarea style={ta} value={f.novedadesProgramacion} onChange={set('novedadesProgramacion')} placeholder="Sin novedad" /></Field>
          <Field label="Observaciones del Titular"><textarea style={ta} value={f.observacionesTitular} onChange={set('observacionesTitular')} placeholder="Sin novedad" /></Field>
          <Field label="Faltas de Servicio"><textarea style={ta} value={f.faltasServicio} onChange={set('faltasServicio')} placeholder="Sin novedad" /></Field>
          <Field label="Acciones Disciplinarias"><textarea style={ta} value={f.accionesDisciplinarias} onChange={set('accionesDisciplinarias')} placeholder="Sin novedad" /></Field>
        </div>
      </Section>

      <Section num={4} icon="👮" title="Presentación Personal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(PRESENTACION_LABELS).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A', flex: 1 }}>{label}</span>
              <div style={{ width: 200 }}>
                <Toggle value={!!presentacion[k]} onChange={v => setPresentacion(p => ({ ...p, [k]: v }))} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section num={5} icon="🔫" title="Armamento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="¿Porta Armamento?"><Toggle value={armamento} onChange={setArmamento} /></Field>
          {armamento && (
            <>
              <G2>
                <Field label="Serial Armamento"><input style={inp} value={f.serialArmamento} onChange={set('serialArmamento')} /></Field>
                <Field label="Estado Armamento"><input style={inp} value={f.estadoArmamento} onChange={set('estadoArmamento')} placeholder="ok" /></Field>
                <Field label="¿Salvoconducto?"><Toggle value={salvoconducto} onChange={setSalvoconducto} /></Field>
                <Field label="Aseo y Mantenimiento"><input style={inp} value={f.aseoMantenimiento} onChange={set('aseoMantenimiento')} placeholder="ok" /></Field>
                <Field label="Munición"><input style={inp} value={f.municion} onChange={set('municion')} placeholder="ok" /></Field>
              </G2>
              <Field label="Observaciones Armamento">
                <textarea style={ta} value={f.observacionesArmamento} onChange={set('observacionesArmamento')} placeholder="Sin novedad" />
              </Field>
              <PhotoField id="fotoArmamento" label="Foto Armamento" value={photos.fotoArmamento} onChange={sp('fotoArmamento')} />
            </>
          )}
        </div>
      </Section>

      <Section num={6} icon="📱" title="Comunicaciones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="¿Porta Comunicaciones?"><Toggle value={comunicaciones} onChange={setComunicaciones} /></Field>
          {comunicaciones && (
            <>
              <G2>
                <Field label="Tipo de Elemento">
                  <select style={inp} value={f.tipoElemento} onChange={set('tipoElemento')}>
                    <option value="Celular">Celular</option>
                    <option value="Radio">Radio</option>
                    <option value="Otro">Otro</option>
                  </select>
                </Field>
                <Field label="Estado Medio"><input style={inp} value={f.estadoMedio} onChange={set('estadoMedio')} placeholder="ok" /></Field>
                <Field label="Serial Medio"><input style={inp} value={f.serialMedio} onChange={set('serialMedio')} /></Field>
                <Field label="Transmisión"><input style={inp} value={f.transmision} onChange={set('transmision')} placeholder="ok" /></Field>
              </G2>
              <Field label="Observación Comunicación">
                <textarea style={ta} value={f.observacionComunicacion} onChange={set('observacionComunicacion')} placeholder="Sin novedad" />
              </Field>
              <PhotoField id="fotoComunicacion" label="Foto Comunicación" value={photos.fotoComunicacion} onChange={sp('fotoComunicacion')} />
            </>
          )}
        </div>
      </Section>

      <Section num={7} icon="🔦" title="Elementos del Servicio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(ELEMENTOS_LABELS).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A', flex: 1 }}>{label}</span>
              <div style={{ width: 200 }}>
                <Toggle value={!!elementos[k]} onChange={v => setElementos(p => ({ ...p, [k]: v }))} />
              </div>
            </div>
          ))}
          <Field label="Observaciones Elementos">
            <textarea style={ta} value={f.observacionesElementos} onChange={set('observacionesElementos')} placeholder="Sin novedad" />
          </Field>
        </div>
      </Section>

      <Section num={8} icon="📝" title="Eventos y Observaciones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(EVENTOS_LABELS).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A', flex: 1 }}>{label}</span>
              <div style={{ width: 200 }}>
                <Toggle value={!!eventos[k]} onChange={v => setEventos(p => ({ ...p, [k]: v }))} />
              </div>
            </div>
          ))}
          <Field label="Observaciones Finales">
            <textarea style={ta} value={f.observacionesFinales} onChange={set('observacionesFinales')} placeholder="Sin novedad" />
          </Field>
          <G2>
            <PhotoField id="fotoEvidencia" label="Foto Evidencia" value={photos.fotoEvidencia} onChange={sp('fotoEvidencia')} />
            <PhotoField id="fotoPresentacion" label="Foto Presentación" value={photos.fotoPresentacion} onChange={sp('fotoPresentacion')} />
          </G2>
        </div>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Supervisión →'}
      </button>
    </form>
  )
}
