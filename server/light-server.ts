/*
  Lightweight production-like server
  - Endpoints:
    GET /tags
    GET /api/agents/:idOrSlugOrWallet
    GET /api/agents?tags=slug1,slug2&match=all|any&page=1&limit=20
  - Config via env:
    LIGHT_SERVER_PORT (default 8787)
    LIGHT_SERVER_API_BASE_PATH (default /api)
    LIGHT_SERVER_RPM (default 120)
    LIGHT_SERVER_MAX_LIMIT (default 50)
    LIGHT_SERVER_STRICT_TAGS (default true)
    VITE_DATA_MODE (local|online|seed)
    LIGHT_SERVER_UPSTREAM_SUPABASE_URL (optional, online)
    LIGHT_SERVER_UPSTREAM_SUPABASE_ANON_KEY (optional, online)
*/

type IncomingMessage = import('http').IncomingMessage
type ServerResponse = import('http').ServerResponse

const PORT = Number(process.env.LIGHT_SERVER_PORT || 8787)
const API_BASE = String(process.env.LIGHT_SERVER_API_BASE_PATH || '/api').replace(/\/$/, '')
const MAX_LIMIT = Math.max(1, Math.min(200, parseInt(process.env.LIGHT_SERVER_MAX_LIMIT || '50', 10) || 50))
const STRICT_TAGS = String(process.env.LIGHT_SERVER_STRICT_TAGS || 'true').toLowerCase() === 'true'
const RPM = Math.max(10, Math.min(600, parseInt(process.env.LIGHT_SERVER_RPM || '120', 10) || 120))
const MODE = (process.env.VITE_DATA_MODE || 'local').toLowerCase()
const SUPA_URL = process.env.LIGHT_SERVER_UPSTREAM_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_ANON = process.env.LIGHT_SERVER_UPSTREAM_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const windowMs = 60_000
const bucket = new Map<string, { count: number; resetAt: number }>()
function rateLimit(key: string): boolean {
  const now = Date.now()
  const b = bucket.get(key)
  if (!b || b.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= RPM) return false
  b.count += 1
  return true
}

function json(res: ServerResponse, code: number, body: any) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function handleLocal(req: IncomingMessage, res: ServerResponse, url: URL) {
  const { getDb, listAgentsWithRelations } = await import('../src/db/pglite')

  if (req.method === 'GET' && (url.pathname === '/tags' || url.pathname === API_BASE + '/tags')) {
    const db = await getDb()
    const { rows } = await db.query(`select id, slug, label, category from tags order by label asc`)
    return json(res, 200, rows)
  }

  if (req.method === 'GET' && url.pathname.startsWith(API_BASE + '/agents/')) {
    const key = decodeURIComponent(url.pathname.replace(API_BASE + '/agents/', ''))
    const db = await getDb()
    let row: any = null
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(key)
    if (isUuid) {
      const { rows } = await db.query(`select id from agents where id = $1 limit 1`, [key])
      row = rows[0] || null
    } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)) {
      const { rows } = await db.query(`select id from agents where agent_wallet = $1 limit 1`, [key])
      row = rows[0] || null
    } else {
      const { rows } = await db.query(`select id from agents where slug = $1 limit 1`, [key])
      row = rows[0] || null
    }
    if (!row) return json(res, 404, { error: 'Agent not found' })
    const { getAgentById } = await import('../src/db/pglite')
    const agent = await (getAgentById as any)(row.id)
    return json(res, 200, agent)
  }

  if (req.method === 'GET' && url.pathname === API_BASE + '/agents') {
    const tagsParam = url.searchParams.get('tags') || ''
    const match = (url.searchParams.get('match') || 'all').toLowerCase()
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const tagSlugs = (tagsParam ? tagsParam.split(',') : []).map(s => s.trim()).filter(Boolean)
    const db = await getDb()
    if (tagSlugs.length) {
      const { rows: valid } = await db.query(`select slug from tags where slug = any($1)`, [tagSlugs])
      const validSlugs = new Set(valid.map((r: any) => r.slug))
      const unknown = tagSlugs.filter(s => !validSlugs.has(s))
      if (unknown.length && STRICT_TAGS) return json(res, 400, { error: 'Unknown tag(s)', unknown })
      if (unknown.length && !STRICT_TAGS) {
        for (const u of unknown) {
          const idx = tagSlugs.indexOf(u)
          if (idx >= 0) tagSlugs.splice(idx, 1)
        }
      }
    }
    const all = await listAgentsWithRelations()
    let filtered = all as any[]
    if (tagSlugs.length) {
      if (match === 'any') {
        filtered = all.filter((a: any) => a.tags.some((t: any) => tagSlugs.includes(t.slug)))
      } else {
        filtered = all.filter((a: any) => tagSlugs.every(s => a.tags.some((t: any) => t.slug === s)))
      }
    }
    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)
    return json(res, 200, { items, page, limit, total })
  }

  return json(res, 404, { error: 'Not found' })
}

async function handleOnline(req: IncomingMessage, res: ServerResponse, url: URL) {
  if (!SUPA_URL || !SUPA_ANON) return json(res, 500, { error: 'Supabase env not set' })
  const headers = { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` }

  if (req.method === 'GET' && (url.pathname === '/tags' || url.pathname === API_BASE + '/tags')) {
    const r = await fetch(`${SUPA_URL}/rest/v1/tags?select=id,slug,label,category&order=label.asc`, { headers })
    const data = await r.json()
    return json(res, r.status, data)
  }

  if (req.method === 'GET' && url.pathname.startsWith(API_BASE + '/agents/')) {
    const key = decodeURIComponent(url.pathname.replace(API_BASE + '/agents/', ''))
    const param = /^[0-9a-fA-F-]{36}$/.test(key)
      ? `id=eq.${encodeURIComponent(key)}`
      : (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key) ? `agent_wallet=eq.${encodeURIComponent(key)}` : `slug=eq.${encodeURIComponent(key)}`)
    const r = await fetch(`${SUPA_URL}/rest/v1/agents_with_relations?${param}`, { headers })
    const data = await r.json()
    return json(res, r.status, data)
  }

  if (req.method === 'GET' && url.pathname === API_BASE + '/agents') {
    const tagsParam = url.searchParams.get('tags') || ''
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const tagSlugs = (tagsParam ? tagsParam.split(',') : []).map(s => s.trim()).filter(Boolean)
    if (!tagSlugs.length) {
      const r = await fetch(`${SUPA_URL}/rest/v1/agents_with_relations?order=created_at.desc&limit=${limit}`, { headers })
      const data = await r.json()
      return json(res, r.status, { items: data, page: 1, limit, total: data.length })
    }
    const encoded = `%7B${encodeURIComponent(tagSlugs.join(','))}%7D`
    const r = await fetch(`${SUPA_URL}/rest/v1/agents_with_relations?tag_slugs=cs.${encoded}&limit=${limit}`, { headers })
    const data = await r.json()
    return json(res, r.status, { items: data, page: 1, limit, total: data.length })
  }

  return json(res, 404, { error: 'Not found' })
}

import('http').then(({ createServer }) => {
  const server = createServer(async (req, res) => {
    try {
      const ip = (req.socket as any).remoteAddress || 'local'
      if (!rateLimit(ip)) return json(res, 429, { error: 'Too many requests' })
      const url = new URL(req.url || '/', 'http://localhost')
      if (MODE === 'online') return handleOnline(req, res, url)
      return handleLocal(req, res, url)
    } catch (e: any) {
      return json(res, 500, { error: e?.message || 'Server error' })
    }
  })
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[light-server] listening on http://localhost:${PORT}`)
  })
})


