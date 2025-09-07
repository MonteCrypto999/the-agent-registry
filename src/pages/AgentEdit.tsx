import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgentForm, { type AgentFormValues } from '../components/AgentForm'
import { useData } from '../providers/DataProvider'

export default function AgentEdit() {
  const { id } = useParams()
  const { getAgentById, updateAgentById } = useData()
  const [loading, setLoading] = useState(true)
  const [initial, setInitial] = useState<Partial<AgentFormValues> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    if (!id) return
    getAgentById(id).then((a) => {
      if (!mounted) return
      if (!a) {
        setLoading(false)
        return
      }
      const primary = a.interfaces.find(i => i.isPrimary)
      setInitial({
        name: a.name,
        summary: a.summary,
        websiteUrl: a.websiteUrl ?? undefined,
        thumbnailUrl: a.thumbnailUrl ?? undefined,
        primaryKind: primary?.kind ?? 'web_ui',
        primaryUrl: primary?.url ?? '',
        primaryAccess: (primary?.kind === 'api' ? (primary?.accessPolicy ?? 'public') : null) as any,
        keyRequestUrl: (primary?.kind === 'api' ? (primary?.keyRequestUrl ?? '') : ''),
      })
      setLoading(false)
    })
    return () => { mounted = false }
  }, [id, getAgentById])

  async function handleSubmit(v: AgentFormValues) {
    if (!id) return
    await updateAgentById(id, {
      name: v.name,
      summary: v.summary,
      thumbnailUrl: v.thumbnailUrl || undefined,
      websiteUrl: v.websiteUrl || undefined,
      primaryInterface: {
        kind: v.primaryKind,
        url: v.primaryUrl,
        accessPolicy: v.primaryKind === 'api' ? (v.primaryAccess ?? 'public') : null,
        keyRequestUrl: v.primaryKind === 'api' ? (v.keyRequestUrl || null) : null,
      },
    })
    navigate(`/agent/${id}`)
  }

  if (loading) return <p>Loading…</p>
  if (!initial) return <p>Agent not found.</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit agent</h1>
      <div className="mt-4">
        <AgentForm initial={initial} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}


