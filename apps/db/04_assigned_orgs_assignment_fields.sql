-- Adds resource assignment detail fields for existing local databases.
-- New databases created from 01_create.sql already include these columns.
\c one_together;

ALTER TABLE assigned_orgs
    ADD COLUMN IF NOT EXISTS unit_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE assigned_orgs
SET unit_name = organisations.org_name || ' Response Unit'
FROM organisations
WHERE assigned_orgs.organisation_id = organisations.id
  AND (assigned_orgs.unit_name IS NULL OR BTRIM(assigned_orgs.unit_name) = '');

UPDATE assigned_orgs
SET status = 'DISPATCHED'
WHERE status IS NULL
   OR status NOT IN ('DISPATCHED', 'ON SCENE', 'COMPLETED');

UPDATE assigned_orgs
SET notes = ''
WHERE notes IS NULL;

ALTER TABLE assigned_orgs
    ALTER COLUMN unit_name SET DEFAULT 'Response Unit',
    ALTER COLUMN unit_name SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'DISPATCHED',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN notes SET DEFAULT '',
    ALTER COLUMN notes SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'assigned_orgs_status_check'
    ) THEN
        ALTER TABLE assigned_orgs
            ADD CONSTRAINT assigned_orgs_status_check
            CHECK (status IN ('DISPATCHED', 'ON SCENE', 'COMPLETED'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_assigned_orgs_status ON assigned_orgs (status);
