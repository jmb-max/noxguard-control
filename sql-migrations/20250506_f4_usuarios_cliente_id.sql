-- F4: Agregar cliente_id a usuarios para vistas por rol
-- Permite filtrar dashboard automáticamente según el cliente asignado al usuario
-- Aplica a roles: cliente, coordinador (cuando tienen cliente asignado)
-- Supervisores filtran por zona (columna ya existente)

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS cliente_id UUID
  REFERENCES public.clientes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.usuarios.cliente_id IS
  'Cliente asignado al usuario. Usado por roles cliente/coordinador para defaultFilters en dashboard.';
