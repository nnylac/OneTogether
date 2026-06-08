export type OrganisationSection =
  | 'Community Organisations'
  | 'Hospitals'
  | 'Volunteer Tasks'

export type CommunityOrganisationType =
  | 'Government'
  | 'Healthcare'
  | 'NGO'
  | 'Grassroots'

export type CommunityOrganisationFilter = 'All' | CommunityOrganisationType

export type CommunityOrganisation = {
  id: string
  name: string
  address: string
  type: CommunityOrganisationType
  capacityUsed: number
  capacityTotal: number
  activeTasks: number
  isDeployed: boolean
}

export type HospitalCapacityStatus = 'normal' | 'limited' | 'critical'

export type Hospital = {
  id: string
  name: string
  address: string
  availableBeds: number
  totalBeds: number
  icuAvailable: number
  traumaBays: number
  status: HospitalCapacityStatus
  lastUpdatedAt: string
}

export type VolunteerTaskUrgency = 'Low' | 'Medium' | 'High' | 'Critical'

export type VolunteerTaskSchedule = 'Past' | 'Today' | 'Upcoming'

export type VolunteerTaskFilterState = {
  organisation: string
  schedule: 'All' | VolunteerTaskSchedule
  urgency: 'All' | VolunteerTaskUrgency
}

export type VolunteerTask = {
  id: string
  title: string
  location: string
  organisation: string
  dateTime: string
  schedule: VolunteerTaskSchedule
  slotsFilled: number
  slotsTotal: number
  urgency: VolunteerTaskUrgency
}