import { useEffect, useState } from 'react'
import { fetchIncidents } from '../../../responder/incidents/api/incidentsApi'
import type { Incident } from '../../../responder/incidents/types'
import { governmentMapPollingIntervalMs } from '../constants'

export function useGovernmentMapIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load(showLoading: boolean) {
      if (showLoading) setIsLoading(true)

      try {
        const nextIncidents = await fetchIncidents()
        if (!isMounted) return
        setIncidents(nextIncidents)
        setError(null)
      } catch {
        if (isMounted) setError('Unable to load national incidents from the backend.')
      } finally {
        if (showLoading && isMounted) setIsLoading(false)
      }
    }

    void load(true)
    const pollingId = window.setInterval(
      () => void load(false),
      governmentMapPollingIntervalMs,
    )

    return () => {
      isMounted = false
      window.clearInterval(pollingId)
    }
  }, [])

  return { error, incidents, isLoading }
}

