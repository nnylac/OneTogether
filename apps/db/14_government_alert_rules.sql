\c one_together;

CREATE TABLE IF NOT EXISTS government_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    threshold_value NUMERIC(12, 2) NOT NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'above',
    unit VARCHAR(20) NOT NULL DEFAULT 'count',
    notification_message TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_government_alert_rules_metric
    ON government_alert_rules(metric);

CREATE INDEX IF NOT EXISTS idx_government_alert_rules_enabled
    ON government_alert_rules(is_enabled)
    WHERE deleted_at IS NULL;

ALTER TABLE government_alert_rules
    DROP CONSTRAINT IF EXISTS government_alert_rules_condition_check;

ALTER TABLE government_alert_rules
    ADD CONSTRAINT government_alert_rules_condition_check
    CHECK (condition IN ('above', 'below'));

ALTER TABLE government_alert_rules
    DROP CONSTRAINT IF EXISTS government_alert_rules_unit_check;

ALTER TABLE government_alert_rules
    ADD CONSTRAINT government_alert_rules_unit_check
    CHECK (unit IN ('count', 'percent'));

ALTER TABLE government_alert_rules
    DROP CONSTRAINT IF EXISTS government_alert_rules_metric_check;

ALTER TABLE government_alert_rules
    ADD CONSTRAINT government_alert_rules_metric_check
    CHECK (
        metric IN (
            'openIncidents',
            'criticalIncidents',
            'hospitalOccupancy',
            'infectiousDiseaseCases',
            'heatInjuryCases',
            'floodReports'
        )
    );

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS metadata JSONB;

INSERT INTO government_alert_rules (
    id,
    name,
    metric,
    threshold_value,
    condition,
    unit,
    notification_message
)
VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        'Open incidents threshold',
        'openIncidents',
        10,
        'above',
        'count',
        'Notify government command when open incidents exceed the safe coordination threshold.'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        'Critical severity threshold',
        'criticalIncidents',
        5,
        'above',
        'count',
        'Escalate when critical incidents exceed five active cases.'
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        'Hospital occupancy threshold',
        'hospitalOccupancy',
        85,
        'above',
        'percent',
        'Notify health operations when linked hospital occupancy exceeds 85%.'
    ),
    (
        '40000000-0000-0000-0000-000000000004',
        'Infectious disease cases threshold',
        'infectiousDiseaseCases',
        80,
        'above',
        'count',
        'Prepare public health guidance if infectious disease reports approach threshold.'
    ),
    (
        '40000000-0000-0000-0000-000000000005',
        'Heat injury cases threshold',
        'heatInjuryCases',
        35,
        'above',
        'count',
        'Issue heat safety advisory when heat injury reports exceed expected limits.'
    ),
    (
        '40000000-0000-0000-0000-000000000006',
        'Flood reports threshold',
        'floodReports',
        12,
        'above',
        'count',
        'Notify flood response leads when flood reports exceed twelve active reports.'
    )
ON CONFLICT (id) DO NOTHING;

