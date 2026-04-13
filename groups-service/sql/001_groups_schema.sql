create extension if not exists pgcrypto;

create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(255) not null,
  descripcion text,
  creador_id uuid not null references usuarios(id) on delete restrict,
  creado_en timestamptz not null default now()
);

create unique index if not exists ux_grupos_nombre
  on grupos(nombre);

create table if not exists grupo_miembros (
  grupo_id uuid not null references grupos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  fecha_unido timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);

create table if not exists grupo_usuario_permisos (
  group_id uuid not null references grupos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  permiso_id uuid not null references permisos(id) on delete cascade,
  primary key (group_id, usuario_id, permiso_id)
);

create index if not exists idx_grupo_miembros_usuario_id
  on grupo_miembros(usuario_id);

create index if not exists idx_grupo_usuario_permisos_usuario_group
  on grupo_usuario_permisos(usuario_id, group_id);
