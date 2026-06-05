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
    incident_id     UUID    NOT NULL REFERENCES incidents     (id) ON DELETE CASCADE,
    organisation_id UUID    NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (incident_id, organisation_id)
);
CREATE INDEX idx_assigned_orgs_incident_id     ON assigned_orgs (incident_id);
CREATE INDEX idx_assigned_orgs_organisation_id ON assigned_orgs (organisation_id);

CREATE TABLE incident_sources (
    incident_id        UUID             NOT NULL REFERENCES incidents     (id) ON DELETE CASCADE,
    external_ticket_id TEXT             NOT NULL,
    last_synced_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    phone       VARCHAR(20),
    is_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'moderator')),
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








