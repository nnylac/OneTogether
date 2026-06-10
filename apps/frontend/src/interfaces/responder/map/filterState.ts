/** Filter state for the operations overview, kept separate from the component
 *  module so fast-refresh stays happy (components-only exports per file). */

/** Which slice of the incident set the feed/map shows. Drives the tab strip. */
export type OverviewView = 'active' | 'critical' | 'history'

export type OverviewFilterState = {
  /** High-level view tab — gates by status before the chip filters apply. */
  view: OverviewView
  type: string
  agency: string
  severity: string
}

export const ALL = 'all'

export const defaultFilters: OverviewFilterState = {
  view: 'active',
  type: ALL,
  agency: ALL,
  severity: ALL,
}

/** Chip filters reset by the "Reset" affordance; the view tab is preserved. */
export function clearChipFilters(filters: OverviewFilterState): OverviewFilterState {
  return { ...filters, type: ALL, agency: ALL, severity: ALL }
}

export function hasActiveChipFilters(filters: OverviewFilterState): boolean {
  return filters.type !== ALL || filters.agency !== ALL || filters.severity !== ALL
}
