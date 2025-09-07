import { describe, it, expect } from 'vitest'
import { getDb, listAgentsWithRelations } from './pglite'

describe('PGlite local DB', () => {
  it('initializes schema and seeds agents', async () => {
    const db = await getDb()
    const { rows } = await db.query<{ count: number }>(`select count(*)::int as count from agents`)
    expect(Number((rows?.[0] as any)?.count ?? 0)).toBeGreaterThanOrEqual(1)
  })

  it('returns agents with primary interface and tags', async () => {
    const agents = await listAgentsWithRelations()
    expect(agents.length).toBeGreaterThanOrEqual(1)
    expect(agents[0].interfaces.length).toBeGreaterThanOrEqual(1)
    expect(agents[0].tags.length).toBeGreaterThanOrEqual(1)
  })
})


