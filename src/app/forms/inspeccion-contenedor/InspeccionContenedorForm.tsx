'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props { userId: string; userEmail: string }

// ─── helpers UI ───────────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2e3349', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(90deg,#1e6fff22 0%,transparent 100%)', borderBottom: '1px solid #2e3349', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1e6fff' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7394' }}>
        {label}{req && <span style={{ color: '#1e6fff', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '9px', borderRadius: 6, border: `1px solid ${value === v ? (v ? '#00c07a' : '#ff3b3b') : '#2e3349'}`,
            background: value === v ? (v ? 'rgba(0,192,122,0.13)' : 'rgba(255,59,59,0.13)') : '#22263a',
            color: value === v ? (v ? '#00c07a' : '#ff3b3b') : '#6b7394',
            fontSize: 12, fontWeight: 'bold', fontFamily: 'DM Mono, monospace', cursor: 'pointer', letterSpacing: '0.08em',
          }}>
          {v ? 'SI' : 'NO'}
        </button>
      ))}
    </div>
  )
}

interface PhotoState { preview: string; name: string; file: File }

function PhotoUpload({ id, value, onChange }: { id: string; value: PhotoState | null; onChange: (v: PhotoState | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ preview: ev.target?.result as string, name: file.name, file })
    reader.readAsDataURL(file)
  }

  if (value) return (
    <div style={{ position: 'relative' }}>
      <img src={value.preview} alt={id} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,192,122,0.4)', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 8px', fontSize: 9, color: '#fff', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</span>
        <button type="button" onClick={() => onChange(null)} style={{ background: 'rgba(255,59,59,0.8)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: 'bold' }}>✕</button>
      </div>
    </div>
  )

  return (
    <>
      <div onClick={() => ref.current?.click()}
        style={{ border: '2px dashed #2e3349', borderRadius: 8, background: '#22263a', height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 5 }}>
        <span style={{ fontSize: 20 }}>📷</span>
        <span style={{ fontSize: 9, color: '#6b7394', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Toca para adjuntar</span>
        <span style={{ fontSize: 9, color: '#3d4466' }}>JPG · PNG · HEIC</span>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </>
  )
}

function SmallPhoto({ id, value, onChange, label }: { id: string; value: PhotoState | null; onChange: (v: PhotoState | null) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ preview: ev.target?.result as string, name: file.name, file })
    reader.readAsDataURL(file)
  }

  return (
    <Field label={label}>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value.preview} alt={id} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(0,192,122,0.4)' }} />
          <button type="button" onClick={() => onChange(null)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,59,59,0.8)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 9, padding: '2px 6px', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <>
          <div onClick={() => ref.current?.click()}
            style={{ border: '2px dashed #2e3349', borderRadius: 6, background: '#22263a', height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 3 }}>
            <span style={{ fontSize: 16 }}>📷</span>
            <span style={{ fontSize: 9, color: '#6b7394', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Adjuntar</span>
          </div>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
        </>
      )}
    </Field>
  )
}

// ─── componente principal ──────────────────────────────────────────────────────
export default function InspeccionContenedorForm({ userId, userEmail }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 900) + 100}`)

  const [f, setF] = useState({
    usuario_gestor: userEmail, fecha_elaboracion: new Date().toISOString().split('T')[0],
    placa_veh: '', cedula_conductor: '', nombre_conductor: '', celular_conductor: '',
    ubicacion: 'BARRANQUILLA, ATLÁNTICO',
    tamano_contenedor: '40', num_contenedor: '',
    sello_botella: '', sello_sticker: '', sello_guaya: '', sello_asignado: '', sello_adicional: '',
    sello_satelital: true, dispositivo_sat: '', sello_recibido: true,
    lugar_llenado: '', muelle: '',
    insp_tec_apellidos: '', insp_tec_nombres: '', insp_tec_doc: '',
    empresa: '', marca_vehiculo: '', placa_vehiculo: '', placa_remolque: '', conductor_nombre: '', conductor_doc: '',
    guia_apellidos: '', guia_nombre: '', guia_doc: '', can_nombre: '', can_raza: '', can_microchip: '',
    insp_vehiculo: true, insp_veh_hora_inicio: '', insp_veh_hora_fin: '', insp_veh_obs: '',
    insp_contenedor: true, insp_cont_hora_inicio: '', insp_cont_hora_fin: '', insp_cont_obs: '',
    insp_mercancia: true, insp_merc_hora_inicio: '', insp_merc_hora_fin: '', insp_merc_obs: '',
    hora_inicio_llenado: '', hora_fin_llenado: '', responsable_llenado: '', doc_responsable: '', obs_final: '',
    fecha_salida: new Date().toISOString().split('T')[0], guia_responsable: '',
  })

  // fotos
  const [photos, setPhotos] = useState<Record<string, PhotoState | null>>({
    fotoNumContenedor: null, fotoSelloBottella: null, fotoSelloSticker: null,
    fotoSelloGuaya: null, fotoSelloAsignado: null, fotoSelloAdicional: null,
    fotoSelloSatelital: null, fotoSelloRecibido: null,
    fotoPlacaCabezote: null, fotoDelantera: null, fotoGeneral: null,
    fotoPosterior: null, fotoContenedorVacio: null,
    fotoInspVeh: null, fotoInspCont: null, fotoInspMerc: null, fotoMercancia: null,
    fotoInicioCargue: null, fotoMitadCargue: null, fotoFinCargue: null, fotoCuadrilla: null,
    fotoContenedorCerrado1: null, fotoContenedorCerrado2: null, fotoSelloSatelitalFinal: null,
    fotoDispositivoInt: null, fotoTodosSellos: null, fotoConductorVehiculo: null,
  })
  const setPhoto = (k: string) => (v: PhotoState | null) => setPhotos(p => ({ ...p, [k]: v }))

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const tog = (k: string) => (v: boolean) => setF(p => ({ ...p, [k]: v }))
  const dur = (a: string, b: string) => {
    if (!a || !b) return '--'
    const [h1, m1] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number)
    const d = (h2 * 60 + m2) - (h1 * 60 + m1); return d >= 0 ? `${d} min` : '--'
  }

  const photoCount = Object.values(photos).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const photoMeta: Record<string, string> = {}
    Object.entries(photos).forEach(([k, v]) => { if (v) photoMeta[k] = v.name })
    const { error } = await supabase.from('inspecciones_contenedor').insert({
      form_no: formNo, guard_id: userId, ...f,
      fotos: photoMeta,
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: '#1a1d27', border: '1.5px solid #00c07a', borderRadius: 10, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ color: '#00c07a', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Inspección Registrada</div>
        <div style={{ color: '#6b7394', fontSize: 12, marginBottom: 4 }}>Formulario <strong style={{ color: '#1e6fff' }}>{formNo}</strong></div>
        <div style={{ color: '#3d4466', fontSize: 11, marginBottom: 24 }}>{new Date().toLocaleString('es-CO')}</div>
        <button onClick={() => { setSubmitted(false) }}
          style={{ padding: '12px 32px', background: '#22263a', border: '1px solid #2e3349', borderRadius: 8, color: '#e8ecf5', fontSize: 12, fontFamily: 'DM Mono, monospace', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ← NUEVO REGISTRO
        </button>
      </div>
    </div>
  )

  const inp: React.CSSProperties = { background: '#22263a', border: '1px solid #2e3349', borderRadius: 6, padding: '9px 12px', color: '#e8ecf5', fontSize: 13, fontFamily: 'DM Mono, monospace', width: '100%', outline: 'none' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }
  const ta: React.CSSProperties = { ...inp, minHeight: 72, resize: 'vertical' }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Tipo */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7394', marginBottom: 8, fontWeight: 'bold' }}>Tipo de Inspección</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'contenedor', icon: '📦', label: 'Inspección Contenedores', active: true },
            { id: 'vehiculo', icon: '🚛', label: 'Inspección Vehículo', active: false },
            { id: 'personal', icon: '👤', label: 'Inspección Personal', active: false },
          ].map(t => (
            <button key={t.id} type="button"
              disabled={!t.active}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 8,
                border: `1px solid ${t.active ? '#1e6fff' : '#2e3349'}`,
                background: t.active ? '#1e6fff33' : '#1a1d27',
                color: t.active ? '#1e6fff' : '#3d4466',
                fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 'bold',
                cursor: t.active ? 'pointer' : 'not-allowed', textAlign: 'center',
              }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{t.icon}</span>
              {t.label}
              {!t.active && <div style={{ fontSize: 9, marginTop: 2, color: '#3d4466' }}>PRÓXIMAMENTE</div>}
            </button>
          ))}
        </div>
      </div>

      <Section icon="👤" title="Datos Generales">
        <Grid2>
          <Field label="Usuario Gestor" req><input style={inp} value={f.usuario_gestor} onChange={set('usuario_gestor')} /></Field>
          <Field label="Fecha Elaboración"><input style={inp} type="date" value={f.fecha_elaboracion} onChange={set('fecha_elaboracion')} /></Field>
          <Field label="Placa del Vehículo" req><input style={inp} value={f.placa_veh} onChange={up('placa_veh')} placeholder="NUX271" /></Field>
          <Field label="Cédula Conductor" req><input style={inp} value={f.cedula_conductor} onChange={set('cedula_conductor')} placeholder="1040843672" /></Field>
          <Field label="Nombres y Apellidos" req><input style={inp} value={f.nombre_conductor} onChange={set('nombre_conductor')} placeholder="Pedro Gómez Valencia" /></Field>
          <Field label="Celular"><input style={inp} value={f.celular_conductor} onChange={set('celular_conductor')} placeholder="300 000 0000" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}><Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} /></Field></div>
      </Section>

      <Section icon="📦" title="Información Unidad de Cargue">
        <Grid2>
          <Field label="Tamaño Contenedor" req>
            <select style={sel} value={f.tamano_contenedor} onChange={set('tamano_contenedor')}>
              <option value="20">20 ft</option><option value="40">40 ft</option><option value="45">45 ft</option>
            </select>
          </Field>
          <Field label="Número Contenedor" req><input style={inp} value={f.num_contenedor} onChange={up('num_contenedor')} placeholder="MRKU481291(6)" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}>
          <Field label="Foto Número de Contenedor">
            <PhotoUpload id="fotoNumContenedor" value={photos.fotoNumContenedor} onChange={setPhoto('fotoNumContenedor')} />
          </Field>
        </div>
      </Section>

      <Section icon="🔒" title="Sellos y Dispositivos">
        <Grid2>
          <Field label="N° Sello Botella"><input style={inp} value={f.sello_botella} onChange={up('sello_botella')} placeholder="CKF5570" /></Field>
          <SmallPhoto id="fotoSelloBottella" label="Foto Sello Botella" value={photos.fotoSelloBottella} onChange={setPhoto('fotoSelloBottella')} />
          <Field label="N° Sello Sticker"><input style={inp} value={f.sello_sticker} onChange={up('sello_sticker')} placeholder="H75347R" /></Field>
          <SmallPhoto id="fotoSelloSticker" label="Foto Sello Sticker" value={photos.fotoSelloSticker} onChange={setPhoto('fotoSelloSticker')} />
          <Field label="N° Sello Guaya"><input style={inp} value={f.sello_guaya} onChange={up('sello_guaya')} placeholder="CKD8891" /></Field>
          <SmallPhoto id="fotoSelloGuaya" label="Foto Sello Guaya" value={photos.fotoSelloGuaya} onChange={setPhoto('fotoSelloGuaya')} />
          <Field label="N° Sello Asignado"><input style={inp} value={f.sello_asignado} onChange={up('sello_asignado')} placeholder="01150862" /></Field>
          <SmallPhoto id="fotoSelloAsignado" label="Foto Sello Asignado" value={photos.fotoSelloAsignado} onChange={setPhoto('fotoSelloAsignado')} />
          <Field label="N° Sello Adicional"><input style={inp} value={f.sello_adicional} onChange={up('sello_adicional')} placeholder="ST029243" /></Field>
          <SmallPhoto id="fotoSelloAdicional" label="Foto Sello Adicional" value={photos.fotoSelloAdicional} onChange={setPhoto('fotoSelloAdicional')} />
        </Grid2>
        <hr style={{ border: 'none', borderTop: '1px solid #2e3349', margin: '14px 0' }} />
        <Grid2>
          <Field label="Sello Satelital"><Toggle value={f.sello_satelital} onChange={tog('sello_satelital')} /></Field>
          {f.sello_satelital && <Field label="N° Dispositivo Satelital"><input style={inp} value={f.dispositivo_sat} onChange={up('dispositivo_sat')} placeholder="B981027" /></Field>}
        </Grid2>
        {f.sello_satelital && <div style={{ marginTop: 12 }}>
          <Field label="Foto Sello Satelital">
            <PhotoUpload id="fotoSelloSatelital" value={photos.fotoSelloSatelital} onChange={setPhoto('fotoSelloSatelital')} />
          </Field>
        </div>}
        <hr style={{ border: 'none', borderTop: '1px solid #2e3349', margin: '14px 0' }} />
        <Grid2>
          <Field label="Sello Recibido del Contenedor"><Toggle value={f.sello_recibido} onChange={tog('sello_recibido')} /></Field>
          <SmallPhoto id="fotoSelloRecibido" label="Foto Sello Recibido" value={photos.fotoSelloRecibido} onChange={setPhoto('fotoSelloRecibido')} />
        </Grid2>
      </Section>

      <Section icon="📍" title="Lugar de Llenado">
        <Grid2>
          <Field label="Lugar Llenado" req><input style={inp} value={f.lugar_llenado} onChange={set('lugar_llenado')} placeholder="Alfacer" /></Field>
          <Field label="Muelle"><input style={inp} value={f.muelle} onChange={set('muelle')} placeholder="4" /></Field>
        </Grid2>
      </Section>

      <Section icon="🔧" title="Inspección Técnica — Fotos del Vehículo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Apellidos Inspector"><input style={inp} value={f.insp_tec_apellidos} onChange={set('insp_tec_apellidos')} placeholder="Acuña" /></Field>
          <Field label="Nombres Inspector"><input style={inp} value={f.insp_tec_nombres} onChange={set('insp_tec_nombres')} placeholder="Alfredo" /></Field>
          <Field label="Documento"><input style={inp} value={f.insp_tec_doc} onChange={set('insp_tec_doc')} placeholder="1143440223" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <SmallPhoto id="fotoPlacaCabezote" label="Foto placa cabezote" value={photos.fotoPlacaCabezote} onChange={setPhoto('fotoPlacaCabezote')} />
          <SmallPhoto id="fotoDelantera" label="Foto parte delantera vehículo" value={photos.fotoDelantera} onChange={setPhoto('fotoDelantera')} />
          <SmallPhoto id="fotoGeneral" label="Foto general contenedor + vehículo" value={photos.fotoGeneral} onChange={setPhoto('fotoGeneral')} />
          <SmallPhoto id="fotoPosterior" label="Foto parte trasera contenedor" value={photos.fotoPosterior} onChange={setPhoto('fotoPosterior')} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Foto contenedor vacío abierto">
              <PhotoUpload id="fotoContenedorVacio" value={photos.fotoContenedorVacio} onChange={setPhoto('fotoContenedorVacio')} />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon="🚛" title="Información Proveedor de Transporte">
        <Grid2>
          <Field label="Empresa Transportadora"><input style={inp} value={f.empresa} onChange={set('empresa')} placeholder="Transcont" /></Field>
          <Field label="Marca Vehículo"><input style={inp} value={f.marca_vehiculo} onChange={set('marca_vehiculo')} placeholder="Volkswagen" /></Field>
          <Field label="Placa Vehículo"><input style={inp} value={f.placa_vehiculo} onChange={up('placa_vehiculo')} placeholder="NUX271" /></Field>
          <Field label="Placa Remolque"><input style={inp} value={f.placa_remolque} onChange={up('placa_remolque')} placeholder="S84919" /></Field>
          <Field label="Apellidos y Nombre Conductor"><input style={inp} value={f.conductor_nombre} onChange={set('conductor_nombre')} placeholder="Gómez Pedro" /></Field>
          <Field label="Documento Conductor"><input style={inp} value={f.conductor_doc} onChange={set('conductor_doc')} placeholder="1040843672" /></Field>
        </Grid2>
      </Section>

      <Section icon="🐕" title="Información Binomio Canino">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Apellidos Guía"><input style={inp} value={f.guia_apellidos} onChange={set('guia_apellidos')} placeholder="Acosta" /></Field>
          <Field label="Nombre Guía"><input style={inp} value={f.guia_nombre} onChange={set('guia_nombre')} placeholder="Bolívar" /></Field>
          <Field label="Documento Guía"><input style={inp} value={f.guia_doc} onChange={set('guia_doc')} placeholder="8796733" /></Field>
          <Field label="Nombre del Can"><input style={inp} value={f.can_nombre} onChange={set('can_nombre')} placeholder="Ice" /></Field>
          <Field label="Raza"><input style={inp} value={f.can_raza} onChange={set('can_raza')} placeholder="Labrador" /></Field>
          <Field label="Microchip"><input style={inp} value={f.can_microchip} onChange={set('can_microchip')} placeholder="959#580" /></Field>
        </div>
      </Section>

      <Section icon="🔍" title="Inspecciones Antinarcóticos">
        {[
          { k: 'insp_vehiculo', label: 'Unidad de Carga', hi: 'insp_veh_hora_inicio', hf: 'insp_veh_hora_fin', obs: 'insp_veh_obs', foto: 'fotoInspVeh' },
          { k: 'insp_contenedor', label: 'Contenedor', hi: 'insp_cont_hora_inicio', hf: 'insp_cont_hora_fin', obs: 'insp_cont_obs', foto: 'fotoInspCont' },
          { k: 'insp_mercancia', label: 'Mercancía', hi: 'insp_merc_hora_inicio', hf: 'insp_merc_hora_fin', obs: 'insp_merc_obs', foto: 'fotoInspMerc' },
        ].map(b => (
          <div key={b.k} style={{ background: '#22263a', border: '1px solid #2e3349', borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7394', marginBottom: 10, fontWeight: 'bold' }}>— {b.label}</div>
            <Field label="Realizada"><Toggle value={f[b.k as keyof typeof f] as boolean} onChange={tog(b.k)} /></Field>
            {f[b.k as keyof typeof f] && <div style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Field label="Hora Inicio"><input style={inp} type="time" value={f[b.hi as keyof typeof f] as string} onChange={set(b.hi)} /></Field>
                <Field label="Hora Término"><input style={inp} type="time" value={f[b.hf as keyof typeof f] as string} onChange={set(b.hf)} /></Field>
                <Field label="Duración"><input style={{ ...inp, color: '#6b7394' }} readOnly value={dur(f[b.hi as keyof typeof f] as string, f[b.hf as keyof typeof f] as string)} /></Field>
              </div>
              <Field label="Observaciones"><textarea style={ta} value={f[b.obs as keyof typeof f] as string} onChange={set(b.obs)} placeholder="Ninguna" /></Field>
              <div style={{ marginTop: 12 }}>
                <Field label={`Foto inspección canina — ${b.label}`}>
                  <PhotoUpload id={b.foto} value={photos[b.foto]} onChange={setPhoto(b.foto)} />
                </Field>
              </div>
            </div>}
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <Field label="Foto a la mercancía">
            <PhotoUpload id="fotoMercancia" value={photos.fotoMercancia} onChange={setPhoto('fotoMercancia')} />
          </Field>
        </div>
      </Section>

      <Section icon="⏱" title="Proceso de Llenado del Contenedor">
        <Grid2>
          <Field label="Hora Inicio Llenado"><input style={inp} type="time" value={f.hora_inicio_llenado} onChange={set('hora_inicio_llenado')} /></Field>
          <Field label="Hora Finaliza Llenado"><input style={inp} type="time" value={f.hora_fin_llenado} onChange={set('hora_fin_llenado')} /></Field>
          <Field label="Responsable Llenado"><input style={inp} value={f.responsable_llenado} onChange={set('responsable_llenado')} placeholder="Alfredo Acuña" /></Field>
          <Field label="Doc. Identidad Responsable"><input style={inp} value={f.doc_responsable} onChange={set('doc_responsable')} placeholder="1143440223" /></Field>
        </Grid2>
        <div style={{ marginTop: 12 }}>
          <Field label="Observaciones Finales"><textarea style={ta} value={f.obs_final} onChange={set('obs_final')} placeholder="Ej: Se cargaron 1.511 cajas de NEXT en 39 estibas" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <SmallPhoto id="fotoInicioCargue" label="Foto inicio del cargue" value={photos.fotoInicioCargue} onChange={setPhoto('fotoInicioCargue')} />
          <SmallPhoto id="fotoMitadCargue" label="Foto mitad del cargue" value={photos.fotoMitadCargue} onChange={setPhoto('fotoMitadCargue')} />
          <SmallPhoto id="fotoFinCargue" label="Foto finalización del cargue" value={photos.fotoFinCargue} onChange={setPhoto('fotoFinCargue')} />
          <SmallPhoto id="fotoCuadrilla" label="Foto cuadrilla que participa" value={photos.fotoCuadrilla} onChange={setPhoto('fotoCuadrilla')} />
        </div>
      </Section>

      <Section icon="📷" title="Registro Fotográfico Final">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SmallPhoto id="fotoContenedorCerrado1" label="Contenedor cerrado (una puerta)" value={photos.fotoContenedorCerrado1} onChange={setPhoto('fotoContenedorCerrado1')} />
          <SmallPhoto id="fotoContenedorCerrado2" label="Contenedor cerrado totalmente" value={photos.fotoContenedorCerrado2} onChange={setPhoto('fotoContenedorCerrado2')} />
          <SmallPhoto id="fotoSelloSatelitalFinal" label="Foto sello satelital (final)" value={photos.fotoSelloSatelitalFinal} onChange={setPhoto('fotoSelloSatelitalFinal')} />
          <SmallPhoto id="fotoDispositivoInt" label="Foto dispositivo internacional" value={photos.fotoDispositivoInt} onChange={setPhoto('fotoDispositivoInt')} />
          <SmallPhoto id="fotoTodosSellos" label="Contenedor cerrado con todos los sellos" value={photos.fotoTodosSellos} onChange={setPhoto('fotoTodosSellos')} />
          <SmallPhoto id="fotoConductorVehiculo" label="Foto conductor y vehículo" value={photos.fotoConductorVehiculo} onChange={setPhoto('fotoConductorVehiculo')} />
        </div>
      </Section>

      <Section icon="✍️" title="Cierre y Responsable">
        <Grid2>
          <Field label="Fecha de Salida Planta"><input style={inp} type="date" value={f.fecha_salida} onChange={set('fecha_salida')} /></Field>
          <Field label="Guía Canino Responsable"><input style={inp} value={f.guia_responsable} onChange={set('guia_responsable')} placeholder="Rafael Acosta Bolívar" /></Field>
        </Grid2>
      </Section>

      {/* footer */}
      <div style={{ background: '#1a1d27', border: '1px solid #2e3349', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#6b7394' }}>📷 <strong style={{ color: '#e8ecf5' }}>{photoCount}</strong> / 27 fotos adjuntas</span>
        <span style={{ fontSize: 11, color: '#6b7394' }}>FORMULARIO <strong style={{ color: '#1e6fff' }}>{formNo}</strong></span>
      </div>

      <button type="submit" disabled={loading}
        style={{ width: '100%', padding: 14, background: loading ? '#3d4466' : 'linear-gradient(135deg,#1e6fff 0%,#1458cc 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'GUARDANDO...' : '✓ REGISTRAR INSPECCIÓN'}
      </button>
    </form>
  )
}
