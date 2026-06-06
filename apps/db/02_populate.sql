\c one_together;

-- OneTogether seed data
-- Requires pgcrypto for gen_random_uuid()
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

-- 4. Incidents
INSERT INTO incidents (
    code,
    title,
    incident_type,
    severity,
    inc_status,
    inc_description,
    inc_location,
    report,
    created_at,
    updated_at,
    resolved_at,
    confidence_score
) VALUES
(
    'INC001',
    'Flash Flooding Along Upper Thomson Road',
    'Flood',
    4,
    'dispatched',
    'Heavy rainfall has caused flash flooding near Upper Thomson Road. Several vehicles are partially stalled and water levels are reported to be rising near the bus stop and adjacent shophouses.',
    'Upper Thomson Road near Sin Ming Avenue, Singapore',
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '20 minutes',
    NULL,
    91
),
(
    'INC002',
    'Kitchen Fire at Toa Payoh HDB Block',
    'Fire',
    3,
    'on scene',
    'Residents reported smoke from a 7th floor unit. Initial information suggests a kitchen fire with possible smoke inhalation risk to elderly occupants.',
    'Block 178 Toa Payoh Central, Singapore',
    NULL,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '10 minutes',
    NULL,
    88
),
(
    'INC003',
    'Multi-Vehicle Collision on PIE',
    'Traffic Accident',
    4,
    'verified',
    'Three-vehicle collision reported on the PIE towards Changi before Stevens Road exit. Traffic congestion is building and one lane may be blocked.',
    'PIE towards Changi, before Stevens Road exit, Singapore',
    NULL,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '35 minutes',
    NULL,
    84
),
(
    'INC004',
    'Suspected Gas Leak at Jurong East Coffee Shop',
    'Gas Leak',
    5,
    'contained',
    'Strong gas odour reported by members of the public. Nearby stalls have been evacuated as a precaution. Source suspected to be a kitchen LPG cylinder connection.',
    'Jurong East Street 24 coffee shop, Singapore',
    'Gas leak isolated by response crew. No ignition reported. Area remains under observation pending final safety checks.',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '45 minutes',
    NULL,
    94
),
(
    'INC005',
    'Power Disruption Affecting Tampines Residential Blocks',
    'Power Outage',
    2,
    'recovery',
    'Several residential blocks in Tampines reported power disruption. Lifts in two blocks were temporarily unavailable. No injuries reported.',
    'Tampines Street 21, Singapore',
    'Power restoration underway. Lift services have resumed in affected blocks. Monitoring continues.',
    NOW() - INTERVAL '10 hours',
    NOW() - INTERVAL '1 hour',
    NULL,
    78
),
(
    'INC006',
    'Large Fallen Tree Blocking Bus Lane',
    'Infrastructure Hazard',
    2,
    'closed',
    'A large tree branch fell after heavy rain, blocking part of the bus lane and pedestrian footpath. No injuries reported.',
    'Bukit Timah Road near Sixth Avenue, Singapore',
    'Tree cleared and road reopened. No further action required.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '18 hours',
    NOW() - INTERVAL '18 hours',
    86
),
(
    'INC007',
    'Unverified Report of Chemical Odour Near Industrial Estate',
    'Hazmat',
    3,
    'unverified',
    'Public reports of a sharp chemical smell near an industrial estate. No confirmed source yet. Initial reports came from nearby workers and residents.',
    'Tuas Avenue 8, Singapore',
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '15 minutes',
    NULL,
    62
),
(
    'INC008',
    'Crowd Congestion at MRT Station Exit',
    'Public Safety',
    2,
    'reported',
    'Crowd congestion reported near MRT station exit after train delay and nearby event dispersal. Situation pending verification.',
    'Dhoby Ghaut MRT Station Exit B, Singapore',
    NULL,
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '25 minutes',
    NULL,
    55
)
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    incident_type = EXCLUDED.incident_type,
    severity = EXCLUDED.severity,
    inc_status = EXCLUDED.inc_status,
    inc_description = EXCLUDED.inc_description,
    inc_location = EXCLUDED.inc_location,
    report = EXCLUDED.report,
    updated_at = EXCLUDED.updated_at,
    resolved_at = EXCLUDED.resolved_at,
    confidence_score = EXCLUDED.confidence_score;

-- 5. Assigned organisations
INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '4 hours 45 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC001'
AND o.org_name IN ('PUB', 'SCDF', 'LTA', 'SPF')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '3 hours 50 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC002'
AND o.org_name IN ('SCDF', 'SPF', 'MOH', 'SGH')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '2 hours 50 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC003'
AND o.org_name IN ('SPF', 'SCDF', 'LTA', 'MOH')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '7 hours 40 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC004'
AND o.org_name IN ('SCDF', 'SPF', 'NEA')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '9 hours 30 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC005'
AND o.org_name IN ('EMA', 'HDB', 'SCDF')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '23 hours'
FROM incidents i, organisations o
WHERE i.code = 'INC006'
AND o.org_name IN ('LTA', 'NEA', 'SPF')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '50 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC007'
AND o.org_name IN ('SCDF', 'NEA', 'SPF')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id, assigned_at)
SELECT i.id, o.id, NOW() - INTERVAL '20 minutes'
FROM incidents i, organisations o
WHERE i.code = 'INC008'
AND o.org_name IN ('LTA', 'SPF')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

-- 6. Incident sources
INSERT INTO incident_sources (incident_id, external_ticket_id, last_synced_at)
SELECT id, 'PUB-FLOOD-2026-0001', NOW() - INTERVAL '20 minutes'
FROM incidents
WHERE code = 'INC001'
ON CONFLICT (incident_id, external_ticket_id) DO UPDATE SET
    last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO incident_sources (incident_id, external_ticket_id, last_synced_at)
SELECT id, 'SCDF-FIRE-2026-0142', NOW() - INTERVAL '10 minutes'
FROM incidents
WHERE code = 'INC002'
ON CONFLICT (incident_id, external_ticket_id) DO UPDATE SET
    last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO incident_sources (incident_id, external_ticket_id, last_synced_at)
SELECT id, 'LTA-TRAFFIC-2026-0377', NOW() - INTERVAL '35 minutes'
FROM incidents
WHERE code = 'INC003'
ON CONFLICT (incident_id, external_ticket_id) DO UPDATE SET
    last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO incident_sources (incident_id, external_ticket_id, last_synced_at)
SELECT id, 'SCDF-HAZMAT-2026-0088', NOW() - INTERVAL '45 minutes'
FROM incidents
WHERE code = 'INC004'
ON CONFLICT (incident_id, external_ticket_id) DO UPDATE SET
    last_synced_at = EXCLUDED.last_synced_at;

-- 7. Logs
INSERT INTO logs (incident_id, content, created_at)
SELECT i.id, v.content, v.created_at
FROM incidents i
JOIN (
    VALUES
    ('INC001', 'Public report received: water level rising near Upper Thomson Road bus stop.', NOW() - INTERVAL '5 hours'),
    ('INC001', 'PUB flood response team assigned. LTA notified for traffic diversion support.', NOW() - INTERVAL '4 hours 45 minutes'),
    ('INC001', 'SCDF standing by for vehicle extraction if water level increases.', NOW() - INTERVAL '3 hours 50 minutes'),

    ('INC002', 'Smoke reported from residential unit. SCDF dispatched.', NOW() - INTERVAL '4 hours'),
    ('INC002', 'SPF assisting with cordon and resident movement at ground level.', NOW() - INTERVAL '3 hours 30 minutes'),
    ('INC002', 'SCDF crew on scene. Possible smoke inhalation case being assessed.', NOW() - INTERVAL '15 minutes'),

    ('INC003', 'Traffic accident verified through LTA camera feed and public reports.', NOW() - INTERVAL '3 hours'),
    ('INC003', 'SPF and LTA coordinating lane closure. SCDF alerted for rescue support.', NOW() - INTERVAL '2 hours 40 minutes'),

    ('INC004', 'Gas odour report received from multiple callers.', NOW() - INTERVAL '8 hours'),
    ('INC004', 'SCDF isolated suspected LPG source. NEA advised monitoring of surrounding air quality.', NOW() - INTERVAL '6 hours 30 minutes'),
    ('INC004', 'Incident marked contained. Awaiting final safety inspection.', NOW() - INTERVAL '45 minutes'),

    ('INC005', 'Power disruption reported by residents in multiple Tampines blocks.', NOW() - INTERVAL '10 hours'),
    ('INC005', 'EMA restoration crew assigned. HDB notified due to lift service disruption.', NOW() - INTERVAL '9 hours 20 minutes'),
    ('INC005', 'Power restored to majority of affected blocks. Monitoring remaining complaints.', NOW() - INTERVAL '1 hour'),

    ('INC006', 'Fallen tree reported blocking bus lane and footpath.', NOW() - INTERVAL '1 day'),
    ('INC006', 'Road obstruction cleared. Incident closed.', NOW() - INTERVAL '18 hours'),

    ('INC007', 'Unverified public reports of chemical smell near Tuas Avenue 8.', NOW() - INTERVAL '1 hour'),
    ('INC007', 'NEA and SCDF notified for assessment. Source not yet confirmed.', NOW() - INTERVAL '35 minutes'),

    ('INC008', 'Crowd congestion reported near MRT station exit after train delay.', NOW() - INTERVAL '25 minutes'),
    ('INC008', 'SPF and LTA monitoring. Awaiting confirmation from station staff.', NOW() - INTERVAL '15 minutes')
) AS v(code, content, created_at)
ON i.code = v.code
WHERE NOT EXISTS (
    SELECT 1
    FROM logs existing
    WHERE existing.incident_id = i.id
    AND existing.content = v.content
);

-- 8. Discussions
INSERT INTO discussions (incident_id, title, created_at, updated_at)
SELECT i.id, v.title, v.created_at, v.updated_at
FROM incidents i
JOIN (
    VALUES
    ('INC001', 'INC001 Response Coordination', NOW() - INTERVAL '4 hours 50 minutes', NOW() - INTERVAL '20 minutes'),
    ('INC002', 'INC002 Fire Response Room', NOW() - INTERVAL '3 hours 55 minutes', NOW() - INTERVAL '10 minutes'),
    ('INC003', 'INC003 PIE Collision Coordination', NOW() - INTERVAL '2 hours 55 minutes', NOW() - INTERVAL '35 minutes'),
    ('INC004', 'INC004 Gas Leak Safety Checks', NOW() - INTERVAL '7 hours 50 minutes', NOW() - INTERVAL '45 minutes'),
    ('INC005', 'INC005 Power Restoration Updates', NOW() - INTERVAL '9 hours 40 minutes', NOW() - INTERVAL '1 hour'),
    ('INC007', 'INC007 Hazmat Verification', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '15 minutes'),
    ('INC008', 'INC008 Crowd Monitoring', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes')
) AS v(code, title, created_at, updated_at)
ON i.code = v.code
WHERE NOT EXISTS (
    SELECT 1
    FROM discussions d
    WHERE d.incident_id = i.id
    AND d.title = v.title
);

-- 9. Messages
INSERT INTO messages (discussion_id, sender_id, parent_id, body, created_at)
SELECT d.id, u.id, NULL, v.body, v.created_at
FROM discussions d
JOIN incidents i ON i.id = d.incident_id
JOIN (
    VALUES
    ('INC001', 'INC001 Response Coordination', 'pub_flood_lim', 'PUB team is en route. Initial assessment suggests localised flash flooding due to intense rainfall.', NOW() - INTERVAL '4 hours 40 minutes'),
    ('INC001', 'INC001 Response Coordination', 'lta_incident_koh', 'LTA can support temporary traffic diversion if water level affects the main carriageway.', NOW() - INTERVAL '4 hours 20 minutes'),
    ('INC001', 'INC001 Response Coordination', 'scdf_ops_lee', 'SCDF unit on standby for rescue or vehicle extraction. Please update if any trapped occupants are reported.', NOW() - INTERVAL '3 hours 45 minutes'),

    ('INC002', 'INC002 Fire Response Room', 'scdf_ops_lee', 'Crew has arrived at block. Smoke visible from kitchen window. Proceeding with entry check.', NOW() - INTERVAL '3 hours 40 minutes'),
    ('INC002', 'INC002 Fire Response Room', 'spf_cmd_tan', 'SPF officers assisting with lift lobby control and keeping residents clear of the affected floor.', NOW() - INTERVAL '3 hours 25 minutes'),
    ('INC002', 'INC002 Fire Response Room', 'moh_watch_ng', 'MOH notified. SGH can receive smoke inhalation case if conveyance is required.', NOW() - INTERVAL '2 hours 55 minutes'),

    ('INC003', 'INC003 PIE Collision Coordination', 'lta_incident_koh', 'Traffic camera confirms lane obstruction. Recovery vehicle requested.', NOW() - INTERVAL '2 hours 45 minutes'),
    ('INC003', 'INC003 PIE Collision Coordination', 'spf_cmd_tan', 'SPF patrol unit proceeding to scene. Advise motorists to avoid the area.', NOW() - INTERVAL '2 hours 35 minutes'),
    ('INC003', 'INC003 PIE Collision Coordination', 'scdf_ops_lee', 'SCDF ambulance dispatched as precaution. Awaiting confirmation on injuries.', NOW() - INTERVAL '2 hours 20 minutes'),

    ('INC004', 'INC004 Gas Leak Safety Checks', 'scdf_ops_lee', 'Suspected LPG source isolated. No ignition or fire reported.', NOW() - INTERVAL '6 hours 20 minutes'),
    ('INC004', 'INC004 Gas Leak Safety Checks', 'spf_cmd_tan', 'SPF maintaining cordon until final safety clearance.', NOW() - INTERVAL '5 hours 45 minutes'),
    ('INC004', 'INC004 Gas Leak Safety Checks', 'gov_admin', 'Please keep this incident in contained status until the final safety check is logged.', NOW() - INTERVAL '1 hour'),

    ('INC005', 'INC005 Power Restoration Updates', 'gov_admin', 'Priority is lift service restoration and resident communications.', NOW() - INTERVAL '9 hours 30 minutes'),
    ('INC005', 'INC005 Power Restoration Updates', 'scdf_ops_lee', 'SCDF available if lift entrapment is reported. No active rescue request so far.', NOW() - INTERVAL '8 hours 50 minutes'),

    ('INC007', 'INC007 Hazmat Verification', 'scdf_ops_lee', 'SCDF hazmat assessment requested. No casualties reported at this time.', NOW() - INTERVAL '45 minutes'),
    ('INC007', 'INC007 Hazmat Verification', 'spf_cmd_tan', 'SPF can assist with perimeter control if source is confirmed.', NOW() - INTERVAL '30 minutes'),

    ('INC008', 'INC008 Crowd Monitoring', 'lta_incident_koh', 'Checking with station operations team. Current report is still unverified.', NOW() - INTERVAL '18 minutes'),
    ('INC008', 'INC008 Crowd Monitoring', 'spf_cmd_tan', 'SPF nearby patrol can assist if crowding worsens.', NOW() - INTERVAL '12 minutes')
) AS v(code, discussion_title, username, body, created_at)
ON i.code = v.code
AND d.title = v.discussion_title
JOIN users u ON u.username = v.username
WHERE NOT EXISTS (
    SELECT 1
    FROM messages m
    WHERE m.discussion_id = d.id
    AND m.sender_id = u.id
    AND m.body = v.body
);