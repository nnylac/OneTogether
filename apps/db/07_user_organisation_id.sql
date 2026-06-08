-- Adds a direct primary organisation link to responder users for existing local databases.
-- Public and government users intentionally keep user_organisation_id empty for now.
-- The user_organisations join table remains available for future multi-organisation users.
\c one_together;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS user_organisation_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_user_organisation_id_fkey'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_user_organisation_id_fkey
            FOREIGN KEY (user_organisation_id)
            REFERENCES organisations (id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

UPDATE users
SET user_organisation_id = organisations.id
FROM organisations
WHERE organisations.org_name = CASE users.username
    WHEN 'responder' THEN 'SCDF'
    WHEN 'scdf_ops_lee' THEN 'SCDF'
    WHEN 'spf_cmd_tan' THEN 'SPF'
    WHEN 'moh_watch_ng' THEN 'MOH'
    WHEN 'pub_flood_lim' THEN 'PUB'
    WHEN 'lta_incident_koh' THEN 'LTA'
END
AND users.username IN (
    'responder',
    'scdf_ops_lee',
    'spf_cmd_tan',
    'moh_watch_ng',
    'pub_flood_lim',
    'lta_incident_koh'
);

UPDATE users
SET user_organisation_id = NULL
WHERE username IN ('citizen', 'gov', 'gov_admin')
   OR role <> 'responder';

CREATE INDEX IF NOT EXISTS idx_users_user_organisation_id ON users (user_organisation_id);
