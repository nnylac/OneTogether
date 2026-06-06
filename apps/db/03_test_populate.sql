\c one_together;

INSERT INTO organisations (id, org_name) VALUES
('10000000-0000-0000-0000-000000000001', 'SCDF Central Division'),
('10000000-0000-0000-0000-000000000002', 'Singapore Police Force'),
('10000000-0000-0000-0000-000000000003', 'Tan Tock Seng Hospital'),
('10000000-0000-0000-0000-000000000004', 'National Environment Agency'),
('10000000-0000-0000-0000-000000000005', 'Singapore Red Cross')
ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, resource_name, capacity, available) VALUES
('20000000-0000-0000-0000-000000000001', 'Ambulance Unit A1', 4, 3),
('20000000-0000-0000-0000-000000000002', 'Fire Engine F2', 6, 5),
('20000000-0000-0000-0000-000000000003', 'Police Patrol Team P3', 4, 2),
('20000000-0000-0000-0000-000000000004', 'Mobile Medical Team M4', 8, 6),
('20000000-0000-0000-0000-000000000005', 'Relief Supply Truck R5', 2, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO incidents (
  id, code, title, incident_type, severity, inc_status, inc_description,
  inc_location, report, confidence_score
) VALUES
('30000000-0000-0000-0000-000000000001', 'INC001', 'Kitchen fire at Toa Payoh block', 'Fire', 4, 'verified', 'Smoke and flames reported from a residential unit.', 'Toa Payoh Lorong 4', 'Initial report received from resident hotline.', 92),
('30000000-0000-0000-0000-000000000002', 'INC002', 'Traffic collision near PIE exit', 'Traffic Accident', 3, 'dispatched', 'Two-car collision with possible minor injuries.', 'PIE Exit 17', 'Responder dispatch in progress.', 87),
('30000000-0000-0000-0000-000000000003', 'INC003', 'Flooding at underpass', 'Flood', 3, 'on scene', 'Water accumulation blocking pedestrian underpass.', 'Bishan Street 13', 'Drainage team requested.', 80),
('30000000-0000-0000-0000-000000000004', 'INC004', 'Chemical odor reported', 'Hazmat', 5, 'reported', 'Strong chemical smell reported near industrial unit.', 'Tuas Avenue 8', 'Pending verification by specialist team.', 74),
('30000000-0000-0000-0000-000000000005', 'INC005', 'Community shelter activation', 'Shelter', 2, 'contained', 'Temporary shelter opened for displaced residents.', 'Bedok Community Centre', 'Shelter operations stable.', 95)
ON CONFLICT (id) DO NOTHING;

INSERT INTO logs (id, incident_id, content) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Incident verified by SCDF control room.'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Ambulance and police patrol dispatched.'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Drainage team arrived on scene.'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Hazmat assessment requested.'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Shelter capacity checked and supplies logged.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assigned_orgs (incident_id, organisation_id) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004'),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005')
ON CONFLICT (incident_id, organisation_id) DO NOTHING;

INSERT INTO incident_sources (incident_id, external_ticket_id) VALUES
('30000000-0000-0000-0000-000000000001', 'SCDF-2026-0001'),
('30000000-0000-0000-0000-000000000002', 'SPF-2026-0002'),
('30000000-0000-0000-0000-000000000003', 'NEA-2026-0003'),
('30000000-0000-0000-0000-000000000004', 'SCDF-2026-0004'),
('30000000-0000-0000-0000-000000000005', 'SRC-2026-0005')
ON CONFLICT (incident_id, external_ticket_id) DO NOTHING;

INSERT INTO users (
  id, username, email, first_name, last_name, phone, is_verified, role, last_login
) VALUES
('50000000-0000-0000-0000-000000000001', 'citizen_amy', 'amy.tan@example.sg', 'Amy', 'Tan', '+6590000001', true, 'user', NOW()),
('50000000-0000-0000-0000-000000000002', 'scdf_lee', 'lee.scdf@example.sg', 'Marcus', 'Lee', '+6590000002', true, 'moderator', NOW()),
('50000000-0000-0000-0000-000000000003', 'spf_nur', 'nur.spf@example.sg', 'Nur', 'Rahman', '+6590000003', true, 'moderator', NOW()),
('50000000-0000-0000-0000-000000000004', 'gov_kumar', 'kumar.gov@example.sg', 'Raj', 'Kumar', '+6590000004', true, 'admin', NOW()),
('50000000-0000-0000-0000-000000000005', 'volunteer_lim', 'lim.volunteer@example.sg', 'Wei', 'Lim', '+6590000005', false, 'user', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, password_hash) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '$2b$10$samplehashcitizenamy'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '$2b$10$samplehashscdflee'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '$2b$10$samplehashspfnur'),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '$2b$10$samplehashgovkumar'),
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '$2b$10$samplehashvollim')
ON CONFLICT (id) DO NOTHING;

INSERT INTO refresh_tokens (
  id, account_id, refresh_token_hash, expires_at, revoked_at
) VALUES
('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'refresh-hash-amy', NOW() + INTERVAL '30 days', NULL),
('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'refresh-hash-lee', NOW() + INTERVAL '30 days', NULL),
('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', 'refresh-hash-nur', NOW() + INTERVAL '30 days', NULL),
('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004', 'refresh-hash-kumar', NOW() + INTERVAL '30 days', NULL),
('70000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005', 'refresh-hash-lim', NOW() + INTERVAL '30 days', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO discussions (id, incident_id, title) VALUES
('80000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Fire response coordination'),
('80000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Traffic diversion and medical response'),
('80000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Flood response updates'),
('80000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Hazmat verification thread'),
('80000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Shelter operations thread')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, discussion_id, sender_id, parent_id, body) VALUES
('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', NULL, 'SCDF unit is en route to the residential block.'),
('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', NULL, 'Traffic patrol is setting up lane diversion.'),
('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', NULL, 'Please update water level after drainage team assessment.'),
('90000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', NULL, 'Hazmat team requested for site verification.'),
('90000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', NULL, 'Volunteer support available for shelter registration desk.')
ON CONFLICT (id) DO NOTHING;
