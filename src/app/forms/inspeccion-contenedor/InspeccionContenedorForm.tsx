'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { userId: string; userEmail: string }

// ─── helpers UI ───────────────────────────────────────────────────────────────
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
      <label style={{ fontSize: 11, fontWeight: 600, color: '#3D5277' }}>
        {label}{req && <span style={{ color: '#F05A28', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>{children}</div>
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          style={{
            flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            border: `1.5px solid ${value === v ? (v ? '#15803D' : '#DC2626') : '#D0D9E8'}`,
            background: value === v ? (v ? '#DCFCE7' : '#FEE2E2') : '#F4F1EB',
            color: value === v ? (v ? '#15803D' : '#DC2626') : '#7A90B0',
          }}>
          {v ? '✓ SÍ' : '✕ NO'}
        </button>
      ))}
    </div>
  )
}

interface PhotoState { preview: string; name: string }

function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: PhotoState | null; onChange: (v: PhotoState | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ preview: ev.target?.result as string, name: file.name })
    reader.readAsDataURL(file)
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
            <span style={{ fontSize: 18 }}>📷</span>
            <span style={{ fontSize: 10, color: '#7A90B0', fontWeight: 600 }}>Adjuntar</span>
          </div>
          <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleChange} />
        </>
      )}
    </Field>
  )
}

function InspBlock({ title, enabled, onToggle, hiId, hfId, durId, obsId, fotoId, hiVal, hfVal, durVal, obsVal, fotoVal, onHi, onHf, onObs, onFoto }:
  { title: string; enabled: boolean; onToggle: (v: boolean) => void; hiId: string; hfId: string; durId: string; obsId: string; fotoId: string;
    hiVal: string; hfVal: string; durVal: string; obsVal: string; fotoVal: PhotoState | null; onHi: (v: string) => void; onHf: (v: string) => void;
    onObs: (v: string) => void; onFoto: (v: PhotoState | null) => void }) {
  const calcDur = (a: string, b: string) => {
    if (!a || !b) return '--'
    const [h1, m1] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number)
    const d = (h2 * 60 + m2) - (h1 * 60 + m1); return d >= 0 ? `${d} min` : '--'
  }
  return (
    <div style={{ background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1D3A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 3, height: 13, background: '#F05A28', borderRadius: 2 }} />
        {title}
      </div>
      <Field label="Realizada"><Toggle value={enabled} onChange={onToggle} /></Field>
      {enabled && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <Field label="Hora Inicio">
              <input type="time" value={hiVal} onChange={e => { onHi(e.target.value); }} style={inp} />
            </Field>
            <Field label="Hora Término">
              <input type="time" value={hfVal} onChange={e => onHf(e.target.value)} style={inp} />
            </Field>
            <Field label="Duración">
              <input readOnly value={calcDur(hiVal, hfVal)} style={{ ...inp, color: '#7A90B0', background: '#E8E3D8' }} />
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea value={obsVal} onChange={e => onObs(e.target.value)} placeholder="Sin novedades" style={{ ...inp, minHeight: 60, resize: 'vertical' as const }} />
          </Field>
          <div style={{ marginTop: 10 }}>
            <PhotoField id={fotoId} label={`Foto — ${title}`} value={fotoVal} onChange={onFoto} />
          </div>
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = { background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 8, padding: '10px 12px', color: '#0B1D3A', fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, minHeight: 72, resize: 'vertical' as const }

// ─── componente principal ──────────────────────────────────────────────────────
export default function InspeccionContenedorForm({ userId, userEmail }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signing, setSigning] = useState(false)
  const [hasFirma, setHasFirma] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  // campos texto
  const [f, setF] = useState({
    usuarioGestor: userEmail, fechaElaboracion: new Date().toISOString().split('T')[0],
    placaVeh: '', cedulaConductor: '', nombreConductor: '', celularConductor: '', ubicacion: '',
    tamano: '40', numContenedor: '',
    numSelloBottella: '', numSelloSticker: '', numSelloGuaya: '',
    numSelloBottellaAsignado: '', numSelloBottellaAdicional: '',
    selloSatelital: true, numDispositivoSatelital: '',
    selloRecibido: true,
    lugarLlenado: '', muelle: '',
    // Inspección técnica
    apellidosInspTecnico: '', nombresInspTecnico: '', docInspTecnico: '',
    // Empresa transportadora
    empresaTransp: '', marcaVehiculo: '', placaRemolque: '',
    // Binomio canino
    canNombre: '', canRaza: '', microchipCan: '', guiaNombre: '', guiaApellidos: '', guiaCedula: '',
    // Inspecciones
    insp_vehiculo: true, insp_veh_hi: '', insp_veh_hf: '', insp_veh_obs: '',
    insp_contenedor: true, insp_cont_hi: '', insp_cont_hf: '', insp_cont_obs: '',
    insp_mercancia: true, insp_merc_hi: '', insp_merc_hf: '', insp_merc_obs: '',
    // Llenado
    horaInicioLlenado: '', horaFinLlenado: '', responsableLlenado: '', docResponsable: '', obsFinal: '',
    // Cierre
    fechaSalida: new Date().toISOString().split('T')[0], guiaResponsable: '',
  })

  // fotos
  const [photos, setPhotos] = useState<Record<string, PhotoState | null>>({
    fotoNumContenedor: null, fotoSelloBottella: null, fotoSelloSticker: null,
    fotoSelloGuaya: null, fotoSelloBottellaAsignado: null, fotoSelloSatelitalRecibo: null,
    fotoSelloAdicional: null, fotoSelloRecibido: null,
    fotoPlacaCabezote: null, fotoParteDelantera: null, fotoGeneralContVeh: null,
    fotoParteTrasera: null, fotoContenedorVacioAbierto: null,
    fotoUniCan: null, fotoPlacaVeh: null, fotoPlacaCont: null,
    fotoInspVeh: null, fotoInspCont: null, fotoInspMerc: null, fotoMercancia: null,
    fotoInicioCargue: null, fotoMitadCargue: null, fotoFinCargue: null, fotoCuadrilla: null,
    fotoCC1: null, fotoCC2: null, fotoSSFinal: null, fotoDispInt: null,
    fotoTodosSellos: null, fotoConductorVehiculo: null,
  })
  const sp = (k: string) => (v: PhotoState | null) => setPhotos(p => ({ ...p, [k]: v }))
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const tog = (k: string) => (v: boolean) => setF(p => ({ ...p, [k]: v }))

  const photoCount = Object.values(photos).filter(Boolean).length

  // GPS
  const captureGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false) },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }

  // Firma digital
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#0B1D3A'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    let drawing = false
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (e instanceof TouchEvent) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
    }
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing = true; setSigning(true); const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const draw = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasFirma(true) }
    const end = () => { drawing = false }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', end)
    return () => {
      canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', draw); canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', end)
    }
  }, [submitted])

  const clearFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); setHasFirma(false); setSigning(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const firmaData = hasFirma ? canvasRef.current?.toDataURL() : null
    const photoMeta: Record<string, string> = {}
    Object.entries(photos).forEach(([k, v]) => { if (v) photoMeta[k] = v.name })
    const { error } = await supabase.from('inspecciones_contenedor').insert({
      form_no: formNo, guard_id: userId,
      usuario_gestor: f.usuarioGestor, fecha_elaboracion: f.fechaElaboracion,
      placa_veh: f.placaVeh, cedula_conductor: f.cedulaConductor,
      nombre_conductor: f.nombreConductor, celular_conductor: f.celularConductor,
      ubicacion: f.ubicacion, tamano_contenedor: f.tamano,
      num_contenedor: f.numContenedor,
      sello_botella: f.numSelloBottella, sello_sticker: f.numSelloSticker,
      sello_guaya: f.numSelloGuaya, sello_asignado: f.numSelloBottellaAsignado,
      sello_adicional: f.numSelloBottellaAdicional,
      sello_satelital: f.selloSatelital, dispositivo_sat: f.numDispositivoSatelital,
      sello_recibido: f.selloRecibido,
      lugar_llenado: f.lugarLlenado, muelle: f.muelle,
      insp_tec_apellidos: f.apellidosInspTecnico, insp_tec_nombres: f.nombresInspTecnico, insp_tec_doc: f.docInspTecnico,
      empresa: f.empresaTransp, marca_vehiculo: f.marcaVehiculo,
      placa_vehiculo: f.placaVeh, placa_remolque: f.placaRemolque,
      conductor_nombre: f.nombreConductor, conductor_doc: f.cedulaConductor,
      guia_apellidos: f.guiaApellidos, guia_nombre: f.guiaNombre, guia_doc: f.guiaCedula,
      can_nombre: f.canNombre, can_raza: f.canRaza, can_microchip: f.microchipCan,
      insp_vehiculo: f.insp_vehiculo, insp_veh_hora_inicio: f.insp_veh_hi || null, insp_veh_hora_fin: f.insp_veh_hf || null, insp_veh_obs: f.insp_veh_obs,
      insp_contenedor: f.insp_contenedor, insp_cont_hora_inicio: f.insp_cont_hi || null, insp_cont_hora_fin: f.insp_cont_hf || null, insp_cont_obs: f.insp_cont_obs,
      insp_mercancia: f.insp_mercancia, insp_merc_hora_inicio: f.insp_merc_hi || null, insp_merc_hora_fin: f.insp_merc_hf || null, insp_merc_obs: f.insp_merc_obs,
      hora_inicio_llenado: f.horaInicioLlenado || null, hora_fin_llenado: f.horaFinLlenado || null,
      responsable_llenado: f.responsableLlenado, doc_responsable: f.docResponsable, obs_final: f.obsFinal,
      fecha_salida: f.fechaSalida, guia_responsable: f.guiaResponsable,
      fotos: { ...photoMeta, firma: firmaData ? 'firmado' : 'sin-firma' },
      ubicacion_gps: gpsCoords ? `${gpsCoords.lat},${gpsCoords.lng}` : null,
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>¡Registro Exitoso!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{new Date().toLocaleString('es-CO')}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#fff', fontWeight: 600 }}>{formNo}</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#fff', fontWeight: 600 }}>Inspección Contenedores</span>
        </div>
      </div>
      <button onClick={() => setSubmitted(false)} style={{ marginTop: 16, width: '100%', padding: 14, background: '#fff', border: '2px solid #0B1D3A', borderRadius: 8, color: '#0B1D3A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        ← Volver al menú principal
      </button>
    </div>
  )

  const camposReq = [f.placaVeh, f.cedulaConductor, f.nombreConductor, f.numContenedor, photos.fotoNumContenedor, photos.fotoSelloBottella]
  const progreso = Math.round((camposReq.filter(Boolean).length / camposReq.length) * 100)

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>

      {/* Botón volver */}
      <div style={{ marginBottom: 12 }}>
        <a href="/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B1D3A', textDecoration: 'none' }}>
          ← Volver a formularios
        </a>
      </div>

      {/* Título del formulario */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', margin: 0 }}>Inspección de Contenedores</h1>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '4px 0 0', fontWeight: 500 }}>Control antinarcóticos, sellos y unidad canina</p>
      </div>

      {/* Barra de progreso */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0' }}>PROGRESO</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1D3A' }}>{progreso}%</span>
        </div>
        <div style={{ height: 6, background: '#D0D9E8', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progreso}%`, background: progreso === 100 ? '#15803D' : '#F05A28', borderRadius: 99, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* 1 - DATOS GENERALES */}
      <Section num={1} icon="👤" title="Datos Generales">
        <Grid2>
          <Field label="Usuario Gestor" req><input style={inp} value={f.usuarioGestor} onChange={set('usuarioGestor')} /></Field>
          <Field label="Fecha Elaboración"><input style={inp} type="date" value={f.fechaElaboracion} onChange={set('fechaElaboracion')} /></Field>
          <Field label="Placa del Vehículo" req><input style={inp} value={f.placaVeh} onChange={up('placaVeh')} placeholder="NUX271" /></Field>
          <Field label="Cédula Conductor" req><input style={inp} value={f.cedulaConductor} onChange={set('cedulaConductor')} placeholder="1040843672" /></Field>
          <Field label="Nombres y Apellidos" req><input style={inp} value={f.nombreConductor} onChange={set('nombreConductor')} placeholder="Pedro Gómez Valencia" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celularConductor} onChange={set('celularConductor')} placeholder="300 000 0000" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}><Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Barranquilla, Atlántico" /></Field></div>
      </Section>

      {/* 2 - UNIDAD DE CARGUE */}
      <Section num={2} icon="📦" title="Información Unidad de Cargue">
        <Grid2>
          <Field label="Tamaño Contenedor" req>
            <select style={inp} value={f.tamano} onChange={set('tamano')}>
              <option value="20">20 ft</option><option value="40">40 ft</option><option value="45">45 ft</option>
            </select>
          </Field>
          <Field label="Número Contenedor" req><input style={inp} value={f.numContenedor} onChange={up('numContenedor')} placeholder="MRKU481291(6)" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}>
          <PhotoField id="fotoNumContenedor" label="Foto Número de Contenedor" value={photos.fotoNumContenedor} onChange={sp('fotoNumContenedor')} />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #D0D9E8', margin: '14px 0' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#0B1D3A', marginBottom: 10 }}>Sellos</p>
        <Grid2>
          <Field label="N° Sello Botella"><input style={inp} value={f.numSelloBottella} onChange={up('numSelloBottella')} placeholder="CKF5570" /></Field>
          <PhotoField id="fotoSelloBottella" label="Foto Sello Botella" value={photos.fotoSelloBottella} onChange={sp('fotoSelloBottella')} />
          <Field label="N° Sello Sticker"><input style={inp} value={f.numSelloSticker} onChange={up('numSelloSticker')} placeholder="H75347R" /></Field>
          <PhotoField id="fotoSelloSticker" label="Foto Sello Sticker" value={photos.fotoSelloSticker} onChange={sp('fotoSelloSticker')} />
          <Field label="N° Sello Guaya"><input style={inp} value={f.numSelloGuaya} onChange={up('numSelloGuaya')} placeholder="CKD8891" /></Field>
          <PhotoField id="fotoSelloGuaya" label="Foto Sello Guaya" value={photos.fotoSelloGuaya} onChange={sp('fotoSelloGuaya')} />
          <Field label="N° Sello Botella Asignado"><input style={inp} value={f.numSelloBottellaAsignado} onChange={up('numSelloBottellaAsignado')} placeholder="01150862" /></Field>
          <PhotoField id="fotoSelloBottellaAsignado" label="Foto Sello Asignado" value={photos.fotoSelloBottellaAsignado} onChange={sp('fotoSelloBottellaAsignado')} />
          <Field label="N° Sello Botella Adicional"><input style={inp} value={f.numSelloBottellaAdicional} onChange={up('numSelloBottellaAdicional')} placeholder="ST029243" /></Field>
          <PhotoField id="fotoSelloAdicional" label="Foto Sello Adicional" value={photos.fotoSelloAdicional} onChange={sp('fotoSelloAdicional')} />
        </Grid2>

        <hr style={{ border: 'none', borderTop: '1px solid #D0D9E8', margin: '14px 0' }} />
        <Grid2>
          <Field label="Sello Satelital"><Toggle value={f.selloSatelital} onChange={tog('selloSatelital')} /></Field>
          {f.selloSatelital && <Field label="N° Dispositivo Satelital"><input style={inp} value={f.numDispositivoSatelital} onChange={up('numDispositivoSatelital')} placeholder="B981027" /></Field>}
        </Grid2>
        {f.selloSatelital && (
          <div style={{ marginTop: 12 }}>
            <PhotoField id="fotoSelloSatelitalRecibo" label="Foto Sello Satelital al recibo" value={photos.fotoSelloSatelitalRecibo} onChange={sp('fotoSelloSatelitalRecibo')} />
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #D0D9E8', margin: '14px 0' }} />
        <Grid2>
          <Field label="Sello Recibido del Contenedor"><Toggle value={f.selloRecibido} onChange={tog('selloRecibido')} /></Field>
          <PhotoField id="fotoSelloRecibido" label="Foto Sello Recibido" value={photos.fotoSelloRecibido} onChange={sp('fotoSelloRecibido')} />
        </Grid2>
      </Section>

      {/* 3 - INSPECCIÓN TÉCNICA (nueva) */}
      <Section num={3} icon="🔧" title="Inspección Técnica — Unidad de Cargue">
        <Grid3>
          <Field label="Apellidos Inspector"><input style={inp} value={f.apellidosInspTecnico} onChange={set('apellidosInspTecnico')} placeholder="Acuña" /></Field>
          <Field label="Nombres Inspector"><input style={inp} value={f.nombresInspTecnico} onChange={set('nombresInspTecnico')} placeholder="Alfredo" /></Field>
          <Field label="Documento"><input style={inp} value={f.docInspTecnico} onChange={set('docInspTecnico')} placeholder="1143440223" /></Field>
        </Grid3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <PhotoField id="fotoPlacaCabezote" label="Foto placa cabezote" value={photos.fotoPlacaCabezote} onChange={sp('fotoPlacaCabezote')} />
          <PhotoField id="fotoParteDelantera" label="Foto parte delantera vehículo" value={photos.fotoParteDelantera} onChange={sp('fotoParteDelantera')} />
          <PhotoField id="fotoGeneralContVeh" label="Foto general contenedor + vehículo" value={photos.fotoGeneralContVeh} onChange={sp('fotoGeneralContVeh')} />
          <PhotoField id="fotoParteTrasera" label="Foto parte trasera contenedor" value={photos.fotoParteTrasera} onChange={sp('fotoParteTrasera')} />
          <div style={{ gridColumn: '1/-1' }}>
            <PhotoField id="fotoContenedorVacioAbierto" label="Foto contenedor vacío abierto" value={photos.fotoContenedorVacioAbierto} onChange={sp('fotoContenedorVacioAbierto')} />
          </div>
        </div>
      </Section>

      {/* 4 - EMPRESA TRANSPORTADORA */}
      <Section num={4} icon="🚛" title="Empresa Transportadora">
        <Grid2>
          <Field label="Empresa Transportadora"><input style={inp} value={f.empresaTransp} onChange={set('empresaTransp')} placeholder="Transportes XYZ" /></Field>
          <Field label="Marca Vehículo"><input style={inp} value={f.marcaVehiculo} onChange={set('marcaVehiculo')} placeholder="Volkswagen" /></Field>
          <Field label="Placa Vehículo"><input style={inp} value={f.placaVeh} onChange={up('placaVeh')} placeholder="NUX271" /></Field>
          <Field label="Placa Remolque"><input style={inp} value={f.placaRemolque} onChange={up('placaRemolque')} placeholder="S84919" /></Field>
        </Grid2>
      </Section>

      {/* 5 - LUGAR DE LLENADO */}
      <Section num={5} icon="📍" title="Lugar de Llenado">
        <Grid2>
          <Field label="Lugar Llenado" req><input style={inp} value={f.lugarLlenado} onChange={set('lugarLlenado')} placeholder="Alfacer" /></Field>
          <Field label="Muelle"><input style={inp} value={f.muelle} onChange={set('muelle')} placeholder="4" /></Field>
        </Grid2>
      </Section>

      {/* 6 - BINOMIO CANINO */}
      <Section num={6} icon="🐕" title="Binomio Canino">
        <Grid3>
          <Field label="Apellidos Guía"><input style={inp} value={f.guiaApellidos} onChange={set('guiaApellidos')} placeholder="Acosta" /></Field>
          <Field label="Nombre Guía"><input style={inp} value={f.guiaNombre} onChange={set('guiaNombre')} placeholder="Bolívar" /></Field>
          <Field label="Documento Guía"><input style={inp} value={f.guiaCedula} onChange={set('guiaCedula')} placeholder="8796733" /></Field>
          <Field label="Nombre del Can"><input style={inp} value={f.canNombre} onChange={set('canNombre')} placeholder="Ice" /></Field>
          <Field label="Raza"><input style={inp} value={f.canRaza} onChange={set('canRaza')} placeholder="Labrador" /></Field>
          <Field label="Microchip"><input style={inp} value={f.microchipCan} onChange={set('microchipCan')} placeholder="959#580" /></Field>
        </Grid3>
        <div style={{ marginTop: 12 }}>
          <PhotoField id="fotoUniCan" label="Foto Unidad Canina" value={photos.fotoUniCan} onChange={sp('fotoUniCan')} />
        </div>
      </Section>

      {/* 7 - INSPECCIONES ANTINARCÓTICOS */}
      <Section num={7} icon="🔍" title="Inspecciones Antinarcóticos">
        <InspBlock title="Inspección Vehículo" enabled={f.insp_vehiculo} onToggle={tog('insp_vehiculo')}
          hiId="insp_veh_hi" hfId="insp_veh_hf" durId="dur_veh" obsId="insp_veh_obs" fotoId="fotoInspVeh"
          hiVal={f.insp_veh_hi} hfVal={f.insp_veh_hf} durVal="" obsVal={f.insp_veh_obs} fotoVal={photos.fotoInspVeh}
          onHi={v => setF(p => ({...p, insp_veh_hi: v}))} onHf={v => setF(p => ({...p, insp_veh_hf: v}))}
          onObs={v => setF(p => ({...p, insp_veh_obs: v}))} onFoto={sp('fotoInspVeh')} />
        <InspBlock title="Inspección Contenedor" enabled={f.insp_contenedor} onToggle={tog('insp_contenedor')}
          hiId="insp_cont_hi" hfId="insp_cont_hf" durId="dur_cont" obsId="insp_cont_obs" fotoId="fotoInspCont"
          hiVal={f.insp_cont_hi} hfVal={f.insp_cont_hf} durVal="" obsVal={f.insp_cont_obs} fotoVal={photos.fotoInspCont}
          onHi={v => setF(p => ({...p, insp_cont_hi: v}))} onHf={v => setF(p => ({...p, insp_cont_hf: v}))}
          onObs={v => setF(p => ({...p, insp_cont_obs: v}))} onFoto={sp('fotoInspCont')} />
        <InspBlock title="Inspección Mercancía" enabled={f.insp_mercancia} onToggle={tog('insp_mercancia')}
          hiId="insp_merc_hi" hfId="insp_merc_hf" durId="dur_merc" obsId="insp_merc_obs" fotoId="fotoInspMerc"
          hiVal={f.insp_merc_hi} hfVal={f.insp_merc_hf} durVal="" obsVal={f.insp_merc_obs} fotoVal={photos.fotoInspMerc}
          onHi={v => setF(p => ({...p, insp_merc_hi: v}))} onHf={v => setF(p => ({...p, insp_merc_hf: v}))}
          onObs={v => setF(p => ({...p, insp_merc_obs: v}))} onFoto={sp('fotoInspMerc')} />
        <PhotoField id="fotoMercancia" label="Foto a la mercancía" value={photos.fotoMercancia} onChange={sp('fotoMercancia')} />
      </Section>

      {/* 8 - PROCESO DE LLENADO */}
      <Section num={8} icon="⏱" title="Proceso de Llenado">
        <Grid2>
          <Field label="Hora Inicio"><input style={inp} type="time" value={f.horaInicioLlenado} onChange={set('horaInicioLlenado')} /></Field>
          <Field label="Hora Finaliza"><input style={inp} type="time" value={f.horaFinLlenado} onChange={set('horaFinLlenado')} /></Field>
          <Field label="Responsable"><input style={inp} value={f.responsableLlenado} onChange={set('responsableLlenado')} placeholder="Alfredo Acuña" /></Field>
          <Field label="Documento"><input style={inp} value={f.docResponsable} onChange={set('docResponsable')} placeholder="1143440223" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}>
          <Field label="Observaciones Finales">
            <textarea style={ta} value={f.obsFinal} onChange={set('obsFinal')} placeholder="Ej: Se cargaron 1.511 cajas en 39 estibas" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <PhotoField id="fotoInicioCargue" label="Foto inicio del cargue" value={photos.fotoInicioCargue} onChange={sp('fotoInicioCargue')} />
          <PhotoField id="fotoMitadCargue" label="Foto mitad del cargue" value={photos.fotoMitadCargue} onChange={sp('fotoMitadCargue')} />
          <PhotoField id="fotoFinCargue" label="Foto finalización del cargue" value={photos.fotoFinCargue} onChange={sp('fotoFinCargue')} />
          <PhotoField id="fotoCuadrilla" label="Foto cuadrilla" value={photos.fotoCuadrilla} onChange={sp('fotoCuadrilla')} />
        </div>
      </Section>

      {/* 9 - REGISTRO FOTOGRÁFICO FINAL */}
      <Section num={9} icon="📷" title="Registro Fotográfico Final">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PhotoField id="fotoCC1" label="Contenedor cerrado (una puerta)" value={photos.fotoCC1} onChange={sp('fotoCC1')} />
          <PhotoField id="fotoCC2" label="Contenedor cerrado totalmente" value={photos.fotoCC2} onChange={sp('fotoCC2')} />
          <PhotoField id="fotoSSFinal" label="Foto sello satelital (final)" value={photos.fotoSSFinal} onChange={sp('fotoSSFinal')} />
          <PhotoField id="fotoDispInt" label="Foto dispositivo internacional" value={photos.fotoDispInt} onChange={sp('fotoDispInt')} />
          <PhotoField id="fotoTodosSellos" label="Contenedor con todos los sellos" value={photos.fotoTodosSellos} onChange={sp('fotoTodosSellos')} />
          <PhotoField id="fotoConductorVehiculo" label="Foto conductor y vehículo" value={photos.fotoConductorVehiculo} onChange={sp('fotoConductorVehiculo')} />
        </div>
      </Section>

      {/* 10 - CIERRE Y FIRMA */}
      <Section num={10} icon="✍️" title="Cierre y Responsable">
        <Grid2>
          <Field label="Fecha de Salida Planta"><input style={inp} type="date" value={f.fechaSalida} onChange={set('fechaSalida')} /></Field>
          <Field label="Guía Canino Responsable"><input style={inp} value={f.guiaResponsable} onChange={set('guiaResponsable')} placeholder="Rafael Acosta Bolívar" /></Field>
        </Grid2>
        <div style={{ marginTop: 16 }}>
          <Field label="Firma Digital del Responsable">
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

      {/* 11 - GPS */}
      <Section num={11} icon="📍" title="Ubicación GPS">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          {gpsCoords ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A', marginBottom: 8 }}>📍 Coordenadas capturadas</div>
              <div style={{ background: '#F4F1EB', border: '1px solid #D0D9E8', borderRadius: 8, padding: '10px 16px', display: 'inline-block' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#0B1D3A' }}>
                  {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                </span>
              </div>
              <button type="button" onClick={captureGPS} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: '1px solid #D0D9E8', borderRadius: 8, padding: '6px 16px', fontSize: 12, cursor: 'pointer', color: '#7A90B0' }}>
                Actualizar ubicación
              </button>
            </div>
          ) : (
            <button type="button" onClick={captureGPS} disabled={gpsLoading}
              style={{ padding: '12px 24px', background: '#0B1D3A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {gpsLoading ? '📡 Obteniendo ubicación...' : '📍 Capturar Ubicación GPS'}
            </button>
          )}
        </div>
      </Section>

      {/* SUBMIT */}
      <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 12, padding: 16, boxShadow: '0 4px 20px rgba(11,29,58,0.12)', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', fontFamily: 'monospace' }}>{photoCount}</div>
            <div style={{ fontSize: 10, color: '#7A90B0' }}>Fotos</div>
          </div>
          <div style={{ width: 1, height: 30, background: '#D0D9E8' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', fontFamily: 'monospace' }}>11</div>
            <div style={{ fontSize: 10, color: '#7A90B0' }}>Secciones</div>
          </div>
          <div style={{ width: 1, height: 30, background: '#D0D9E8' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0B1D3A' }}>{formNo}</div>
            <div style={{ fontSize: 10, color: '#7A90B0' }}>No. Formulario</div>
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.35)' }}>
          {loading ? 'Guardando...' : 'Registrar →'}
        </button>
      </div>
    </form>
  )
}
