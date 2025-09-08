-- Enable extensions used
create extension if not exists pgcrypto;
create extension if not exists pgsodium;

-- Core tables
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null,
  thumbnail_url text,
  website_url text,
  socials jsonb not null default '{}'::jsonb,
  owner_wallet text not null,
  status text not null default 'published' check (status in ('draft','published','archived')),
  donation_wallet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  category text
);

create table if not exists public.agent_tags (
  agent_id uuid not null references public.agents(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (agent_id, tag_id)
);

create table if not exists public.agent_interfaces (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  kind text not null check (kind in ('api','web_ui')),
  url text not null,
  access_policy text check (access_policy in ('public','key_required')),
  key_request_url text,
  is_primary boolean not null default false,
  display_name text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_agent_interfaces_primary on public.agent_interfaces(agent_id) where is_primary;

-- Performance indexes for common reads
create index if not exists idx_agents_status_created_at on public.agents (status, created_at desc);
create index if not exists idx_agents_owner_wallet on public.agents (owner_wallet);
create index if not exists idx_agent_interfaces_agent_id on public.agent_interfaces (agent_id);
create index if not exists idx_agent_tags_agent_id on public.agent_tags (agent_id);
create index if not exists idx_agent_tags_tag_id on public.agent_tags (tag_id);

-- Anti-replay nonce store
create table if not exists public.used_nonces (
  nonce text primary key,
  created_at timestamptz not null default now()
);

-- Ed25519 verification (base64 inputs)
create or replace function public.ed25519_verify_b64(sig_b64 text, msg text, pubkey_b64 text)
returns boolean
language sql
immutable
as $$
  select pgsodium.crypto_sign_verify_detached(
    decode(sig_b64, 'base64'),
    convert_to(msg, 'utf8'),
    decode(pubkey_b64, 'base64')
  );
$$;

-- Canonical message builder for signed create (versioned)
create or replace function public.build_agent_create_message(
  p_slug text,
  p_name text,
  p_summary text,
  p_thumbnail_url text,
  p_website_url text,
  p_primary_kind text,
  p_primary_url text,
  p_primary_access text,
  p_primary_key_request_url text,
  p_secondary jsonb,
  p_tag_slugs text[],
  p_owner_wallet_base58 text,
  p_donation_wallet text,
  p_nonce text,
  p_ts timestamptz
) returns text
language sql
immutable
as $$
  select
    'v1' || E'\n' ||
    coalesce(p_slug,'') || E'\n' ||
    coalesce(p_name,'') || E'\n' ||
    coalesce(p_summary,'') || E'\n' ||
    coalesce(p_thumbnail_url,'') || E'\n' ||
    coalesce(p_website_url,'') || E'\n' ||
    coalesce(p_primary_kind,'') || E'\n' ||
    coalesce(p_primary_url,'') || E'\n' ||
    coalesce(p_primary_access,'') || E'\n' ||
    coalesce(p_primary_key_request_url,'') || E'\n' ||
    (
      select string_agg(
        (coalesce(s->>'kind','') || '|' ||
         coalesce(s->>'url','') || '|' ||
         coalesce(s->>'access','') || '|' ||
         coalesce(s->>'keyRequestUrl','') || '|' ||
         coalesce(s->>'displayName','') || '|' ||
         coalesce(s->>'notes','')),
        E'\n'
        order by coalesce(s->>'displayName',''), coalesce(s->>'url','')
      )
      from jsonb_array_elements(coalesce(p_secondary, '[]'::jsonb)) as s
    ) || E'\n' ||
    (
      select string_agg(t, E'\n' order by t) from unnest(coalesce(p_tag_slugs, array[]::text[])) as t
    ) || E'\n' ||
    coalesce(p_owner_wallet_base58,'') || E'\n' ||
    coalesce(p_donation_wallet,'') || E'\n' ||
    coalesce(p_nonce,'') || E'\n' ||
    to_char(p_ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
$$;

-- Signed RPC to create agent and relations
create or replace function public.create_agent_signed(
  p_slug text,
  p_name text,
  p_summary text,
  p_thumbnail_url text,
  p_website_url text,
  p_primary_kind text,
  p_primary_url text,
  p_primary_access text,
  p_primary_key_request_url text,
  p_secondary jsonb,
  p_tag_slugs text[],
  p_owner_wallet_base58 text,
  p_donation_wallet text,
  p_pubkey_b64 text,
  p_sig_b64 text,
  p_nonce text,
  p_ts timestamptz
) returns table (id uuid, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg text;
  v_id uuid;
  v_slug text;
begin
  if p_ts < now() - interval '5 minutes' or p_ts > now() + interval '5 minutes' then
    raise exception 'signature timestamp out of window';
  end if;

  begin
    insert into public.used_nonces(nonce) values (p_nonce);
  exception when unique_violation then
    raise exception 'nonce already used';
  end;

  v_msg := public.build_agent_create_message(
    p_slug, p_name, p_summary, p_thumbnail_url, p_website_url,
    p_primary_kind, p_primary_url, p_primary_access, p_primary_key_request_url,
    p_secondary, p_tag_slugs, p_owner_wallet_base58, p_donation_wallet, p_nonce, p_ts
  );

  if not public.ed25519_verify_b64(p_sig_b64, v_msg, p_pubkey_b64) then
    raise exception 'invalid signature';
  end if;

  v_slug := p_slug;
  for i in 2..1000 loop
    exit when not exists (select 1 from public.agents where slug = v_slug);
    v_slug := p_slug || '-' || i::text;
  end loop;

  insert into public.agents(slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet)
  values (v_slug, p_name, p_summary, nullif(p_thumbnail_url,''), nullif(p_website_url,''), '{}'::jsonb, p_owner_wallet_base58, 'published', nullif(p_donation_wallet,''))
  returning id into v_id;

  insert into public.agent_interfaces(agent_id, kind, url, access_policy, key_request_url, is_primary)
  values (v_id, p_primary_kind, p_primary_url, nullif(p_primary_access,''), nullif(p_primary_key_request_url,''), true);

  if coalesce(jsonb_array_length(p_secondary),0) > 0 then
    insert into public.agent_interfaces(agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes)
    select
      v_id,
      s->>'kind',
      s->>'url',
      nullif(s->>'access',''),
      nullif(s->>'keyRequestUrl',''),
      false,
      nullif(s->>'displayName',''),
      nullif(s->>'notes','')
    from jsonb_array_elements(p_secondary) as s;
  end if;

  if coalesce(array_length(p_tag_slugs,1),0) > 0 then
    insert into public.agent_tags(agent_id, tag_id)
    select v_id, t.id
    from public.tags t
    where t.slug = any (p_tag_slugs);
  end if;

  return query select v_id, v_slug;
end;
$$;

-- Enable RLS
alter table public.agents enable row level security;
alter table public.agent_interfaces enable row level security;
alter table public.agent_tags enable row level security;

-- Public read policies (allow reads for anonymous)
create policy if not exists agents_read on public.agents
  for select using (true);
create policy if not exists agent_interfaces_read on public.agent_interfaces
  for select using (true);
create policy if not exists agent_tags_read on public.agent_tags
  for select using (true);

-- Strict write policies: block direct writes (use signed RPC)
drop policy if exists agents_insert on public.agents;
create policy agents_insert on public.agents
  for insert with check (false);

drop policy if exists agent_interfaces_insert on public.agent_interfaces;
create policy agent_interfaces_insert on public.agent_interfaces
  for insert with check (false);

drop policy if exists agent_tags_insert on public.agent_tags;
create policy agent_tags_insert on public.agent_tags
  for insert with check (false);

drop policy if exists agents_update on public.agents;
create policy agents_update on public.agents
  for update using (false) with check (false);

drop policy if exists agent_interfaces_update on public.agent_interfaces;
create policy agent_interfaces_update on public.agent_interfaces
  for update using (false) with check (false);

drop policy if exists agent_tags_update on public.agent_tags;
create policy agent_tags_update on public.agent_tags
  for update using (false) with check (false);

-- Allow anon to call the signed RPC
grant execute on function public.create_agent_signed(
  text, text, text, text, text, text, text, text, text, jsonb, text[], text, text, text, text, text, timestamptz
) to anon;



-- Seed data: create all current tags and one example agent
-- Tags (from app catalog); safe to re-run
insert into public.tags (slug, label, category) values
  ('trading','Trading','Crypto & Web3'),
  ('defi','DeFi','Crypto & Web3'),
  ('nft','NFT','Crypto & Web3'),
  ('memecoin','Memecoin','Crypto & Web3'),
  ('research','Research','Crypto & Web3'),
  ('airdrop','Airdrop','Crypto & Web3'),
  ('farming','Farming','Crypto & Web3'),
  ('portfolio','Portfolio','Crypto & Web3'),
  ('risk','Risk','Crypto & Web3'),
  ('sentiment','Sentiment','Crypto & Web3'),
  ('onchain','Onchain','Crypto & Web3'),
  ('swap','Swap','Crypto & Web3'),
  ('wallet','Wallet','Crypto & Web3'),
  ('staking','Staking','Crypto & Web3'),
  ('governance','Governance','Crypto & Web3'),
  ('launch','Launch','Crypto & Web3'),
  ('audit','Audit','Crypto & Web3'),
  ('contract','Contract','Crypto & Web3'),
  ('tx-optimizer','Tx Optimizer','Crypto & Web3'),
  ('signals','Signals','Crypto & Web3'),
  ('project','Project','Business & Productivity'),
  ('schedule','Schedule','Business & Productivity'),
  ('crm','CRM','Business & Productivity'),
  ('sales','Sales','Business & Productivity'),
  ('marketing','Marketing','Business & Productivity'),
  ('copywriting','Copywriting','Business & Productivity'),
  ('presentation','Presentation','Business & Productivity'),
  ('insights','Insights','Business & Productivity'),
  ('hr','HR','Business & Productivity'),
  ('finance','Finance','Business & Productivity'),
  ('legal','Legal','Business & Productivity'),
  ('compliance','Compliance','Business & Productivity'),
  ('procurement','Procurement','Business & Productivity'),
  ('support','Support','Business & Productivity'),
  ('code','Code','Developer & Tech'),
  ('devops','DevOps','Developer & Tech'),
  ('testing','Testing','Developer & Tech'),
  ('debugging','Debugging','Developer & Tech'),
  ('docs','Docs','Developer & Tech'),
  ('api','API','Developer & Tech'),
  ('database','Database','Developer & Tech'),
  ('security','Security','Developer & Tech'),
  ('cloud','Cloud','Developer & Tech'),
  ('infra','Infra','Developer & Tech'),
  ('game-dev','Game Dev','Developer & Tech'),
  ('training','Training','Developer & Tech'),
  ('prompting','Prompting','Developer & Tech'),
  ('content','Content','Creative & Media'),
  ('video','Video','Creative & Media'),
  ('design','Design','Creative & Media'),
  ('music','Music','Creative & Media'),
  ('storytelling','Storytelling','Creative & Media'),
  ('script','Script','Creative & Media'),
  ('3d','3D','Creative & Media'),
  ('fashion','Fashion','Creative & Media'),
  ('architecture','Architecture','Creative & Media'),
  ('photo','Photo','Creative & Media'),
  ('social','Social','Creative & Media'),
  ('meme','Meme','Creative & Media'),
  ('branding','Branding','Creative & Media'),
  ('teaching','Teaching','Knowledge & Education'),
  ('tutoring','Tutoring','Knowledge & Education'),
  ('language','Language','Knowledge & Education'),
  ('exam','Exam','Knowledge & Education'),
  ('summarizer','Summarizer','Knowledge & Education'),
  ('knowledge','Knowledge','Knowledge & Education'),
  ('history','History','Knowledge & Education'),
  ('science','Science','Knowledge & Education'),
  ('math','Math','Knowledge & Education'),
  ('philosophy','Philosophy','Knowledge & Education'),
  ('health','Health','Personal & Lifestyle'),
  ('fitness','Fitness','Personal & Lifestyle'),
  ('nutrition','Nutrition','Personal & Lifestyle'),
  ('mindset','Mindset','Personal & Lifestyle'),
  ('coach','Coach','Personal & Lifestyle'),
  ('travel','Travel','Personal & Lifestyle'),
  ('shopping','Shopping','Personal & Lifestyle'),
  ('budget','Budget','Personal & Lifestyle'),
  ('home','Home','Personal & Lifestyle'),
  ('style','Style','Personal & Lifestyle'),
  ('dating','Dating','Personal & Lifestyle'),
  ('events','Events','Personal & Lifestyle'),
  ('medical','Medical','Specialized'),
  ('biotech','Biotech','Specialized'),
  ('climate','Climate','Specialized'),
  ('energy','Energy','Specialized'),
  ('urban','Urban','Specialized'),
  ('journalism','Journalism','Specialized'),
  ('politics','Politics','Specialized'),
  ('military','Military','Specialized'),
  ('gaming','Gaming','Gaming'),
  ('esports','Esports','Gaming'),
  ('mods','Mods','Gaming'),
  ('streaming','Streaming','Gaming')
on conflict (slug) do nothing;

-- Example agent
insert into public.agents (slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet)
values (
  'starter-agent',
  'Starter Agent',
  'A demo ElizaOS agent.',
  null,
  'https://example.com',
  '{"x":"https://x.com/example"}',
  'DemoWallet111111111111111111111111111111111',
  'published',
  'So11111111111111111111111111111111111111112'
) on conflict (slug) do nothing;

-- Primary web interface for the example agent
insert into public.agent_interfaces (agent_id, kind, url, is_primary)
select a.id, 'web_ui', 'https://example.com', true
from public.agents a
where a.slug = 'starter-agent'
and not exists (
  select 1 from public.agent_interfaces i where i.agent_id = a.id and i.kind = 'web_ui' and i.url = 'https://example.com'
);

-- Link example agent to a few tags
insert into public.agent_tags (agent_id, tag_id)
select a.id, t.id from public.agents a join public.tags t on t.slug = 'branding' where a.slug = 'starter-agent'
on conflict do nothing;

insert into public.agent_tags (agent_id, tag_id)
select a.id, t.id from public.agents a join public.tags t on t.slug = 'content' where a.slug = 'starter-agent'
on conflict do nothing;

insert into public.agent_tags (agent_id, tag_id)
select a.id, t.id from public.agents a join public.tags t on t.slug = 'presentation' where a.slug = 'starter-agent'
on conflict do nothing;

