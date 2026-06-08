-- Ensures every incident has exactly one discussion room.
-- Messages stay attached to the kept discussion if duplicates exist.
\c one_together;

CREATE OR REPLACE FUNCTION create_incident_discussion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO discussions (incident_id, title)
    VALUES (NEW.id, 'Incident Discussion')
    ON CONFLICT (incident_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

WITH ranked_discussions AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY incident_id
            ORDER BY created_at ASC, id ASC
        ) AS kept_id,
        ROW_NUMBER() OVER (
            PARTITION BY incident_id
            ORDER BY created_at ASC, id ASC
        ) AS row_number
    FROM discussions
)
UPDATE messages
SET discussion_id = ranked_discussions.kept_id
FROM ranked_discussions
WHERE messages.discussion_id = ranked_discussions.id
  AND ranked_discussions.row_number > 1;

WITH ranked_discussions AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY incident_id
            ORDER BY created_at ASC, id ASC
        ) AS row_number
    FROM discussions
)
DELETE FROM discussions
USING ranked_discussions
WHERE discussions.id = ranked_discussions.id
  AND ranked_discussions.row_number > 1;

INSERT INTO discussions (incident_id, title)
SELECT incidents.id, 'Incident Discussion'
FROM incidents
LEFT JOIN discussions ON discussions.incident_id = incidents.id
WHERE discussions.id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'discussions_incident_id_key'
    ) THEN
        ALTER TABLE discussions
            ADD CONSTRAINT discussions_incident_id_key UNIQUE (incident_id);
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_incidents_create_discussion ON incidents;
CREATE TRIGGER trg_incidents_create_discussion
AFTER INSERT ON incidents
FOR EACH ROW EXECUTE FUNCTION create_incident_discussion();
