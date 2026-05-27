# NoxGuard Control

Plataforma operativa de PSI / NoxGuard para captura de inspecciones, seguimiento de novedades, dashboard unificado, administración de usuarios/clientes/puestos y consulta asistida por IA sobre datos operacionales.

**Producción:** https://noxguard-control.vercel.app/dashboard  
**Repo:** `github.com/jmb-max/noxguard-control`  
**Stack real verificado:** Next.js 16 App Router + React 19 + Supabase + Tailwind 4 + Vercel.

> Nota para nuevos desarrolladores: este proyecto usa Next.js 16. Revisar `AGENTS.md` antes de tocar código; no asumir convenciones de Next.js 14.

---

## Estado actual

- App en producción en Vercel.
- Auth con Supabase SSR.
- 11 formularios operativos conectados a Supabase.
- Dashboard basado en `v_eventos_unificados`.
- Panel Admin para usuarios, clientes, puestos y monitoreo IA.
- Mapa Leaflet SSR-safe.
- Feed en vivo con Supabase Realtime.
- Gráficas con Recharts.
- Chat IA con Anthropic y RPC `chat_query`.

Última verificación local: `npm run build` exitoso.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js `16.2.4` App Router |
| React | `19.2.4` |
| TypeScript | `^5` |
| Tailwind | `^4` |
| Supabase SSR | `@supabase/ssr ^0.10.2` |
| Supabase JS | `@supabase/supabase-js ^2.105.1` |
| Mapas | Leaflet `1.9.4`, React Leaflet `5.0.0` |
| Gráficas | Recharts `3.8.1` |
| IA | `@anthropic-ai/sdk ^0.93.0` |
| Deploy | Vercel conectado a `main` |

---

## Setup local

### 1. Clonar

```bash
git clone https://github.com/jmb-max/noxguard-control.git
cd noxguard-control
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completar los valores reales por canal seguro:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

No commitear `.env.local` ni secretos.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Verificar build

```bash
npm run build
```

### 5. Correr desarrollo

```bash
npm run dev
```

---

## Variables de entorno

| Variable | Uso | Dónde se requiere |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase | cliente + servidor + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key Supabase para cliente/autenticación | cliente + servidor + Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | operaciones admin/server-side, usuarios, migraciones y diagnósticos | solo servidor/Vercel/local seguro |
| `ANTHROPIC_API_KEY` | Chat IA (`/api/chat`) | solo servidor/Vercel/local seguro |

---

## Estructura principal

```text
src/
  app/
    dashboard/
      page.tsx              # Server Component: queries, filtros, KPIs
      DashboardClient.tsx   # UI dashboard, filtros, CSV, zonas visuales
      admin/
        page.tsx            # acceso admin
        AdminClient.tsx     # tabs usuarios/clientes/puestos/IA
    forms/
      page.tsx              # listado de formularios
      <11 formularios>/     # un formulario por operación
    api/
      admin/usuarios/route.ts # CRUD usuarios + auth.users con service role
      chat/route.ts           # Chat IA text-to-SQL controlado
    login/page.tsx
    tools/cierres-ara/page.tsx
  components/
    ContextoOperativo.tsx   # cliente/puesto/GPS/novedad compartido
    MapaPuestos.tsx         # mapa Leaflet SSR-safe
    FeedEnVivo.tsx          # feed realtime sobre tablas físicas
    GraficasZona5.tsx       # gráficas Recharts
    ChatIA.tsx              # widget IA flotante
    Header.tsx
  lib/supabase/
    client.ts
    server.ts
  middleware.ts             # auth middleware; Next 16 recomienda migrar a proxy eventualmente
  types/index.ts

sql-migrations/             # migraciones idempotentes aplicadas durante F0-F7
supabase/schema.sql          # schema base; puede estar por detrás de la BD real
SQL_TABLES.sql              # schema inicial de formularios
```

---

## Formularios operativos

Hay 11 formularios React/TSX, cada uno escribiendo a su tabla específica:

1. `inspecciones_contenedor`
2. `control_armas`
3. `atencion_alarmas`
4. `supervision_diaria`
5. `supervision_general`
6. `chequeos_moto`
7. `alertas_riesgos`
8. `ronda_ingenio`
9. `ronda_hospital`
10. `visita_cliente`
11. `descargues_ara`

Todos deben usar `ContextoOperativo` para:

- cliente
- puesto
- GPS (`coords_lat`, `coords_lng`)
- novedad (`tiene_novedad`, `descripcion_novedad`)

**Regla:** no duplicar captura GPS dentro de formularios individuales. El flujo único de GPS es `ContextoOperativo`.

---

## Dashboard

Ruta: `/dashboard`

Funcionalidad:

- KPIs: hoy, semana, mes, total, novedades.
- Vista unificada `v_eventos_unificados`.
- Filtros serializados por URL params.
- Filtros por fecha, cliente, puesto, tipo y novedad.
- Exportación CSV.
- Mapa + feed en vivo.
- Gráficas Recharts.
- Chat IA flotante.
- Vistas por rol.

---

## Panel Admin

Ruta: `/dashboard/admin`

Incluye:

- usuarios
- clientes
- puestos
- monitoreo IA

API usuarios: `/api/admin/usuarios`

- `POST`: crea usuario en `auth.users`, luego inserta en `usuarios`. Si falla la inserción, hace rollback de auth.
- `PATCH`: edita usuario en tabla `usuarios`.
- `DELETE`: elimina de `usuarios` y después de `auth.users`.

---

## Roles

Roles usados en el sistema:

- `directivo`
- `coordinador`
- `supervisor`
- `guarda`
- `cliente`
- `admin` — validar si se conserva como rol formal o solo técnico.

Reglas principales:

- `cliente`: scope forzado por `cliente_id`; no puede escapar por URL.
- `coordinador`: puede tener `cliente_id` precargado y modificable.
- `supervisor`: puede tener `zona` precargada.
- `directivo/admin`: sin restricciones.

---

## Supabase

Proyecto Supabase registrado históricamente:

```text
tyfzjqzcpgwcjnxozaaf
```

Tablas principales:

- `usuarios`
- `clientes`
- `puestos`
- 11 tablas de formularios
- `ia_usage`

Vista principal:

- `v_eventos_unificados`

RPCs relevantes:

- `exec_sql` — diagnóstico/migraciones controladas.
- `chat_query` — consultas permitidas para Chat IA. Usa parámetro `p_sql`, no `sql`.

---

## Pitfalls conocidos

1. `README` anterior estaba desactualizado: Next.js 14/roles en inglés ya no aplican.
2. No usar copias viejas del repo como fuente; fuente canónica: repo GitHub + `/root/projects/noxguard-control` en este servidor.
3. Leaflet rompe SSR si se importa directo. Mantener dynamic import con `ssr: false` desde componente cliente.
4. Supabase Realtime no escucha vistas; el feed se suscribe a tablas físicas y re-fetch de `v_eventos_unificados`.
5. No mezclar resultados de Supabase SDK y `fetch()` en el mismo destructuring de `Promise.all`.
6. `chat_query` usa `{ p_sql: sql }`.
7. No hardcodear `SUPABASE_SERVICE_ROLE_KEY` ni `ANTHROPIC_API_KEY`.
8. `supabase/schema.sql` puede estar por detrás de la BD real. Revisar `sql-migrations/` y Supabase real antes de migrar.
9. Next.js 16 marca `middleware` como deprecado; migrar a `proxy` eventualmente, no como cambio urgente.

---

## Validación antes de entregar cambios

```bash
git status -sb
npm run build
```

Validaciones funcionales recomendadas:

1. `/login` carga.
2. Login con usuario autorizado.
3. `/dashboard` muestra KPIs, mapa, feed y gráficas.
4. `/dashboard/admin` carga usuarios/clientes/puestos.
5. Crear un registro de prueba en un formulario y confirmar que aparece en dashboard.
6. Probar Chat IA si `ANTHROPIC_API_KEY` está configurada.

---

## Handoff extendido

Documento técnico generado para continuidad:

```text
/root/psi-comercial/nox-cloud/NoxGuard_Control_Handoff_Tecnico_2026-05-27.md
/root/psi-comercial/nox-cloud/NoxGuard_Control_Handoff_Tecnico_2026-05-27.pdf
/root/psi-comercial/nox-cloud/NoxGuard_Control_Handoff_Tecnico_2026-05-27.docx
```
