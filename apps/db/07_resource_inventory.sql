-- Adds synchronized external resource outlet and inventory tables for existing local databases.
-- New databases created from 01_create.sql already include these tables.
\c one_together;

CREATE TABLE IF NOT EXISTS resource_outlets (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation_id    UUID         REFERENCES organisations (id) ON DELETE SET NULL,
    agency_id          VARCHAR(50)  NOT NULL,
    external_outlet_id VARCHAR(120) NOT NULL,
    name               VARCHAR(150) NOT NULL,
    outlet_type        VARCHAR(80)  NOT NULL,
    region             VARCHAR(100),
    address            TEXT,
    latitude           NUMERIC(10,7),
    longitude          NUMERIC(10,7),
    source_system_id   VARCHAR(80)  NOT NULL,
    last_synced_at     TIMESTAMPTZ  NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (agency_id, external_outlet_id)
);

DROP TRIGGER IF EXISTS trg_resource_outlets_updated_at ON resource_outlets;
CREATE TRIGGER trg_resource_outlets_updated_at
BEFORE UPDATE ON resource_outlets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_resource_outlets_agency_id       ON resource_outlets (agency_id);
CREATE INDEX IF NOT EXISTS idx_resource_outlets_organisation_id ON resource_outlets (organisation_id);
CREATE INDEX IF NOT EXISTS idx_resource_outlets_type            ON resource_outlets (outlet_type);
CREATE INDEX IF NOT EXISTS idx_resource_outlets_region          ON resource_outlets (region);
CREATE INDEX IF NOT EXISTS idx_resource_outlets_last_synced_at  ON resource_outlets (last_synced_at);

CREATE TABLE IF NOT EXISTS resource_inventory (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    outlet_id            UUID         NOT NULL REFERENCES resource_outlets (id) ON DELETE CASCADE,
    external_resource_id VARCHAR(120) NOT NULL,
    resource_name        VARCHAR(150) NOT NULL,
    resource_category    VARCHAR(80)  NOT NULL,
    unit                 VARCHAR(30)  NOT NULL DEFAULT 'count',
    total                INTEGER      NOT NULL CHECK (total >= 0),
    available            INTEGER      NOT NULL CHECK (available >= 0),
    deployed             INTEGER      NOT NULL DEFAULT 0 CHECK (deployed >= 0),
    reserved             INTEGER      NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    maintenance          INTEGER      NOT NULL DEFAULT 0 CHECK (maintenance >= 0),
    last_synced_at       TIMESTAMPTZ  NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (outlet_id, external_resource_id)
);

DROP TRIGGER IF EXISTS trg_resource_inventory_updated_at ON resource_inventory;
CREATE TRIGGER trg_resource_inventory_updated_at
BEFORE UPDATE ON resource_inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_resource_inventory_outlet_id            ON resource_inventory (outlet_id);
CREATE INDEX IF NOT EXISTS idx_resource_inventory_category             ON resource_inventory (resource_category);
CREATE INDEX IF NOT EXISTS idx_resource_inventory_external_resource_id ON resource_inventory (external_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_inventory_last_synced_at       ON resource_inventory (last_synced_at);
