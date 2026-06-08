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
('EMA')
ON CONFLICT (org_name) DO NOTHING;

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
