\c one_together;

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS external_incident_id TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS severity_estimate INTEGER,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4);

CREATE UNIQUE INDEX IF NOT EXISTS uq_incidents_external_incident_id
  ON incidents (external_incident_id)
  WHERE external_incident_id IS NOT NULL;

DELETE FROM incident_sources older
USING incident_sources keeper
WHERE older.external_ticket_id = keeper.external_ticket_id
  AND older.incident_id::text > keeper.incident_id::text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_incident_sources_external_ticket_id
  ON incident_sources (external_ticket_id);
