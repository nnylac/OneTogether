export type DashboardMetric = {
  label: string
  value: number
  detail: string
}

export type DashboardNotification = {
  id: string
  title: string
  time: string
}

export type ResourceProgress = {
  label: string
  value: number
  total: number
  tone: 'orange' | 'green'
}

export type ResourceCount = {
  label: string
  value: number
}

export type ResourceSnapshot = {
  progress: ResourceProgress[]
  counts: ResourceCount[]
}
