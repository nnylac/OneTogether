-- Adds volunteer source and opportunity tables for existing local databases.
-- New databases created from 01_create.sql already include these tables.
\c one_together;

CREATE TABLE IF NOT EXISTS volunteer_sources (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_name     VARCHAR(100) NOT NULL,
    source_url      TEXT         NOT NULL UNIQUE,
    organisation_id UUID         REFERENCES organisations (id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_volunteer_sources_updated_at ON volunteer_sources;
CREATE TRIGGER trg_volunteer_sources_updated_at
BEFORE UPDATE ON volunteer_sources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_volunteer_sources_active          ON volunteer_sources (is_active);
CREATE INDEX IF NOT EXISTS idx_volunteer_sources_organisation_id ON volunteer_sources (organisation_id);

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
END $$;

DROP TRIGGER IF EXISTS trg_community_events_updated_at ON community_events;
CREATE TRIGGER trg_community_events_updated_at
BEFORE UPDATE ON community_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_community_events_status    ON community_events (event_status);
CREATE INDEX IF NOT EXISTS idx_community_events_region    ON community_events (region);
CREATE INDEX IF NOT EXISTS idx_community_events_category  ON community_events (category);
CREATE INDEX IF NOT EXISTS idx_community_events_start_at  ON community_events (start_at);

CREATE TABLE IF NOT EXISTS volunteer_opportunities (
    id                  UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id           UUID         NOT NULL REFERENCES volunteer_sources (id) ON DELETE CASCADE,
    external_id         TEXT         NOT NULL,
    title               VARCHAR(150) NOT NULL,
    description         TEXT,
    opportunity_type    VARCHAR(50),
    location            TEXT,
    region              VARCHAR(100),
    start_at            TIMESTAMPTZ,
    end_at              TIMESTAMPTZ,
    signup_url          TEXT         NOT NULL,
    source_url          TEXT,
    external_updated_at TIMESTAMPTZ,
    opportunity_status  VARCHAR(30)  NOT NULL DEFAULT 'open',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (source_id, external_id)
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

DROP TRIGGER IF EXISTS trg_volunteer_opportunities_updated_at ON volunteer_opportunities;
CREATE TRIGGER trg_volunteer_opportunities_updated_at
BEFORE UPDATE ON volunteer_opportunities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_source_id ON volunteer_opportunities (source_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status    ON volunteer_opportunities (opportunity_status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_region    ON volunteer_opportunities (region);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_type      ON volunteer_opportunities (opportunity_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_start_at  ON volunteer_opportunities (start_at);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_urgency   ON volunteer_opportunities (urgency);
