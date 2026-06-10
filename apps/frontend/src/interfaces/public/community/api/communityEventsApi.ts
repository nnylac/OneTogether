export type CommunityEvent = {
  id: string
  title: string
  organiserName: string
  category: string
  description: string | null
  location: string | null
  region: string | null
  startAt: string | null
  endAt: string | null
  capacity: number | null
  registeredCount: number
  spotsLeft: number | null
  registrationProgress: number | null
  isFree: boolean
  signupUrl: string | null
  status: string
}

export async function fetchCommunityEvents(): Promise<CommunityEvent[]> {
  const response = await fetch('/api/community-events')

  if (!response.ok) {
    throw new Error('Unable to load community events')
  }

  return (await response.json()) as CommunityEvent[]
}
