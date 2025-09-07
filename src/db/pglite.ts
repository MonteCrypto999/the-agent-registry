import { PGlite } from '@electric-sql/pglite'
import { SCHEMA_SQL } from './schema'
import { AGENTS, TAGS } from '../seed'
import type { CreateAgentInput, UpdateAgentInput } from '../types'

let dbPromise: Promise<PGlite> | null = null

async function seedIfEmpty(db: PGlite) {
  const { rows: countRows } = await db.query<{ count: string }>(`select count(*)::int as count from agents`)
  const count = Number(countRows?.[0]?.count ?? 0)
  if (count > 0) return

  // Try to load SQL seed from public/data/seed.sql if available (browser only)
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/data/seed.sql')
      if (res.ok) {
        const sql = await res.text()
        if (sql.trim().length) {
          await db.exec(sql)
          return
        }
      }
    }
  } catch (_) {
    // ignore and fallback to TS seed
  }

  // insert tags
  for (const t of TAGS) {
    await db.query(
      `insert into tags (id, slug, label, category) values ($1,$2,$3,$4) on conflict (id) do nothing`,
      [t.id, t.slug, t.label, (t as any).category ?? null],
    )
  }

  // insert agents, interfaces, agent_tags
  for (const a of AGENTS) {
    await db.query(
      `insert into agents (id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) on conflict (id) do nothing`,
      [
        a.id,
        a.slug,
        a.name,
        a.summary,
        a.thumbnailUrl ?? null,
        a.websiteUrl ?? null,
        JSON.stringify(a.socials ?? {}),
        a.ownerWallet,
        a.status,
        (a as any).donationWallet ?? null,
      ],
    )
    for (const i of a.interfaces) {
      await db.query(
        `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
        [
          i.id,
          a.id,
          i.kind,
          i.url,
          i.accessPolicy ?? null,
          i.keyRequestUrl ?? null,
          i.isPrimary,
          i.displayName ?? null,
          i.notes ?? null,
        ],
      )
    }
    for (const t of a.tags) {
      await db.query(
        `insert into agent_tags (agent_id, tag_id) values ($1,$2) on conflict do nothing`,
        [a.id, t.id],
      )
    }
  }
}

export async function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite()
      await db.exec(SCHEMA_SQL)
      await seedIfEmpty(db)
      return db
    })()
  }
  return dbPromise
}

export async function listAgentsWithRelations() {
  const db = await getDb()
  const { rows: agents } = await db.query(
    `select id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet, created_at from agents where status = 'published' order by created_at desc`,
  )
  const ids = agents.map((a: any) => a.id)
  if (ids.length === 0) return []

  const { rows: interfaces } = await db.query(
    `select id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes from agent_interfaces where agent_id = any($1)`,
    [ids],
  )
  const { rows: tagRows } = await db.query(
    `select at.agent_id, t.id, t.slug, t.label, t.category from agent_tags at join tags t on t.id = at.tag_id where at.agent_id = any($1)`,
    [ids],
  )

  return agents.map((a: any) => {
    const its = interfaces.filter((i: any) => i.agent_id === a.id).map((i: any) => ({
      id: i.id,
      agentId: i.agent_id,
      kind: i.kind,
      url: i.url,
      accessPolicy: i.access_policy,
      keyRequestUrl: i.key_request_url,
      isPrimary: i.is_primary,
      displayName: i.display_name,
      notes: i.notes,
    }))
    const tgs = tagRows.filter((t: any) => t.agent_id === a.id).map((t: any) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
      category: t.category,
    }))
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      summary: a.summary,
      thumbnailUrl: a.thumbnail_url,
      websiteUrl: a.website_url,
      socials: a.socials,
      ownerWallet: a.owner_wallet,
      status: a.status,
      donationWallet: a.donation_wallet,
      createdAt: a.created_at,
      interfaces: its,
      tags: tgs,
    }
  })
}

export async function getAgentById(id: string) {
  const db = await getDb()
  const { rows: arows } = await db.query(
    `select id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet, created_at from agents where id = $1 limit 1`,
    [id],
  )
  if (!arows.length) return null
  const a: any = arows[0]
  const { rows: interfaces } = await db.query(
    `select id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes from agent_interfaces where agent_id = $1`,
    [id],
  )
  const { rows: tagRows } = await db.query(
    `select t.id, t.slug, t.label, t.category from agent_tags at join tags t on t.id = at.tag_id where at.agent_id = $1`,
    [id],
  )
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    summary: a.summary,
    thumbnailUrl: a.thumbnail_url,
    websiteUrl: a.website_url,
    socials: a.socials,
    ownerWallet: a.owner_wallet,
    status: a.status,
    donationWallet: a.donation_wallet,
    createdAt: a.created_at,
    interfaces: interfaces.map((i: any) => ({
      id: i.id,
      agentId: i.agent_id,
      kind: i.kind,
      url: i.url,
      accessPolicy: i.access_policy,
      keyRequestUrl: i.key_request_url,
      isPrimary: i.is_primary,
      displayName: i.display_name,
      notes: i.notes,
    })),
    tags: tagRows.map((t: any) => ({ id: t.id, slug: t.slug, label: t.label, category: t.category })),
  }
}

export async function createAgent(input: CreateAgentInput) {
  const db = await getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  // ensure unique slug; append -2, -3, ... if needed
  let slug = input.slug
  if (!slug || !slug.trim()) throw new Error('Slug required')
  const base = slug
  let n = 1
  while (true) {
    const { rows } = await db.query(`select 1 from agents where slug=$1 limit 1`, [slug])
    if (!rows.length) break
    n += 1
    slug = `${base}-${n}`
  }

  await db.query(
    `insert into agents (id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, created_at, updated_at, donation_wallet)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,coalesce($9,'published'),$10,$10,$11)`,
    [
      id,
      slug,
      input.name,
      input.summary,
      input.thumbnailUrl ?? null,
      input.websiteUrl ?? null,
      JSON.stringify(input.socials ?? {}),
      input.ownerWallet,
      input.status ?? 'published',
      now,
      input.donationWallet ?? null,
    ],
  )

  const ifaceId = crypto.randomUUID()
  await db.query(
    `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary)
     values ($1,$2,$3,$4,$5,$6,true)`,
    [
      ifaceId,
      id,
      input.primaryInterface.kind,
      input.primaryInterface.url,
      input.primaryInterface.accessPolicy ?? null,
      input.primaryInterface.keyRequestUrl ?? null,
    ],
  )

  if (input.secondaryInterfaces && input.secondaryInterfaces.length) {
    for (const s of input.secondaryInterfaces) {
      const sid = crypto.randomUUID()
      await db.query(
        `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes)
         values ($1,$2,$3,$4,$5,$6,false,$7,$8)`,
        [
          sid,
          id,
          s.kind,
          s.url,
          s.accessPolicy ?? null,
          s.keyRequestUrl ?? null,
          s.displayName ?? null,
          s.notes ?? null,
        ],
      )
    }
  }

  if (input.tagSlugs && input.tagSlugs.length) {
    const { rows: tagRows } = await db.query(`select id, slug from tags where slug = any($1)`, [input.tagSlugs])
    for (const t of tagRows as any[]) {
      await db.query(`insert into agent_tags (agent_id, tag_id) values ($1,$2) on conflict do nothing`, [id, t.id])
    }
  }

  return { id, slug }
}

export async function updateAgentBySlug(slug: string, input: UpdateAgentInput) {
  const db = await getDb()
  const now = new Date().toISOString()
  const { rows } = await db.query(`select id from agents where slug = $1`, [slug])
  if (!rows?.length) throw new Error('Agent not found')
  const id = (rows as any[])[0].id as string

  await db.query(
    `update agents set
       name = coalesce($2,name),
       summary = coalesce($3,summary),
       thumbnail_url = coalesce($4,thumbnail_url),
       website_url = coalesce($5,website_url),
       socials = coalesce($6::jsonb, socials),
       status = coalesce($7,status),
       updated_at = $8,
       donation_wallet = coalesce($9, donation_wallet)
     where id = $1`,
    [
      id,
      input.name ?? null,
      input.summary ?? null,
      input.thumbnailUrl ?? null,
      input.websiteUrl ?? null,
      input.socials ? JSON.stringify(input.socials) : null,
      input.status ?? null,
      now,
      input.donationWallet ?? null,
    ],
  )

  if (input.primaryInterface) {
    // ensure a primary exists; update it or create one
    const { rows: pri } = await db.query(`select id from agent_interfaces where agent_id=$1 and is_primary`, [id])
    if (pri.length) {
      await db.query(
        `update agent_interfaces set kind=$2, url=$3, access_policy=$4, key_request_url=$5 where id=$1`,
        [
          (pri as any[])[0].id,
          input.primaryInterface.kind,
          input.primaryInterface.url,
          input.primaryInterface.accessPolicy ?? null,
          input.primaryInterface.keyRequestUrl ?? null,
        ],
      )
    } else {
      const newId = crypto.randomUUID()
      await db.query(
        `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary)
         values ($1,$2,$3,$4,$5,$6,true)`,
        [
          newId,
          id,
          input.primaryInterface.kind,
          input.primaryInterface.url,
          input.primaryInterface.accessPolicy ?? null,
          input.primaryInterface.keyRequestUrl ?? null,
        ],
      )
    }
  }

  if (input.secondaryInterfaces) {
    // Simple strategy: delete all non-primary and re-insert from input
    await db.query(`delete from agent_interfaces where agent_id=$1 and not is_primary`, [id])
    if (input.secondaryInterfaces.length) {
      for (const s of input.secondaryInterfaces) {
        const sid = crypto.randomUUID()
        await db.query(
          `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes)
           values ($1,$2,$3,$4,$5,$6,false,$7,$8)`,
          [
            sid,
            id,
            s.kind,
            s.url,
            s.accessPolicy ?? null,
            s.keyRequestUrl ?? null,
            s.displayName ?? null,
            s.notes ?? null,
          ],
        )
      }
    }
  }

  if (input.tagSlugs) {
    await db.query(`delete from agent_tags where agent_id=$1`, [id])
    if (input.tagSlugs.length) {
      const { rows: tagRows } = await db.query(`select id, slug from tags where slug = any($1)`, [input.tagSlugs])
      for (const t of tagRows as any[]) {
        await db.query(`insert into agent_tags (agent_id, tag_id) values ($1,$2) on conflict do nothing`, [id, t.id])
      }
    }
  }
}

export async function updateAgentById(id: string, input: UpdateAgentInput) {
  const db = await getDb()
  const now = new Date().toISOString()
  const { rows } = await db.query(`select id from agents where id = $1`, [id])
  if (!rows?.length) throw new Error('Agent not found')

  await db.query(
    `update agents set
       name = coalesce($2,name),
       summary = coalesce($3,summary),
       thumbnail_url = coalesce($4,thumbnail_url),
       website_url = coalesce($5,website_url),
       socials = coalesce($6::jsonb, socials),
       status = coalesce($7,status),
       updated_at = $8,
       donation_wallet = coalesce($9, donation_wallet)
     where id = $1`,
    [
      id,
      input.name ?? null,
      input.summary ?? null,
      input.thumbnailUrl ?? null,
      input.websiteUrl ?? null,
      input.socials ? JSON.stringify(input.socials) : null,
      input.status ?? null,
      now,
      input.donationWallet ?? null,
    ],
  )

  if (input.primaryInterface) {
    const { rows: pri } = await db.query(`select id from agent_interfaces where agent_id=$1 and is_primary`, [id])
    if (pri.length) {
      await db.query(
        `update agent_interfaces set kind=$2, url=$3, access_policy=$4, key_request_url=$5 where id=$1`,
        [
          (pri as any[])[0].id,
          input.primaryInterface.kind,
          input.primaryInterface.url,
          input.primaryInterface.accessPolicy ?? null,
          input.primaryInterface.keyRequestUrl ?? null,
        ],
      )
    } else {
      const newId = crypto.randomUUID()
      await db.query(
        `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary)
         values ($1,$2,$3,$4,$5,$6,true)`,
        [
          newId,
          id,
          input.primaryInterface.kind,
          input.primaryInterface.url,
          input.primaryInterface.accessPolicy ?? null,
          input.primaryInterface.keyRequestUrl ?? null,
        ],
      )
    }
  }

  if (input.secondaryInterfaces) {
    await db.query(`delete from agent_interfaces where agent_id=$1 and not is_primary`, [id])
    if (input.secondaryInterfaces.length) {
      for (const s of input.secondaryInterfaces) {
        const sid = crypto.randomUUID()
        await db.query(
          `insert into agent_interfaces (id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes)
           values ($1,$2,$3,$4,$5,$6,false,$7,$8)`,
          [
            sid,
            id,
            s.kind,
            s.url,
            s.accessPolicy ?? null,
            s.keyRequestUrl ?? null,
            s.displayName ?? null,
            s.notes ?? null,
          ],
        )
      }
    }
  }

  if (input.tagSlugs) {
    await db.query(`delete from agent_tags where agent_id=$1`, [id])
    if (input.tagSlugs.length) {
      const { rows: tagRows } = await db.query(`select id, slug from tags where slug = any($1)`, [input.tagSlugs])
      for (const t of tagRows as any[]) {
        await db.query(`insert into agent_tags (agent_id, tag_id) values ($1,$2) on conflict do nothing`, [id, t.id])
      }
    }
  }
}


