\c one_together;

CREATE TABLE IF NOT EXISTS community_events (
    id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title            VARCHAR(150) NOT NULL,
    organiser_name   VARCHAR(120) NOT NULL,
    category         VARCHAR(50)  NOT NULL,
    description      TEXT,
    location         TEXT,
    region           VARCHAR(100),
    start_at         TIMESTAMPTZ,
    end_at           TIMESTAMPTZ,
    capacity         INTEGER,
    registered_count INTEGER      NOT NULL DEFAULT 0,
    is_free          BOOLEAN      NOT NULL DEFAULT TRUE,
    signup_url       TEXT,
    event_status     VARCHAR(30)  NOT NULL DEFAULT 'open',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE volunteer_opportunities
    ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) NOT NULL DEFAULT 'normal';
ALTER TABLE volunteer_opportunities
    ADD COLUMN IF NOT EXISTS slots_total INTEGER;
ALTER TABLE volunteer_opportunities
    ADD COLUMN IF NOT EXISTS slots_filled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE volunteer_opportunities
    ADD COLUMN IF NOT EXISTS requires_training BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_community_events_capacity_non_negative') THEN
        ALTER TABLE community_events ADD CONSTRAINT chk_community_events_capacity_non_negative CHECK (capacity IS NULL OR capacity >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_community_events_registered_non_negative') THEN
        ALTER TABLE community_events ADD CONSTRAINT chk_community_events_registered_non_negative CHECK (registered_count >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_community_events_registered_capacity') THEN
        ALTER TABLE community_events ADD CONSTRAINT chk_community_events_registered_capacity CHECK (capacity IS NULL OR registered_count <= capacity);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_community_events_status') THEN
        ALTER TABLE community_events ADD CONSTRAINT chk_community_events_status CHECK (event_status IN ('open', 'closed', 'cancelled', 'completed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_volunteer_opportunities_urgency') THEN
        ALTER TABLE volunteer_opportunities ADD CONSTRAINT chk_volunteer_opportunities_urgency CHECK (urgency IN ('normal', 'urgent', 'critical'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_volunteer_opportunities_slots_total_non_negative') THEN
        ALTER TABLE volunteer_opportunities ADD CONSTRAINT chk_volunteer_opportunities_slots_total_non_negative CHECK (slots_total IS NULL OR slots_total >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_volunteer_opportunities_slots_filled_non_negative') THEN
        ALTER TABLE volunteer_opportunities ADD CONSTRAINT chk_volunteer_opportunities_slots_filled_non_negative CHECK (slots_filled >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_volunteer_opportunities_slots') THEN
        ALTER TABLE volunteer_opportunities ADD CONSTRAINT chk_volunteer_opportunities_slots CHECK (slots_total IS NULL OR slots_filled <= slots_total);
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_community_events_updated_at ON community_events;
CREATE TRIGGER trg_community_events_updated_at
BEFORE UPDATE ON community_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_community_events_status    ON community_events (event_status);
CREATE INDEX IF NOT EXISTS idx_community_events_region    ON community_events (region);
CREATE INDEX IF NOT EXISTS idx_community_events_category  ON community_events (category);
CREATE INDEX IF NOT EXISTS idx_community_events_start_at  ON community_events (start_at);

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_urgency ON volunteer_opportunities (urgency);

WITH seed_community_events (
    id,
    title,
    organiser_name,
    category,
    description,
    location,
    region,
    start_at,
    end_at,
    capacity,
    registered_count,
    is_free,
    signup_url,
    event_status,
    created_at
) AS (
    VALUES
    ('51000000-0000-0000-0000-000000000001'::uuid, 'Community Emergency Preparedness Workshop', 'Jurong West RC', 'preparedness', 'Learn basic first aid, emergency preparation, evacuation steps, and how to support neighbours during a crisis.', 'Jurong West CC, Multi-Purpose Hall 1', 'West', '2026-05-24 09:00:00+08'::timestamptz, '2026-05-24 12:00:00+08'::timestamptz, 60, 38, TRUE, 'https://onetogether.sg/community/preparedness-workshop', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000002'::uuid, 'Flood Relief Donation Drive', 'Singapore Red Cross', 'relief', 'Donate clean clothes, bottled water, blankets, hygiene kits, and packed food for residents affected by flooding.', 'Clementi MRT Station Exit A', 'West', '2026-05-20 09:00:00+08'::timestamptz, '2026-05-21 21:00:00+08'::timestamptz, 100, 72, TRUE, 'https://redcross.sg/volunteer/flood-relief-donation-drive', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000003'::uuid, 'Basic First Aid Training', 'SCDF Community Resilience', 'training', 'Hands-on training covering CPR awareness, wound care, emergency response basics, and when to call emergency services.', 'Clementi Community Club', 'West', '2026-05-25 14:00:00+08'::timestamptz, '2026-05-25 17:00:00+08'::timestamptz, 40, 21, TRUE, 'https://www.scdf.gov.sg/community-volunteers/basic-first-aid-training', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000004'::uuid, 'Neighbourhood Flood Readiness Briefing', 'Tanjong Pagar Town Council', 'preparedness', 'A short resident briefing on flood-prone areas, reporting channels, safety procedures, and evacuation reminders.', 'Tanjong Pagar Community Club', 'Central', '2026-05-26 19:00:00+08'::timestamptz, '2026-05-26 20:30:00+08'::timestamptz, 80, 46, TRUE, 'https://onetogether.sg/community/flood-readiness-briefing', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000005'::uuid, 'Emergency Kit Packing Session', 'People''s Association', 'relief', 'Help prepare emergency kits containing water, masks, torchlights, simple medical supplies, and safety leaflets.', 'Queenstown Community Centre', 'Central', '2026-05-27 10:00:00+08'::timestamptz, '2026-05-27 13:00:00+08'::timestamptz, 50, 33, TRUE, 'https://www.pa.gov.sg/volunteer/emergency-kit-packing-session', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000006'::uuid, 'Evacuation Centre - Registration Desk', 'SCDF Community Resilience Volunteer Portal', 'volunteer', 'Assist residents with registration, queue management, and basic information at the evacuation centre. Tags: Registration, Crowd Control, No prior experience.', 'Clementi Community Club', 'West', '2026-05-20 12:00:00+08'::timestamptz, '2026-05-20 20:00:00+08'::timestamptz, 20, 12, TRUE, 'https://www.scdf.gov.sg/community-volunteers/evacuation-centre-registration', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000007'::uuid, 'Flood Relief - Emergency Food Packing', 'Singapore Red Cross Volunteer Portal', 'volunteer', 'Pack emergency food and water supplies for residents affected by flash floods. Tags: Packing, Logistics, No prior experience.', 'Jurong West Sports Centre', 'West', '2026-05-20 10:00:00+08'::timestamptz, '2026-05-20 14:00:00+08'::timestamptz, 30, 18, TRUE, 'https://redcross.sg/volunteer/flood-relief-food-packing', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000008'::uuid, 'Medical Support - First Aid Station', 'SCDF Community Resilience Volunteer Portal', 'volunteer', 'Support first aid volunteers with crowd control, basic supplies, patient guidance, and escalation to responders where needed. Tags: Medical Support, First Aid, Training preferred.', 'Orchard Road First Aid Point', 'Central', '2026-05-20 15:00:00+08'::timestamptz, '2026-05-20 22:00:00+08'::timestamptz, 15, 9, TRUE, 'https://www.scdf.gov.sg/community-volunteers/medical-support-first-aid', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000009'::uuid, 'Relief Supplies - Logistics Runner', 'People''s Association Community Portal', 'volunteer', 'Move packed supplies between collection points, staging areas, and volunteer counters. Tags: Logistics, Supplies, Physical task.', 'Queenstown Community Centre', 'Central', '2026-05-21 09:00:00+08'::timestamptz, '2026-05-21 15:00:00+08'::timestamptz, 25, 10, TRUE, 'https://www.pa.gov.sg/volunteer/relief-supplies-logistics-runner', 'open', '2026-05-20 13:50:00+08'::timestamptz),
    ('51000000-0000-0000-0000-000000000010'::uuid, 'Community Check-in Call Team', 'People''s Association Community Portal', 'volunteer', 'Call vulnerable residents to check on their safety, record support needs, and escalate urgent requests to responders. Tags: Welfare, Phone Support, Remote.', 'Remote / Phone Support', 'Islandwide', '2026-05-21 10:00:00+08'::timestamptz, '2026-05-21 18:00:00+08'::timestamptz, 40, 16, TRUE, 'https://www.pa.gov.sg/volunteer/community-check-in-call-team', 'open', '2026-05-20 13:50:00+08'::timestamptz)
)
INSERT INTO community_events (
    id,
    title,
    organiser_name,
    category,
    description,
    location,
    region,
    start_at,
    end_at,
    capacity,
    registered_count,
    is_free,
    signup_url,
    event_status,
    created_at,
    updated_at
)
SELECT
    id,
    title,
    organiser_name,
    category,
    description,
    location,
    region,
    start_at,
    end_at,
    capacity,
    registered_count,
    is_free,
    signup_url,
    event_status,
    created_at,
    created_at
FROM seed_community_events
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    organiser_name = EXCLUDED.organiser_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    region = EXCLUDED.region,
    start_at = EXCLUDED.start_at,
    end_at = EXCLUDED.end_at,
    capacity = EXCLUDED.capacity,
    registered_count = EXCLUDED.registered_count,
    is_free = EXCLUDED.is_free,
    signup_url = EXCLUDED.signup_url,
    event_status = EXCLUDED.event_status,
    updated_at = EXCLUDED.updated_at;

DELETE FROM volunteer_opportunities
WHERE external_id IN (
    'VOL-FLOOD-FOOD-001',
    'VOL-EVAC-REG-001',
    'VOL-MEDICAL-001',
    'VOL-LOGISTICS-001',
    'VOL-WELFARE-001'
);

DELETE FROM volunteer_sources
WHERE id IN (
    '70000000-0000-0000-0000-000000000001'::uuid,
    '70000000-0000-0000-0000-000000000002'::uuid,
    '70000000-0000-0000-0000-000000000003'::uuid
);
