'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  userEmail: string
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border mb-4 overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(30,111,255,0.08)' }}>
        <span>{icon}</span>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          {title}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className="flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider border transition-all"
        style={{
          borderColor: value ? 'var(--success)' : 'var(--border)',
          background: value ? 'rgba(0,192,122,0.13)' : 'var(--surface-high)',
          color: value ? 'var(--success)' : 'var(--text-muted)',
        }}>SI</button>
      <button type="button" onClick={() => onChange(false)}
        className="flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider border transition-all"
        style={{
          borderColor: !value ? 'var(--danger)' : 'var(--border)',
          background: !value ? 'rgba(255,59,59,0.13)' : 'var(--surface-high)',
          color: !value ? 'var(--danger)' : 'var(--text-muted)',
        }}>NO</button>
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}

export default function InspeccionContenedorForm({ userId, userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formNo, setFormNo] = useState('')

  // Estado del formulario
  const [f, setF] = useState({
    usuario_gestor: userEmail,
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    placa_veh: '', cedula_conductor: '', nombre_conductor: '', celular_conductor: '',
    ubicacion: 'BARRANQUILLA, ATLÁNTICO',
    tamano_contenedor: '40',
    num_contenedor: '',
    sello_botella: '', sello_sticker: '', sello_guaya: '', sello_asignado: '', sello_adicional: '',
    sello_satelital: true, dispositivo_sat: '',
    sello_recibido: true,
    lugar_llenado: '', muelle: '',
    insp_tec_apellidos: '', insp_tec_nombres: '', insp_tec_doc: '',
    empresa: '', marca_vehiculo: '', placa_vehiculo: '', placa_remolque: '',
    conductor_nombre: '', conductor_doc: '',
    guia_apellidos: '', guia_nombre: '', guia_doc: '',
    can_nombre: '', can_raza: '', can_microchip: '',
    insp_vehiculo: true, insp_veh_hora_inicio: '', insp_veh_hora_fin: '', insp_veh_obs: '',
    insp_contenedor: true, insp_cont_hora_inicio: '', insp_cont_hora_fin: '', insp_cont_obs: '',
    insp_mercancia: true, insp_merc_hora_inicio: '', insp_merc_hora_fin: '', insp_merc_obs: '',
    hora_inicio_llenado: '', hora_fin_llenado: '',
    responsable_llenado: '', doc_responsable: '',
    obs_final: '',
    fecha_salida: new Date().toISOString().split('T')[0],
    guia_responsable: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(prev => ({ ...prev, [key]: e.target.value }))

  const setUpper = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [key]: e.target.value.toUpperCase() }))

  const setToggle = (key: string) => (v: boolean) =>
    setF(prev => ({ ...prev, [key]: v }))

  const calcDuracion = (inicio: string, fin: string) => {
    if (!inicio || !fin) return '--'
    const [h1, m1] = inicio.split(':').map(Number)
    const [h2, m2] = fin.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    return diff >= 0 ? `${diff} min` : '--'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const no = `No.${Math.floor(Math.random() * 900) + 100}`

    const { error } = await supabase
      .from('inspecciones_contenedor')
      .insert({
        form_no: no,
        guard_id: userId,
        ...f,
        sello_satelital: f.sello_satelital,
        sello_recibido: f.sello_recibido,
        insp_vehiculo: f.insp_vehiculo,
        insp_contenedor: f.insp_contenedor,
        insp_mercancia: f.insp_mercancia,
      })

    if (error) {
      console.error(error)
      alert('Error al guardar: ' + error.message)
      setLoading(false)
    } else {
      setFormNo(no)
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="rounded-xl border p-8"
          style={{ background: 'var(--surface)', borderColor: 'var(--success)' }}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--success)' }}>
            Inspección Registrada
          </h2>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Formulario <strong style={{ color: 'var(--accent)' }}>{formNo}</strong>
          </div>
          <div className="text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
            {new Date().toLocaleString('es-CO')}
          </div>
          <button
            onClick={() => { setSubmitted(false); setF(prev => ({ ...prev, num_contenedor: '', placa_veh: '' })) }}
            className="px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            ← NUEVO REGISTRO
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-4 pb-24">

      {/* Tipo */}
      <div className="mb-4">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
          Tipo de Inspección
        </p>
        <div className="flex gap-2">
          <div className="flex-1 p-3 rounded-lg border text-center text-xs font-bold"
            style={{ borderColor: 'var(--accent)', background: 'rgba(30,111,255,0.1)', color: 'var(--accent)' }}>
            📦 Contenedores
          </div>
          <div className="flex-1 p-3 rounded-lg border text-center text-xs opacity-30"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            🚛 Vehículo
          </div>
          <div className="flex-1 p-3 rounded-lg border text-center text-xs opacity-30"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            👤 Personal
          </div>
        </div>
      </div>

      <Section icon="👤" title="Datos Generales">
        <Grid2>
          <Field label="Usuario Gestor" required>
            <input value={f.usuario_gestor} onChange={set('usuario_gestor')} />
          </Field>
          <Field label="Fecha Elaboración">
            <input type="date" value={f.fecha_elaboracion} onChange={set('fecha_elaboracion')} />
          </Field>
          <Field label="Placa del Vehículo" required>
            <input value={f.placa_veh} onChange={setUpper('placa_veh')} placeholder="NUX271" />
          </Field>
          <Field label="Cédula Conductor" required>
            <input value={f.cedula_conductor} onChange={set('cedula_conductor')} placeholder="1040843672" />
          </Field>
          <Field label="Nombres y Apellidos" required>
            <input value={f.nombre_conductor} onChange={set('nombre_conductor')} placeholder="Pedro Gómez Valencia" />
          </Field>
          <Field label="Celular">
            <input value={f.celular_conductor} onChange={set('celular_conductor')} placeholder="300 000 0000" />
          </Field>
        </Grid2>
        <Field label="Ubicación">
          <input value={f.ubicacion} onChange={set('ubicacion')} />
        </Field>
      </Section>

      <Section icon="📦" title="Información Unidad de Cargue">
        <Grid2>
          <Field label="Tamaño Contenedor" required>
            <select value={f.tamano_contenedor} onChange={set('tamano_contenedor')}>
              <option value="20">20 ft</option>
              <option value="40">40 ft</option>
              <option value="45">45 ft</option>
            </select>
          </Field>
          <Field label="Número Contenedor" required>
            <input value={f.num_contenedor} onChange={setUpper('num_contenedor')} placeholder="MRKU481291(6)" />
          </Field>
        </Grid2>
      </Section>

      <Section icon="🔒" title="Sellos y Dispositivos">
        <Grid2>
          <Field label="N° Sello Botella">
            <input value={f.sello_botella} onChange={setUpper('sello_botella')} placeholder="CKF5570" />
          </Field>
          <Field label="N° Sello Sticker">
            <input value={f.sello_sticker} onChange={setUpper('sello_sticker')} placeholder="H75347R" />
          </Field>
          <Field label="N° Sello Guaya">
            <input value={f.sello_guaya} onChange={setUpper('sello_guaya')} placeholder="CKD8891" />
          </Field>
          <Field label="N° Sello Asignado">
            <input value={f.sello_asignado} onChange={setUpper('sello_asignado')} placeholder="01150862" />
          </Field>
          <Field label="N° Sello Adicional">
            <input value={f.sello_adicional} onChange={setUpper('sello_adicional')} placeholder="ST029243" />
          </Field>
        </Grid2>

        <hr style={{ borderColor: 'var(--border)' }} />

        <Grid2>
          <Field label="Sello Satelital">
            <Toggle value={f.sello_satelital} onChange={setToggle('sello_satelital')} />
          </Field>
          {f.sello_satelital && (
            <Field label="N° Dispositivo Satelital">
              <input value={f.dispositivo_sat} onChange={setUpper('dispositivo_sat')} placeholder="B981027" />
            </Field>
          )}
        </Grid2>

        <Field label="Sello Recibido del Contenedor">
          <Toggle value={f.sello_recibido} onChange={setToggle('sello_recibido')} />
        </Field>
      </Section>

      <Section icon="📍" title="Lugar de Llenado">
        <Grid2>
          <Field label="Lugar Llenado" required>
            <input value={f.lugar_llenado} onChange={set('lugar_llenado')} placeholder="Alfacer" />
          </Field>
          <Field label="Muelle">
            <input value={f.muelle} onChange={set('muelle')} placeholder="4" />
          </Field>
        </Grid2>
      </Section>

      <Section icon="🔧" title="Inspección Técnica">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Apellidos Inspector">
            <input value={f.insp_tec_apellidos} onChange={set('insp_tec_apellidos')} placeholder="Acuña" />
          </Field>
          <Field label="Nombres Inspector">
            <input value={f.insp_tec_nombres} onChange={set('insp_tec_nombres')} placeholder="Alfredo" />
          </Field>
          <Field label="Documento">
            <input value={f.insp_tec_doc} onChange={set('insp_tec_doc')} placeholder="1143440223" />
          </Field>
        </div>
      </Section>

      <Section icon="🚛" title="Proveedor de Transporte">
        <Grid2>
          <Field label="Empresa Transportadora">
            <input value={f.empresa} onChange={set('empresa')} placeholder="Transcont" />
          </Field>
          <Field label="Marca Vehículo">
            <input value={f.marca_vehiculo} onChange={set('marca_vehiculo')} placeholder="Volkswagen" />
          </Field>
          <Field label="Placa Vehículo">
            <input value={f.placa_vehiculo} onChange={setUpper('placa_vehiculo')} placeholder="NUX271" />
          </Field>
          <Field label="Placa Remolque">
            <input value={f.placa_remolque} onChange={setUpper('placa_remolque')} placeholder="S84919" />
          </Field>
          <Field label="Nombre Conductor">
            <input value={f.conductor_nombre} onChange={set('conductor_nombre')} placeholder="Gómez Pedro" />
          </Field>
          <Field label="Documento Conductor">
            <input value={f.conductor_doc} onChange={set('conductor_doc')} placeholder="1040843672" />
          </Field>
        </Grid2>
      </Section>

      <Section icon="🐕" title="Binomio Canino">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Apellidos Guía">
            <input value={f.guia_apellidos} onChange={set('guia_apellidos')} placeholder="Acosta" />
          </Field>
          <Field label="Nombre Guía">
            <input value={f.guia_nombre} onChange={set('guia_nombre')} placeholder="Bolívar" />
          </Field>
          <Field label="Documento">
            <input value={f.guia_doc} onChange={set('guia_doc')} placeholder="8796733" />
          </Field>
          <Field label="Nombre del Can">
            <input value={f.can_nombre} onChange={set('can_nombre')} placeholder="Ice" />
          </Field>
          <Field label="Raza">
            <input value={f.can_raza} onChange={set('can_raza')} placeholder="Labrador" />
          </Field>
          <Field label="Microchip">
            <input value={f.can_microchip} onChange={set('can_microchip')} placeholder="959#580" />
          </Field>
        </div>
      </Section>

      <Section icon="🔍" title="Inspecciones Antinarcóticos">
        {[
          { key: 'insp_vehiculo', label: 'Unidad de Carga', hiKey: 'insp_veh_hora_inicio', hfKey: 'insp_veh_hora_fin', obsKey: 'insp_veh_obs' },
          { key: 'insp_contenedor', label: 'Contenedor', hiKey: 'insp_cont_hora_inicio', hfKey: 'insp_cont_hora_fin', obsKey: 'insp_cont_obs' },
          { key: 'insp_mercancia', label: 'Mercancía', hiKey: 'insp_merc_hora_inicio', hfKey: 'insp_merc_hora_fin', obsKey: 'insp_merc_obs' },
        ].map(insp => (
          <div key={insp.key} className="rounded-lg p-3 border mb-2"
            style={{ background: 'var(--surface-high)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: 'var(--text-muted)' }}>— {insp.label}</p>

            <Field label="Realizada">
              <Toggle
                value={f[insp.key as keyof typeof f] as boolean}
                onChange={setToggle(insp.key)}
              />
            </Field>

            {f[insp.key as keyof typeof f] && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Hora Inicio">
                    <input type="time" value={f[insp.hiKey as keyof typeof f] as string}
                      onChange={set(insp.hiKey)} />
                  </Field>
                  <Field label="Hora Término">
                    <input type="time" value={f[insp.hfKey as keyof typeof f] as string}
                      onChange={set(insp.hfKey)} />
                  </Field>
                  <Field label="Duración">
                    <input readOnly
                      value={calcDuracion(f[insp.hiKey as keyof typeof f] as string, f[insp.hfKey as keyof typeof f] as string)}
                      style={{ color: 'var(--text-muted)' }} />
                  </Field>
                </div>
                <Field label="Observaciones">
                  <textarea value={f[insp.obsKey as keyof typeof f] as string}
                    onChange={set(insp.obsKey)} placeholder="Ninguna" />
                </Field>
              </div>
            )}
          </div>
        ))}
      </Section>

      <Section icon="⏱" title="Proceso de Llenado">
        <Grid2>
          <Field label="Hora Inicio">
            <input type="time" value={f.hora_inicio_llenado} onChange={set('hora_inicio_llenado')} />
          </Field>
          <Field label="Hora Finaliza">
            <input type="time" value={f.hora_fin_llenado} onChange={set('hora_fin_llenado')} />
          </Field>
          <Field label="Responsable Llenado">
            <input value={f.responsable_llenado} onChange={set('responsable_llenado')} placeholder="Alfredo Acuña" />
          </Field>
          <Field label="Documento Responsable">
            <input value={f.doc_responsable} onChange={set('doc_responsable')} placeholder="1143440223" />
          </Field>
        </Grid2>
        <Field label="Observaciones Finales">
          <textarea value={f.obs_final} onChange={set('obs_final')}
            placeholder="Ej: Se cargaron 1.511 cajas de NEXT en 39 estibas" />
        </Field>
      </Section>

      <Section icon="✍️" title="Cierre y Responsable">
        <Grid2>
          <Field label="Fecha de Salida Planta">
            <input type="date" value={f.fecha_salida} onChange={set('fecha_salida')} />
          </Field>
          <Field label="Guía Canino Responsable">
            <input value={f.guia_responsable} onChange={set('guia_responsable')} placeholder="Rafael Acosta Bolívar" />
          </Field>
        </Grid2>
      </Section>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="fixed bottom-0 left-0 right-0 py-4 text-white font-bold text-sm tracking-widest uppercase transition-colors"
        style={{ background: loading ? 'var(--text-dim)' : 'var(--accent)' }}>
        {loading ? 'GUARDANDO...' : '✓ REGISTRAR INSPECCIÓN'}
      </button>
    </form>
  )
}
