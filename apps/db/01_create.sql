-- CREATE APP DATABASE
create database one_together;
\c one_together;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE organisations (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_name    VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE resources (
    id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_name    VARCHAR(50)  NOT NULL UNIQUE,
    capacity         INTEGER      NOT NULL,
    available        INTEGER      NOT NULL
);

CREATE TABLE incidents (
    id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code             VARCHAR(10)  NOT NULL UNIQUE,
    title            TEXT NOT NULL,
    incident_type    VARCHAR(50)  NOT NULL,
    severity         INTEGER      NOT NULL,
    inc_status       VARCHAR(50)  NOT NULL,
    inc_description  TEXT,
    inc_location     TEXT,
    report           TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resolved_at      TIMESTAMPTZ,
    confidence_score INTEGER
);
CREATE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_incidents_code ON incidents (code);
CREATE INDEX idx_incidents_created_at ON incidents (created_at);
CREATE INDEX idx_incidents_title ON incidents (title);
CREATE INDEX idx_incidents_status ON incidents (inc_status);

CREATE TABLE logs (
    id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id      UUID         NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    content          TEXT         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE assigned_orgs (
    incident_id     UUID         NOT NULL REFERENCES incidents     (id) ON DELETE CASCADE,
    organisation_id UUID         NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    unit_name       VARCHAR(120) NOT NULL DEFAULT 'Response Unit',
    status          VARCHAR(20)  NOT NULL DEFAULT 'DISPATCHED'
                    CHECK (status IN ('DISPATCHED', 'ON SCENE', 'COMPLETED')),
    notes           TEXT         NOT NULL DEFAULT '',

    PRIMARY KEY (incident_id, organisation_id)
);
CREATE INDEX idx_assigned_orgs_incident_id     ON assigned_orgs (incident_id);
CREATE INDEX idx_assigned_orgs_organisation_id ON assigned_orgs (organisation_id);
CREATE INDEX idx_assigned_orgs_status          ON assigned_orgs (status);

CREATE TABLE incident_sources (
    incident_id        UUID             NOT NULL REFERENCES incidents     (id) ON DELETE CASCADE,
    external_ticket_id TEXT             NOT NULL,
    last_synced_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    PRIMARY KEY (incident_id, external_ticket_id)
);
CREATE INDEX idx_incident_sources_incident_id ON incident_sources (incident_id);

CREATE TABLE users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    phone       VARCHAR(20),
    is_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'responder', 'admin')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login  TIMESTAMPTZ
);
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_users_email      ON users (email);
CREATE INDEX idx_users_username   ON users (username);
CREATE INDEX idx_users_role       ON users (role);
CREATE INDEX idx_users_created_at ON users (created_at);

CREATE TABLE user_organisations (
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    organisation_id UUID        NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, organisation_id)
);
CREATE INDEX idx_user_organisations_user_id         ON user_organisations (user_id);
CREATE INDEX idx_user_organisations_organisation_id ON user_organisations (organisation_id);

CREATE TABLE notifications (
    id                UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title             VARCHAR(120)  NOT NULL,
    message           TEXT          NOT NULL,
    notification_type VARCHAR(50)   NOT NULL,
    reference_type    VARCHAR(50),
    reference_id      UUID,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
CREATE INDEX idx_notifications_type       ON notifications (notification_type);

CREATE TABLE notification_recipients (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID        NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    recipient_type  VARCHAR(20) NOT NULL
                    CHECK (recipient_type IN ('user', 'organisation', 'role')),
    recipient_id    UUID,
    recipient_role  VARCHAR(50),
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,

    CHECK (
        (recipient_type IN ('user', 'organisation') AND recipient_id IS NOT NULL AND recipient_role IS NULL)
        OR
        (recipient_type = 'role' AND recipient_id IS NULL AND recipient_role IS NOT NULL)
    )
);
CREATE INDEX idx_notification_recipients_notification_id ON notification_recipients (notification_id);
CREATE INDEX idx_notification_recipients_recipient       ON notification_recipients (recipient_type, recipient_id, recipient_role);
CREATE INDEX idx_notification_recipients_is_read         ON notification_recipients (is_read);

CREATE TABLE broadcasts (
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
CREATE TRIGGER trg_broadcasts_updated_at
BEFORE UPDATE ON broadcasts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_broadcasts_created_at ON broadcasts (created_at);
CREATE INDEX idx_broadcasts_status     ON broadcasts (broadcast_status);
CREATE INDEX idx_broadcasts_type       ON broadcasts (broadcast_type);
CREATE INDEX idx_broadcasts_severity   ON broadcasts (severity);

CREATE TABLE broadcast_audiences (
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
CREATE INDEX idx_broadcast_audiences_broadcast_id ON broadcast_audiences (broadcast_id);
CREATE INDEX idx_broadcast_audiences_target       ON broadcast_audiences (audience_type, audience_role, organisation_id, region);

CREATE TABLE volunteer_sources (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_name     VARCHAR(100) NOT NULL,
    source_url      TEXT         NOT NULL UNIQUE,
    organisation_id UUID         REFERENCES organisations (id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_volunteer_sources_updated_at
BEFORE UPDATE ON volunteer_sources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_volunteer_sources_active          ON volunteer_sources (is_active);
CREATE INDEX idx_volunteer_sources_organisation_id ON volunteer_sources (organisation_id);

CREATE TABLE volunteer_opportunities (
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
CREATE TRIGGER trg_volunteer_opportunities_updated_at
BEFORE UPDATE ON volunteer_opportunities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_volunteer_opportunities_source_id ON volunteer_opportunities (source_id);
CREATE INDEX idx_volunteer_opportunities_status    ON volunteer_opportunities (opportunity_status);
CREATE INDEX idx_volunteer_opportunities_region    ON volunteer_opportunities (region);
CREATE INDEX idx_volunteer_opportunities_type      ON volunteer_opportunities (opportunity_type);
CREATE INDEX idx_volunteer_opportunities_start_at  ON volunteer_opportunities (start_at);

CREATE TABLE accounts (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID         NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_accounts_user_id ON accounts (user_id);

CREATE TABLE refresh_tokens (
    id                 UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id         UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    refresh_token_hash TEXT        NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ
);
CREATE INDEX idx_refresh_tokens_account_id ON refresh_tokens (account_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens (revoked_at);



-- discussion and messages tables
CREATE TABLE discussions (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID         NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    title     VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_discussions_updated_at
BEFORE UPDATE ON discussions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_discussions_created_at ON discussions (created_at);


CREATE TABLE messages (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id   UUID         NOT NULL REFERENCES discussions (id) ON DELETE CASCADE,
    sender_id       UUID         NOT NULL REFERENCES users (id) ON DELETE SET NULL,
    parent_id       UUID         REFERENCES messages (id) ON DELETE CASCADE, -- for reply messages, parent will be the message that is being replied to
    body            TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_discussion_id  ON messages (discussion_id);
CREATE INDEX idx_messages_sender_id  ON messages (sender_id);
CREATE INDEX idx_messages_parent_id  ON messages (parent_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);







