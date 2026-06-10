import type { OrganisationGuide } from '../types/organisationGuide'

export const sampleOrganisationGuides: OrganisationGuide[] = [
  {
    id: 'guide-spf',
    orgName: 'SPF',
    contactNumber: '999',
    contactChannel: 'Emergency hotline',
    serviceSummary:
      'Police response for crime, public order, suspicious activity, and immediate security threats.',
    contactGuidance:
      'Call 999 for police emergencies or urgent security threats. For non-urgent matters, use SPF public reporting channels.',
  },
  {
    id: 'guide-scdf',
    orgName: 'SCDF',
    contactNumber: '995',
    contactChannel: 'Emergency hotline',
    serviceSummary:
      'Fire, rescue, ambulance, hazardous material, and emergency medical response.',
    contactGuidance:
      'Call 995 for life-threatening medical emergencies, fire, rescue, or hazardous material incidents.',
  },
  {
    id: 'guide-moh',
    orgName: 'MOH',
    contactNumber: '6325 9220',
    contactChannel: 'General hotline',
    serviceSummary:
      'National health guidance, public health advisories, disease information, and healthcare policy support.',
    contactGuidance:
      'Contact MOH for general health guidance, disease advisories, and ministry-level healthcare enquiries.',
  },
  {
    id: 'guide-sgh',
    orgName: 'SGH',
    contactNumber: '6222 3322',
    contactChannel: 'Hospital hotline',
    serviceSummary:
      'Singapore General Hospital services including specialist care, appointments, and hospital enquiries.',
    contactGuidance:
      'Contact SGH for hospital services, appointment guidance, and patient-related enquiries.',
  },
  {
    id: 'guide-pub',
    orgName: 'PUB',
    contactNumber: '6521 6470',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'National water agency handling drainage, flood management, water supply, and sewerage issues.',
    contactGuidance:
      'Contact PUB for drainage issues, flooding, water supply disruptions, or sewerage-related matters.',
  },
  {
    id: 'guide-nea',
    orgName: 'NEA',
    contactNumber: '6225 5632',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Environmental public health, pollution, sanitation, hawker centre matters, and weather-related advisories.',
    contactGuidance:
      'Contact NEA for environmental health, pollution, cleanliness, vector, or weather advisory matters.',
  },
  {
    id: 'guide-lta',
    orgName: 'LTA',
    contactNumber: '6225 5582',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Land transport operations, road issues, public transport disruptions, and traffic management.',
    contactGuidance:
      'Contact LTA for road, traffic, and public transport service disruptions or transport infrastructure concerns.',
  },
  {
    id: 'guide-hdb',
    orgName: 'HDB',
    contactNumber: '6225 5432',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Public housing estate matters, town living support, HDB flats, and residential property services.',
    contactGuidance:
      'Contact HDB for public housing, estate facilities, and flat-related enquiries.',
  },
  {
    id: 'guide-ema',
    orgName: 'EMA',
    contactNumber: '6835 8000',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Energy market, electricity and gas supply reliability, and power-sector coordination.',
    contactGuidance:
      'Contact EMA for electricity, gas, and power-sector matters. For immediate danger from electrical hazards, call emergency services.',
  },
  {
    id: 'guide-singhealth',
    orgName: 'SINGHEALTH',
    contactNumber: '6377 8791',
    contactChannel: 'Healthcare cluster hotline',
    serviceSummary:
      'Public healthcare cluster covering hospitals, polyclinics, national specialty centres, and community care services.',
    contactGuidance:
      'Contact SingHealth for cluster healthcare services, appointments, and care navigation.',
  },
  {
    id: 'guide-nuhs',
    orgName: 'NUHS',
    contactNumber: '6908 2222',
    contactChannel: 'Healthcare cluster hotline',
    serviceSummary:
      'Public healthcare cluster supporting hospital, national specialty, polyclinic, and academic health services.',
    contactGuidance:
      'Contact NUHS for cluster healthcare services, appointments, and care navigation.',
  },
  {
    id: 'guide-town-council',
    orgName: 'TOWN_COUNCIL',
    contactNumber: null,
    contactChannel: 'OneService App',
    serviceSummary:
      'Municipal estate support for neighbourhood maintenance, cleanliness, facilities, and local defects.',
    contactGuidance:
      'Use the OneService App for municipal estate issues such as cleanliness, lighting, defects, and neighbourhood maintenance.',
  },
]
