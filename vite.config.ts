import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  console.log('[Vite env]', {
    VITE_DATA_MODE: env.VITE_DATA_MODE,
    hasSupabaseUrl: Boolean(env.VITE_SUPABASE_URL),
    hasSupabaseAnon: Boolean(env.VITE_SUPABASE_ANON_KEY),
  })
  return {
    plugins: [
      tailwindcss(),
      react(),
      // Local API endpoints when running in local mode
      {
        name: 'local-api',
        configureServer(server) {
          const isLocal = (env.VITE_DATA_MODE || '').toLowerCase() === 'local'
          if (!isLocal) return
          const basePath = (env.VITE_LOCAL_API_BASE_PATH || '/api').replace(/\/$/, '')
          const maxLimit = Math.max(1, Math.min(200, parseInt(env.VITE_LOCAL_API_MAX_LIMIT || '50', 10) || 50))
          const strictTags = String(env.VITE_LOCAL_API_STRICT_TAGS || 'true').toLowerCase() === 'true'
          const rpm = Math.max(10, Math.min(600, parseInt(env.VITE_LOCAL_API_RPM || '120', 10) || 120))
          const windowMs = 60_000
          const bucket = new Map<string, { count: number; resetAt: number }>()
          function rateLimit(key: string): boolean {
            const now = Date.now()
            const b = bucket.get(key)
            if (!b || b.resetAt < now) {
              bucket.set(key, { count: 1, resetAt: now + windowMs })
              return true
            }
            if (b.count >= rpm) return false
            b.count += 1
            return true
          }
          server.middlewares.use(async (req, res, next) => {
            try {
              if (!req.url || !req.method) return next()
              const isTagsRoot = req.url === '/tags'
              if (!req.url.startsWith(basePath + '/') && !isTagsRoot) return next()
              const ip = (req.socket as any).remoteAddress || 'local'
              if (!rateLimit(ip)) {
                res.statusCode = 429
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ error: 'Too many requests' }))
              }
              const { getDb, listAgentsWithRelations } = await import('./src/db/pglite')
              const url = new URL(req.url, 'http://localhost')
              const send = (code: number, data: any) => {
                res.statusCode = code
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(data))
              }
              if (req.method === 'GET' && (url.pathname === basePath + '/tags' || url.pathname === '/tags')) {
                const db = await getDb()
                const { rows } = await db.query(`select id, slug, label, category from tags order by label asc`)
                return send(200, rows)
              }
              if (req.method === 'GET' && url.pathname.startsWith(basePath + '/agents/')) {
                const key = decodeURIComponent(url.pathname.replace(basePath + '/agents/', ''))
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
                if (!row) return send(404, { error: 'Agent not found' })
                const { getAgentById } = await import('./src/db/pglite')
                const agent = await (getAgentById as any)(row.id)
                return send(200, agent)
              }
              if (req.method === 'GET' && url.pathname === basePath + '/agents') {
                const tagsParam = url.searchParams.get('tags') || ''
                const match = (url.searchParams.get('match') || 'all').toLowerCase()
                const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
                const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
                const tagSlugs = (tagsParam ? tagsParam.split(',') : []).map(s => s.trim()).filter(Boolean)
                const db = await getDb()
                if (tagSlugs.length) {
                  const { rows: valid } = await db.query(`select slug from tags where slug = any($1)`, [tagSlugs])
                  const validSlugs = new Set(valid.map((r: any) => r.slug))
                  const unknown = tagSlugs.filter(s => !validSlugs.has(s))
                  if (unknown.length && strictTags) return send(400, { error: 'Unknown tag(s)', unknown })
                  if (unknown.length && !strictTags) {
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
                return send(200, { items, page, limit, total })
              }
              return next()
            } catch (e: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: e?.message || 'Server error' }))
            }
          })
        },
      },
    ],
    // Vitest configuration
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      css: true,
    },
  }
})
