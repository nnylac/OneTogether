\c one_together;

-- OneTogether base seed data.
-- Incidents are intentionally not seeded here; they should be created by
-- POST /api/incident-middleware/events from the simulator/manual tests.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Organisations
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

-- 2. Users
INSERT INTO users (
    username,
    email,
    first_name,
    last_name,
    phone,
    is_verified,
    role,
    user_organisation_id,
    created_at,
    updated_at,
    last_login
)
SELECT
    seed.username,
    seed.email,
    seed.first_name,
    seed.last_name,
    seed.phone,
    seed.is_verified,
    seed.role,
    organisations.id,
    seed.created_at,
    seed.updated_at,
    seed.last_login
FROM (VALUES
    ('citizen', 'c@g.com', 'Citizen', 'Demo', '+6590000001', TRUE, 'user', NULL, NOW(), NOW(), NULL),
    ('responder', 'r@g.com', 'Responder', 'Demo', '+6590000002', TRUE, 'responder', 'SCDF', NOW(), NOW(), NULL),
    ('gov', 'g@g.com', 'Government', 'Demo', '+6590000003', TRUE, 'admin', NULL, NOW(), NOW(), NULL),
    ('scdf_ops_lee', 'lee.ops@scdf.gov.sg', 'Daniel', 'Lee', '+6591001001', TRUE, 'responder', 'SCDF', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),
    ('spf_cmd_tan', 'tan.cmd@spf.gov.sg', 'Rachel', 'Tan', '+6591001002', TRUE, 'responder', 'SPF', NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours'),
    ('moh_watch_ng', 'ng.watch@moh.gov.sg', 'Amelia', 'Ng', '+6591001003', TRUE, 'responder', 'MOH', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
    ('pub_flood_lim', 'lim.flood@pub.gov.sg', 'Marcus', 'Lim', '+6591001004', TRUE, 'responder', 'PUB', NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
    ('lta_incident_koh', 'koh.incident@lta.gov.sg', 'Brian', 'Koh', '+6591001005', TRUE, 'responder', 'LTA', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '25 minutes'),
    ('gov_admin', 'admin@onetogether.sg', 'OneTogether', 'Admin', '+6591001000', TRUE, 'admin', NULL, NOW() - INTERVAL '30 days', NOW(), NOW())
) AS seed(
    username,
    email,
    first_name,
    last_name,
    phone,
    is_verified,
    role,
    org_name,
    created_at,
    updated_at,
    last_login
)
LEFT JOIN organisations ON organisations.org_name = seed.org_name
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    is_verified = EXCLUDED.is_verified,
    role = EXCLUDED.role,
    user_organisation_id = EXCLUDED.user_organisation_id,
    updated_at = NOW();

-- 2b. User organisation links
INSERT INTO user_organisations (user_id, organisation_id)
SELECT users.id, organisations.id
FROM (VALUES
    ('responder', 'SCDF'),
    ('scdf_ops_lee', 'SCDF'),
    ('spf_cmd_tan', 'SPF'),
    ('moh_watch_ng', 'MOH'),
    ('pub_flood_lim', 'PUB'),
    ('lta_incident_koh', 'LTA')
) AS links(username, org_name)
JOIN users ON users.username = links.username
JOIN organisations ON organisations.org_name = links.org_name
ON CONFLICT (user_id, organisation_id) DO NOTHING;

-- 2c. Login accounts
-- Passwords are role-based for local development:
-- user -> citizen, responder -> responder, admin -> gov.
INSERT INTO accounts (user_id, password_hash)
SELECT
    users.id,
    CASE users.role
        WHEN 'user' THEN 'pbkdf2_sha256$210000$seed-citizen-salt$bFkQqXbxqhBCsKszrWmPAMtrX4kzcZpYpNzzMYcqUao'
        WHEN 'responder' THEN 'pbkdf2_sha256$210000$seed-responder-salt$i4kdrVRxWxSraSuCz1uXYBvPBO2MZ893oGxrocyfVuA'
        WHEN 'admin' THEN 'pbkdf2_sha256$210000$seed-gov-salt$ASL2u1CiCEGLs7Kl7ODSUR1s27w18pFXEIW21MKVUCo'
    END AS password_hash
FROM users
WHERE users.username IN (
    'citizen',
    'responder',
    'gov',
    'scdf_ops_lee',
    'spf_cmd_tan',
    'moh_watch_ng',
    'pub_flood_lim',
    'lta_incident_koh',
    'gov_admin'
)
ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- 3. Generic resources
-- Current resources table is generic and not linked to incidents yet.
INSERT INTO resources (resource_name, capacity, available) VALUES
('SCDF Ambulance', 42, 31),
('SCDF Fire Appliance', 28, 19),
('SPF Patrol Unit', 65, 48),
('PUB Flood Response Team', 16, 10),
('NEA Hazmat Assessment Team', 8, 5),
('LTA Traffic Marshal Team', 24, 17),
('HDB Estate Response Team', 18, 12),
('MOH Medical Support Team', 20, 14),
('EMA Power Restoration Crew', 12, 8)
ON CONFLICT (resource_name) DO UPDATE SET
    capacity = EXCLUDED.capacity,
    available = EXCLUDED.available;
