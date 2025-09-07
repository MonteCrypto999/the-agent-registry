export const SCHEMA_SQL = `
create table if not exists agents (
  id text primary key,
  slug text not null unique,
  name text not null,
  summary text not null,
  thumbnail_url text,
  website_url text,
  socials jsonb default '{}'::jsonb,
  owner_wallet text not null,
  status text not null default 'published',
  donation_wallet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id text primary key,
  slug text not null unique,
  label text not null,
  category text
);

create table if not exists agent_tags (
  agent_id text not null references agents(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (agent_id, tag_id)
);

create table if not exists agent_interfaces (
  id text primary key,
  agent_id text not null references agents(id) on delete cascade,
  kind text not null check (kind in ('api','web_ui')),
  url text not null,
  access_policy text check (access_policy in ('public','key_required')),
  key_request_url text,
  is_primary boolean not null default false,
  display_name text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_interfaces_primary on agent_interfaces(agent_id) where is_primary;
`;


