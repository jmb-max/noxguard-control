import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST — Crear usuario ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, rol, zona, cliente_id, ruta, placa } = await request.json()

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Crear en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Insertar en tabla usuarios
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        auth_id: authUser.user!.id,
        nombre,
        email,
        rol,
        zona: zona || null,
        cliente_id: cliente_id || null,
        ruta: ruta || null,
        placa: placa || null,
        activo: true,
      })

    if (dbError) {
      // Rollback: eliminar de auth si falla la BD
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, user: authUser.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH — Editar usuario ───────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { id, nombre, rol, zona, cliente_id, activo } = await request.json()

    if (!id) return NextResponse.json({ error: 'Falta el id del usuario' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (nombre  !== undefined) updates.nombre    = nombre
    if (rol     !== undefined) updates.rol       = rol
    if (zona    !== undefined) updates.zona      = zona || null
    if (cliente_id !== undefined) updates.cliente_id = cliente_id || null
    if (activo  !== undefined) updates.activo    = activo

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update(updates)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE — Eliminar usuario ────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Falta el id del usuario' }, { status: 400 })

    // Buscar auth_id antes de eliminar
    const { data: u, error: findError } = await supabaseAdmin
      .from('usuarios')
      .select('auth_id')
      .eq('id', id)
      .single()

    if (findError || !u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    // Eliminar de tabla usuarios
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

    // Eliminar de auth.users (si tiene auth_id)
    if (u.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(u.auth_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
