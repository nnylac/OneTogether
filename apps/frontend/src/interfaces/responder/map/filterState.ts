/** Filter state for the operations overview, kept separate from the component
 *  module so fast-refresh stays happy (components-only exports per file). */
export type OverviewFilterState = {
  type: string
  agency: string
  status: string
}

export const ALL = 'all'

export const defaultFilters: OverviewFilterState = {
  type: ALL,
  agency: ALL,
  status: ALL,
}
