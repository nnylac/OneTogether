export type PublicAlertSeverity = 'info' | 'advisory' | 'warning' | 'critical'

export type PublicAlertAudience = 'Public' | 'Zone'

export type PublicAlert = {
  id: string
  title: string
  message: string
  audience: PublicAlertAudience
  zone?: string
  severity: PublicAlertSeverity
  authorName: string
  createdAt: string
  recommendations: AlertRecommendation[]
}

export type AlertRecommendation = {
  title: string
  body: string
}
