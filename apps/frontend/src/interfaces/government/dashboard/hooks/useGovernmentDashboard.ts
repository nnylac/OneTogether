import { useCallback, useEffect, useState } from 'react'
import {
  fetchGovernmentDashboardData,
  type GovernmentDashboardData,
} from '../api/governmentDashboardApi'

const dashboardRefreshMs = 30000

export function useGovernmentDashboard() {
  const [data, setData] = useState<GovernmentDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDashboard = useCallback(
    async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true)
        } else {
          setIsRefreshing(true)
        }

        const nextData = await fetchGovernmentDashboardData()
        setData(nextData)
        setError(null)
      } catch {
        setError('Unable to load command dashboard data.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadDashboard({ showLoading: true })
    const intervalId = window.setInterval(() => void loadDashboard(), dashboardRefreshMs)
    const handleAlertRulesChanged = () => {
      void loadDashboard()
    }

    window.addEventListener('government-alert-rules-changed', handleAlertRulesChanged)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener(
        'government-alert-rules-changed',
        handleAlertRulesChanged,
      )
    }
  }, [loadDashboard])

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh: () => loadDashboard({ showLoading: false }),
  }
}
