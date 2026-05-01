'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { userId: string; userEmail: string }

const inp: React.CSSProperties = { background: '#F4F1EB', border: '1.5px solid #D0D9E8', borderRadius: 8, padding: '10px 12px', color: '#0B1D3A', fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

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
function G2({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div> }
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <div style={{ display: 'flex', gap: 8 }}>{[true,false].map(v => <button key={String(v)} type="button" onClick={() => onChange(v)} style={{ flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: `1.5px solid ${value===v?(v?'#15803D':'#DC2626'):'#D0D9E8'}`, background: value===v?(v?'#DCFCE7':'#FEE2E2'):'#F4F1EB', color: value===v?(v?'#15803D':'#DC2626'):'#7A90B0' }}>{v?'✓ SÍ':'✕ NO'}</button>)}</div>
}
interface Photo { preview: string; name: string }
function PhotoField({ id, label, value, onChange }: { id: string; label: string; value: Photo | null; onChange: (v: Photo | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const h = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onChange({ preview: ev.target?.result as string, name: f.name }); r.readAsDataURL(f) }
  return <Field label={label}>{value?(<div style={{position:'relative'}}><img src={value.preview} alt={id} style={{width:'100%',height:90,objectFit:'cover',borderRadius:8,border:'2px solid #15803D',display:'block'}}/><button type="button" onClick={()=>onChange(null)} style={{position:'absolute',top:4,right:4,background:'#DC2626',border:'none',borderRadius:4,color:'#fff',fontSize:10,padding:'2px 6px',cursor:'pointer'}}>✕</button></div>):(<><div onClick={()=>ref.current?.click()} style={{border:'2px dashed #D0D9E8',borderRadius:8,background:'#F4F1EB',height:72,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:3}}><span style={{fontSize:18}}>📷</span><span style={{fontSize:10,color:'#7A90B0',fontWeight:600}}>Adjuntar</span></div><input ref={ref} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={h}/></>)}</Field>
}

export default function AtencionAlarmasForm({ userId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo] = useState(`No.${Math.floor(Math.random() * 9000) + 1000}`)
  const now = new Date(); const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16)

  const [f, setF] = useState({
    fechaHoraEnviado: localISO, placaVeh: '', cedulaAgente: '', nombreAgente: '', celular: '', ubicacion: '',
    numeroCuenta: '', nombreCliente: '', direccionCliente: '', localidad: '', tipoCliente: 'Mixto',
    atencionPor: '', codigoEvento: '', observaNovedad: false, descripcionNovedad: '',
    reporteRevision: '',
  })
  const [photos, setPhotos] = useState<Record<string, Photo | null>>({ fotoAlarma1: null, fotoAlarma2: null })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
  const tog = (k: string) => (v: boolean) => setF(p => ({ ...p, [k]: v }))
  const sp = (k: string) => (v: Photo | null) => setPhotos(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('atencion_alarmas').insert({
      form_no: formNo, guard_id: userId,
      fecha_hora: f.fechaHoraEnviado, placa_veh: f.placaVeh, cedula_agente: f.cedulaAgente,
      nombre_agente: f.nombreAgente, celular: f.celular, ubicacion: f.ubicacion,
      numero_cuenta: f.numeroCuenta, nombre_cliente: f.nombreCliente,
      direccion_cliente: f.direccionCliente, localidad: f.localidad, tipo_cliente: f.tipoCliente,
      atencion_por: f.atencionPor, codigo_evento: f.codigoEvento,
      observa_novedad: f.observaNovedad, descripcion_novedad: f.descripcionNovedad,
      reporte_revision: f.reporteRevision,
      fotos: { foto1: photos.fotoAlarma1?.name || null, foto2: photos.fotoAlarma2?.name || null },
    })
    if (error) { alert('Error: ' + error.message); setLoading(false) }
    else { setSubmitted(true); setLoading(false) }
  }

  if (submitted) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg,#15803D 0%,#166534 100%)', borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>¡Alarma Registrada!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{formNo}</div>
      </div>
      <button onClick={() => setSubmitted(false)} style={{ marginTop: 16, width: '100%', padding: 14, background: '#fff', border: '2px solid #0B1D3A', borderRadius: 8, color: '#0B1D3A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Volver</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>

      <div style={{ marginBottom: 12 }}>
        <a href="/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B1D3A', textDecoration: 'none' }}>
          ← Volver a formularios
        </a>
      </div>

      {/* Título */}
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B1D3A', margin: 0 }}>Atención de Alarmas</h1>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '4px 0 0', fontWeight: 500 }}>Reporte de atención y verificación perimetral</p>
      </div>

      {/* Progreso */}
      {(() => { const req = [f.placaVeh, f.cedulaAgente, f.nombreAgente, f.numeroCuenta, f.nombreCliente, f.atencionPor]; const p = Math.round(req.filter(Boolean).length / req.length * 100); return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0' }}>PROGRESO</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1D3A' }}>{p}%</span>
          </div>
          <div style={{ height: 6, background: '#D0D9E8', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${p}%`, background: p === 100 ? '#15803D' : '#F05A28', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )})()}

      <Section num={1} icon="👤" title="Datos del Agente">
        <G2>
          <Field label="Fecha y Hora"><input style={inp} type="datetime-local" value={f.fechaHoraEnviado} onChange={set('fechaHoraEnviado')} /></Field>
          <Field label="Placa" req><input style={inp} value={f.placaVeh} onChange={up('placaVeh')} placeholder="NUX271" /></Field>
          <Field label="Cédula" req><input style={inp} value={f.cedulaAgente} onChange={set('cedulaAgente')} placeholder="1040843672" /></Field>
          <Field label="Nombres y Apellidos" req><input style={inp} value={f.nombreAgente} onChange={set('nombreAgente')} placeholder="Pedro Gómez" /></Field>
          <Field label="Celular"><input style={inp} type="tel" value={f.celular} onChange={set('celular')} placeholder="300 000 0000" /></Field>
          <Field label="Ubicación"><input style={inp} value={f.ubicacion} onChange={set('ubicacion')} placeholder="Dirección" /></Field>
        </G2>
      </Section>

      <Section num={2} icon="🏪" title="Datos del Cliente">
        <G2>
          <Field label="Cuenta / Número"><input style={inp} value={f.numeroCuenta} onChange={set('numeroCuenta')} placeholder="001" /></Field>
          <Field label="Nombre del Cliente" req><input style={inp} value={f.nombreCliente} onChange={set('nombreCliente')} placeholder="Tienda ARA Centro" /></Field>
          <Field label="Dirección"><input style={inp} value={f.direccionCliente} onChange={set('direccionCliente')} placeholder="Calle 20 # 7-40" /></Field>
          <Field label="Localidad / Ciudad"><input style={inp} value={f.localidad} onChange={set('localidad')} placeholder="Pereira" /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Tipo de Cliente">
              <select style={inp} value={f.tipoCliente} onChange={set('tipoCliente')}>
                {['Mixto','Residencial','Comercial','Industrial'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>
        </G2>
      </Section>

      <Section num={3} icon="🔔" title="Detalle de la Alarma">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Atención de alarma por" req><input style={inp} value={f.atencionPor} onChange={set('atencionPor')} placeholder="Nombre del agente que atiende" /></Field>
          <Field label="Código y Evento"><input style={inp} value={f.codigoEvento} onChange={set('codigoEvento')} placeholder="E24 — Sensor movimiento zona A" /></Field>
          <Field label="¿Observa Novedad?"><Toggle value={f.observaNovedad} onChange={tog('observaNovedad')} /></Field>
          {f.observaNovedad && (
            <Field label="Descripción de la Novedad">
              <textarea style={ta} value={f.descripcionNovedad} onChange={set('descripcionNovedad')} placeholder="Describir la novedad observada..." />
            </Field>
          )}
          <Field label="Reporte de Revisión / Descripción" req>
            <textarea style={{ ...ta, minHeight: 96 }} value={f.reporteRevision} onChange={set('reporteRevision')} placeholder="Describir lo encontrado al llegar al puesto, revisión realizada y resultado..." />
          </Field>
        </div>
      </Section>

      <Section num={4} icon="📷" title="Evidencia Fotográfica">
        <G2>
          <PhotoField id="fotoAlarma1" label="Foto del lugar 1" value={photos.fotoAlarma1} onChange={sp('fotoAlarma1')} />
          <PhotoField id="fotoAlarma2" label="Foto del lugar 2" value={photos.fotoAlarma2} onChange={sp('fotoAlarma2')} />
        </G2>
      </Section>

      <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? '#7A90B0' : 'linear-gradient(135deg,#F05A28 0%,#FF7A4A 100%)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(240,90,40,0.3)' }}>
        {loading ? 'Guardando...' : 'Registrar Atención →'}
      </button>
    </form>
  )
}
