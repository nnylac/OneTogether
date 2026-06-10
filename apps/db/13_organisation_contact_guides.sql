\c one_together;

ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(40),
    ADD COLUMN IF NOT EXISTS contact_channel VARCHAR(80),
    ADD COLUMN IF NOT EXISTS service_summary TEXT,
    ADD COLUMN IF NOT EXISTS contact_guidance TEXT;

INSERT INTO organisations (org_name) VALUES
('SCDF'),
('SPF'),
('MOH'),
('SGH'),
('PUB'),
('NEA'),
('LTA'),
('HDB'),
('EMA'),
('SINGHEALTH'),
('NUHS'),
('TOWN_COUNCIL')
ON CONFLICT (org_name) DO NOTHING;

UPDATE organisations
SET
    contact_number = seed.contact_number,
    contact_channel = seed.contact_channel,
    service_summary = seed.service_summary,
    contact_guidance = seed.contact_guidance
FROM (VALUES
    ('SPF', '999', 'Emergency hotline', 'Police response for crime, public order, suspicious activity, and immediate security threats.', 'Call 999 for police emergencies or urgent security threats. For non-urgent matters, use SPF public reporting channels.'),
    ('SCDF', '995', 'Emergency hotline', 'Fire, rescue, ambulance, hazardous material, and emergency medical response.', 'Call 995 for life-threatening medical emergencies, fire, rescue, or hazardous material incidents.'),
    ('MOH', '6325 9220', 'General hotline', 'National health guidance, public health advisories, disease information, and healthcare policy support.', 'Contact MOH for general health guidance, disease advisories, and ministry-level healthcare enquiries.'),
    ('SGH', '6222 3322', 'Hospital hotline', 'Singapore General Hospital services including specialist care, appointments, and hospital enquiries.', 'Contact SGH for hospital services, appointment guidance, and patient-related enquiries.'),
    ('PUB', '6521 6470', 'Agency hotline', 'National water agency handling drainage, flood management, water supply, and sewerage issues.', 'Contact PUB for drainage issues, flooding, water supply disruptions, or sewerage-related matters.'),
    ('NEA', '6225 5632', 'Agency hotline', 'Environmental public health, pollution, sanitation, hawker centre matters, and weather-related advisories.', 'Contact NEA for environmental health, pollution, cleanliness, vector, or weather advisory matters.'),
    ('LTA', '6225 5582', 'Agency hotline', 'Land transport operations, road issues, public transport disruptions, and traffic management.', 'Contact LTA for road, traffic, and public transport service disruptions or transport infrastructure concerns.'),
    ('HDB', '6225 5432', 'Agency hotline', 'Public housing estate matters, town living support, HDB flats, and residential property services.', 'Contact HDB for public housing, estate facilities, and flat-related enquiries.'),
    ('EMA', '6835 8000', 'Agency hotline', 'Energy market, electricity and gas supply reliability, and power-sector coordination.', 'Contact EMA for electricity, gas, and power-sector matters. For immediate danger from electrical hazards, call emergency services.'),
    ('SINGHEALTH', '6377 8791', 'Healthcare cluster hotline', 'Public healthcare cluster covering hospitals, polyclinics, national specialty centres, and community care services.', 'Contact SingHealth for cluster healthcare services, appointments, and care navigation.'),
    ('NUHS', '6908 2222', 'Healthcare cluster hotline', 'Public healthcare cluster supporting hospital, national specialty, polyclinic, and academic health services.', 'Contact NUHS for cluster healthcare services, appointments, and care navigation.'),
    ('TOWN_COUNCIL', NULL, 'OneService App', 'Municipal estate support for neighbourhood maintenance, cleanliness, facilities, and local defects.', 'Use the OneService App for municipal estate issues such as cleanliness, lighting, defects, and neighbourhood maintenance.')
) AS seed(org_name, contact_number, contact_channel, service_summary, contact_guidance)
WHERE organisations.org_name = seed.org_name;
