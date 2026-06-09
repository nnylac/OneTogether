\c one_together;

CREATE TABLE IF NOT EXISTS incident_resources (
    id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id    UUID         NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    unit_ref       VARCHAR(60)  NOT NULL,
    agency         VARCHAR(50)  NOT NULL,
    resource_kind  VARCHAR(30)  NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    origin_station VARCHAR(60),
    origin_lat     DOUBLE PRECISION,
    origin_lng     DOUBLE PRECISION,
    eta_minutes    INTEGER,
    eta_at         TIMESTAMPTZ,
    dispatched_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    notes          TEXT,

    CONSTRAINT uq_incident_resources_incident_unit UNIQUE (incident_id, unit_ref)
);

CREATE INDEX IF NOT EXISTS idx_incident_resources_incident_id ON incident_resources (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_resources_status      ON incident_resources (status);
