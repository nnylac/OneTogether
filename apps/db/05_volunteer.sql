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

DROP TRIGGER IF EXISTS trg_volunteer_opportunities_updated_at ON volunteer_opportunities;
CREATE TRIGGER trg_volunteer_opportunities_updated_at
BEFORE UPDATE ON volunteer_opportunities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_source_id ON volunteer_opportunities (source_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status    ON volunteer_opportunities (opportunity_status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_region    ON volunteer_opportunities (region);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_type      ON volunteer_opportunities (opportunity_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_start_at  ON volunteer_opportunities (start_at);
