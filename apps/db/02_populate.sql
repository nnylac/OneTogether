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
    created_at,
    updated_at,
    last_login
) VALUES
('scdf_ops_lee', 'lee.ops@scdf.gov.sg', 'Daniel', 'Lee', '+6591001001', TRUE, 'moderator', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),
('spf_cmd_tan', 'tan.cmd@spf.gov.sg', 'Rachel', 'Tan', '+6591001002', TRUE, 'moderator', NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours'),
('moh_watch_ng', 'ng.watch@moh.gov.sg', 'Amelia', 'Ng', '+6591001003', TRUE, 'moderator', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
('pub_flood_lim', 'lim.flood@pub.gov.sg', 'Marcus', 'Lim', '+6591001004', TRUE, 'moderator', NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
('lta_incident_koh', 'koh.incident@lta.gov.sg', 'Brian', 'Koh', '+6591001005', TRUE, 'moderator', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '25 minutes'),
('gov_admin', 'admin@onetogether.sg', 'OneTogether', 'Admin', '+6591001000', TRUE, 'admin', NOW() - INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    is_verified = EXCLUDED.is_verified,
    role = EXCLUDED.role,
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
