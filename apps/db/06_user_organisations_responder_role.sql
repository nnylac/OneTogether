-- Renames moderator role to responder and adds user-organisation links for existing local databases.
-- New databases created from 01_create.sql already include these changes.
\c one_together;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users
SET role = 'responder'
WHERE role = 'moderator';

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('user', 'responder', 'admin'));

CREATE TABLE IF NOT EXISTS user_organisations (
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    organisation_id UUID        NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, organisation_id)
);

CREATE INDEX IF NOT EXISTS idx_user_organisations_user_id         ON user_organisations (user_id);
CREATE INDEX IF NOT EXISTS idx_user_organisations_organisation_id ON user_organisations (organisation_id);

INSERT INTO user_organisations (user_id, organisation_id)
SELECT users.id, organisations.id
FROM (VALUES
    ('scdf_ops_lee', 'SCDF'),
    ('spf_cmd_tan', 'SPF'),
    ('moh_watch_ng', 'MOH'),
    ('pub_flood_lim', 'PUB'),
    ('lta_incident_koh', 'LTA')
) AS links(username, org_name)
JOIN users ON users.username = links.username
JOIN organisations ON organisations.org_name = links.org_name
ON CONFLICT (user_id, organisation_id) DO NOTHING;
