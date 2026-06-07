-- Adds broadcasts for existing local databases.
-- New databases created from 01_create.sql already include these tables.
\c one_together;

CREATE TABLE IF NOT EXISTS broadcasts (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title              VARCHAR(120) NOT NULL,
    message            TEXT         NOT NULL,
    broadcast_type     VARCHAR(50)  NOT NULL,
    severity           VARCHAR(20)  NOT NULL DEFAULT 'info'
                       CHECK (severity IN ('info', 'advisory', 'warning', 'critical')),
    broadcast_status   VARCHAR(20)  NOT NULL DEFAULT 'draft'
                       CHECK (broadcast_status IN ('draft', 'published', 'archived', 'cancelled')),
    created_by_user_id UUID         REFERENCES users (id) ON DELETE SET NULL,
    published_at       TIMESTAMPTZ,
    archived_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_broadcasts_updated_at ON broadcasts;
CREATE TRIGGER trg_broadcasts_updated_at
BEFORE UPDATE ON broadcasts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts (created_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status     ON broadcasts (broadcast_status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_type       ON broadcasts (broadcast_type);
CREATE INDEX IF NOT EXISTS idx_broadcasts_severity   ON broadcasts (severity);

CREATE TABLE IF NOT EXISTS broadcast_audiences (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broadcast_id    UUID         NOT NULL REFERENCES broadcasts (id) ON DELETE CASCADE,
    audience_type   VARCHAR(20)  NOT NULL
                    CHECK (audience_type IN ('public', 'role', 'organisation', 'region')),
    audience_role   VARCHAR(50),
    organisation_id UUID         REFERENCES organisations (id) ON DELETE CASCADE,
    region          VARCHAR(100),

    CHECK (
        (audience_type = 'public' AND audience_role IS NULL AND organisation_id IS NULL AND region IS NULL)
        OR
        (audience_type = 'role' AND audience_role IS NOT NULL AND organisation_id IS NULL AND region IS NULL)
        OR
        (audience_type = 'organisation' AND organisation_id IS NOT NULL AND audience_role IS NULL AND region IS NULL)
        OR
        (audience_type = 'region' AND region IS NOT NULL AND audience_role IS NULL AND organisation_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_broadcast_audiences_broadcast_id ON broadcast_audiences (broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_audiences_target       ON broadcast_audiences (audience_type, audience_role, organisation_id, region);
