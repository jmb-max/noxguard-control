'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { userId: string; userEmail: string }

const inp: React.CSSProperties = { background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 8, padding: '10px 12px', color: '#0B1D3A', fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, minHeight: 72, resize: 'vertical' as const }

const CHECK_ITEMS = [
  { id: 'amortiguadores', label: 'Amortiguadores' },
  { id: 'manubrio', label: 'Manubrio' },
  { id: 'tanque', label: 'Tanque' },
  { id: 'espejosRetrovisores', label: 'Espejos Retrovisores' },
  { id: 'pito', label: 'Pito' },
  { id: 'guardaBarrosDelantero', label: 'Guarda Barros Delantero' },
  { id: 'guardaBarrosTrasero', label: 'Guarda Barros Trasero' },
  { id: 'sillin', label: 'Sillín' },
  { id: 'maniguetas', label: 'Maniguetas' },
  { id: 'placaMotoCheck', label: 'Placa Moto' },
  { id: 'exhosto', label: 'Exhosto' },
  { id: 'grabadoLlantas', label: 'Estado Grabado Llantas' },
  { id: 'presionLlantas', label: 'Llantas Presión' },
  { id: 'aseoGeneral', label: 'Aseo General' },
  { id: 'starter', label: 'Starter' },
  { id: 'lucesAltas', label: 'Luces Altas' },
  { id: 'lucesBajas', label: 'Luces Bajas' },
  { id: 'direccionales', label: 'Direccionales' },
  { id: 'stop', label: 'Stop' },
  { id: 'luzTablero', label: 'Luz Tablero' },
  { id: 'frenos', label: 'Frenos' },
  { id: 'embrague', label: 'Embrague' },
  { id: 'acelerador', label: 'Acelerador' },
  { id: 'choque', label: 'Choque' },
  { id: 'patadaEncendido', label: 'Patada De Encendido' },
  { id: 'cadena', label: 'Cadena' },
  { id: 'pinonArrastre', label: 'Piñón de Arrastre' },
]

function Section({ num, icon, title, children }: { num: number; icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 12, boxShadow: '0 2px 8px rgba(11,29,58,0.08)', marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #D0D9E8', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(90deg,#F0F5FF 0%,white 100%)' }}>
        <div style={{ width: 24, height: 24, background: '#0B1D3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{num}</div>
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
function G2({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div> }
interface Photo { preview: string; name: string }
function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: Photo | null; onChange: (v: Photo | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const h = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onChange({ preview: ev.target?.result as string, name: f.name }); r.readAsDataURL(f) }
  return <Field label={label}>{value?(<div style={{position:'relative'}}><img src={value.preview} alt={id} style={{width:'100%',height:90,objectFit:'cover',borderRadius:8,border:'2px solid #15803D',display:'block'}}/><button type="button" onClick={()=>onChange(null)} style={{position:'absolute',top:4,right:4,background:'#DC2626',border:'none',borderRadius:4,color:'#fff',fontSize:10,padding:'2px 6px',cursor:'pointer'}}>✕</button></div>):(<><div onClick={()=>ref.current?.click()} style={{border:'2px dashed #D0D9E8',borderRadius:8,background:'#F4F1EB',height:72,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:3}}><span style={{fontSize:18}}>📷</span><span style={{fontSize:10,color:'#7A90B0',fontWeight:600}}>Adjuntar</span></div><input ref={ref} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={h}/></>)}</Field>
}

export default function ChequeoMotoForm({ userId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const now = new Date(); const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [f, setF] = useState({
    fechaHora: localISO, placaUnidad: '', cedulaAgente: '', nombreAgente: '', celular: '', ubicacion: '',
    placaMoto: '', propiedadMoto: 'Propia', kmInicial: '', kmFinal: '',
    observaciones: '',
  })

  // Estado de cada ítem: true=OK, false=NOK
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECK_ITEMS.map(i => [i.id, true]))
  )

  const [photos, setPhotos] = useState<Record<string, Photo | null>>({ fotoMoto1: null, fotoKilometraje: null, fotoPlacaMoto: null })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))
  const setCheck = (id: string, val: boolean) => setChecks(c => ({ ...c, [id]: val }))

  const nokItems = CHECK_ITEMS.filter(i => !checks[i.id]).map(i => i.label)
  const okCount = CHECK_ITEMS.length - nokItems.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('chequeos_moto').insert({
      form_no: formNo, guard_id: userId,
      fecha_hora: f.fechaHora, placa_unidad: f.placaUnidad, cedula_agente: f.cedulaAgente,
      nombre_agente: f.nombreAgente, celular: f.celular, ubicacion: f.ubicacion,
      placa_moto: f.placaMoto, propiedad_moto: f.propiedadMoto,
      km_inicial: f.kmInicial ? parseInt(f.kmInicial) : null,
      km_final: f.kmFinal ? parseInt(f.kmFinal) : null,
      checklist: checks,
      items_nok: nokItems,
      observaciones: f.observaciones,
      fotos: { moto1: photos.fotoMoto1?.name || null, km: photos.fotoKilometraje?.name || null, placa: photos.fotoPlacaMoto?.name || null },
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>¡Chequeo Registrado!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{formNo} · {okCount}/{CHECK_ITEMS.length} ítems OK</div>
        {nokItems.length > 0 && (
          <div style={{ marginTop: 12, background: 'rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#fff' }}>
            ⚠️ NOK: {nokItems.join(', ')}
          </div>
        )}
      </div>
      <button onClick={() => setSubmitted(false)} style={{ marginTop: 16, width: '100%', padding: 14, background: '#fff', border: '2px solid #0B1D3A', borderRadius: 8, color: '#0B1D3A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Volver</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>

      <div style={{ marginBottom: 16 }}>
        <a href="/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B1D3A', textDecoration: 'none' }}>
          ← Volver a formularios
        </a>
      </div>

      <Section num={1} icon="👤" title="Datos del Agente">
        <G2>
          <Field label="Fecha y Hora"><input style={inp} type="datetime-local" value={f.fechaHora} onChange={set('fechaHora')} /></Field>
          <Field label="Placa Unidad (Halcon)" req><input style={inp} value={f.placaUnidad} onChange={up('placaUnidad')} placeholder="HAL001" /></Field>
          <Field label="Cédula Agente" req><input style={inp} value={f.cedulaAgente} onChange={set('cedulaAgente')} placeholder="1040843672" /></Field>
          <Field label="Nombres y Apellidos" req><input style={inp} value={f.nombreAgente} onChange={set('nombreAgente')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
          <Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Pereira" /></Field>
        </G2>
      </Section>

      <Section num={2} icon="🏍️" title="Datos de la Moto">
        <G2>
          <Field label="No. Placa Moto" req><input style={inp} value={f.placaMoto} onChange={up('placaMoto')} placeholder="ABC123" /></Field>
          <Field label="Propiedad de">
            <select style={inp} value={f.propiedadMoto} onChange={set('propiedadMoto')}>
              <option value="Propia">Propia</option><option value="Empresa">Empresa</option>
            </select>
          </Field>
          <Field label="Kilometraje Inicial"><input style={inp} type="number" value={f.kmInicial} onChange={set('kmInicial')} placeholder="12500" /></Field>
          <Field label="Kilometraje Final"><input style={inp} type="number" value={f.kmFinal} onChange={set('kmFinal')} placeholder="12650" /></Field>
        </G2>
      </Section>

      <Section num={3} icon="✅" title="Lista de Chequeo">
        {/* Contador */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, background: '#DCFCE7', border: '1px solid #15803D', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D', fontFamily: 'monospace' }}>{okCount}</div>
            <div style={{ fontSize: 10, color: '#15803D', fontWeight: 600 }}>OK</div>
          </div>
          <div style={{ flex: 1, background: nokItems.length > 0 ? '#FEE2E2' : '#F4F1EB', border: `1px solid ${nokItems.length > 0 ? '#DC2626' : '#D0D9E8'}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: nokItems.length > 0 ? '#DC2626' : '#7A90B0', fontFamily: 'monospace' }}>{nokItems.length}</div>
            <div style={{ fontSize: 10, color: nokItems.length > 0 ? '#DC2626' : '#7A90B0', fontWeight: 600 }}>NOK</div>
          </div>
          <div style={{ flex: 1, background: '#F4F1EB', border: '1px solid #D0D9E8', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1D3A', fontFamily: 'monospace' }}>{CHECK_ITEMS.length}</div>
            <div style={{ fontSize: 10, color: '#7A90B0', fontWeight: 600 }}>Total</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CHECK_ITEMS.map(item => (
            <div key={item.id} style={{ background: checks[item.id] ? '#DCFCE7' : '#FEE2E2', border: `1.5px solid ${checks[item.id] ? '#15803D' : '#DC2626'}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => setCheck(item.id, !checks[item.id])}>
              <div style={{ fontSize: 10, fontWeight: 600, color: checks[item.id] ? '#15803D' : '#DC2626', marginBottom: 3 }}>
                {checks[item.id] ? '✓ OK' : '✕ NOK'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: checks[item.id] ? '#166534' : '#991B1B' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {nokItems.length > 0 && (
          <div style={{ marginTop: 12, background: '#FFF7ED', border: '1px solid #F97316', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', marginBottom: 4 }}>⚠️ Ítems NOK:</div>
            <div style={{ fontSize: 12, color: '#C2410C' }}>{nokItems.join(' · ')}</div>
          </div>
        )}
      </Section>

      <Section num={4} icon="📝" title="Observaciones y Evidencia">
        <Field label="Observaciones">
          <textarea style={ta} value={f.observaciones} onChange={set('observaciones')} placeholder="Sin novedad" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          <PhotoField id="fotoMoto1" label="Foto general moto" value={photos.fotoMoto1} onChange={sp('fotoMoto1')} />
          <PhotoField id="fotoKilometraje" label="Foto kilometraje" value={photos.fotoKilometraje} onChange={sp('fotoKilometraje')} />
          <PhotoField id="fotoPlacaMoto" label="Foto placa" value={photos.fotoPlacaMoto} onChange={sp('fotoPlacaMoto')} />
        </div>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Chequeo →'}
      </button>
    </form>
  )
}
