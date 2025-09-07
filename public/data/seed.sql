-- Seed aligned with migration 0001_init.sql
-- Tags catalog
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

