-- Adds notifications for existing local databases.
-- New databases created from 01_create.sql already include this table.
\c one_together;

CREATE TABLE IF NOT EXISTS notifications (
    id                UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title             VARCHAR(120)  NOT NULL,
    message           TEXT          NOT NULL,
    notification_type VARCHAR(50)   NOT NULL,
    reference_type    VARCHAR(50),
    reference_id      UUID,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON notifications (notification_type);

CREATE TABLE IF NOT EXISTS notification_recipients (
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

CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification_id ON notification_recipients (notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_recipient       ON notification_recipients (recipient_type, recipient_id, recipient_role);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_is_read         ON notification_recipients (is_read);
