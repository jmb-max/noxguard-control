# NoxGuard Control

Sistema de inspecciones operativas para PSI / Nox Guard.

## Stack
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Supabase (Auth + Database + Storage)

## Setup

### 1. Variables de entorno
```bash
cp .env.local.example .env.local
# Editar con sus datos de Supabase
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar base de datos
En Supabase → SQL Editor, ejecutar el contenido de `supabase/schema.sql`

### 4. Correr en desarrollo
```bash
npm run dev
```

### 5. Deploy en Vercel
1. Push a GitHub
2. Conectar repo en Vercel
3. Agregar variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Roles de usuario
- `guard` — Solo ve formularios y sus propios registros
- `supervisor` — Ve todos los registros + dashboard
- `admin` — Gestión completa

Para cambiar rol de un usuario, ejecutar en Supabase SQL:
```sql
update profiles set role = 'supervisor' where id = 'UUID';
```
