export type SituationSummarySections = {
  overview: string
  keyRisks: string
  resourcePosture: string
  recommendedActions: string
}

export type SituationSummary = {
  generatedAt: string
  source: 'ai' | 'fallback'
  sections: SituationSummarySections | null
  fallbackText: string | null
}

export async function fetchSituationSummary(
  refresh = false,
): Promise<SituationSummary> {
  const response = await fetch(
    `/api/ai/situation-summary${refresh ? '?refresh=true' : ''}`,
  )

  if (!response.ok) {
    throw new Error('Unable to load situation summary')
  }

  return (await response.json()) as SituationSummary
}
