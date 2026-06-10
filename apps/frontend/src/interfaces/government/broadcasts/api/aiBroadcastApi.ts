import type { NewBroadcastInput } from '../types/broadcast'

export type AiBroadcastDraft = {
  title: string
  message: string
  groundedIncidentCount: number
}

export type BroadcastTranslationEntry = {
  title: string
  message: string
}

export type BroadcastTranslationLanguage = 'en' | 'zh' | 'ms' | 'ta'

export type BroadcastTranslations = Record<
  BroadcastTranslationLanguage,
  BroadcastTranslationEntry
>

export async function requestAiBroadcastDraft(
  form: NewBroadcastInput,
): Promise<AiBroadcastDraft> {
  const response = await fetch('/api/ai/broadcast-draft', {
    body: JSON.stringify({
      audience: form.audience,
      zone: form.zone,
      severity: form.severity,
      responderOrganisationNames: form.responderOrganisationNames,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to generate AI broadcast draft')
  }

  return (await response.json()) as AiBroadcastDraft
}

export async function requestBroadcastTranslations(input: {
  title: string
  message: string
}): Promise<BroadcastTranslations> {
  const response = await fetch('/api/ai/translate', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to translate broadcast')
  }

  const payload = (await response.json()) as {
    translations: BroadcastTranslations
  }
  return payload.translations
}
