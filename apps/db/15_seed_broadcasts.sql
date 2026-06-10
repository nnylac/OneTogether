\c one_together;

-- Published demo broadcasts used by the government and public broadcast pages.
WITH seed_broadcasts (
    id,
    title,
    message,
    severity,
    created_at
) AS (
    VALUES
    (
        '40000000-0000-0000-0000-000000000001'::uuid,
        'Flood Alert - Orchard Area',
        'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.',
        'critical',
        '2026-05-20 13:50:00+08'::timestamptz
    ),
    (
        '40000000-0000-0000-0000-000000000002'::uuid,
        'All Responders - Standby',
        'Multiple incidents reported across CBD. All units on standby for immediate deployment.',
        'warning',
        '2026-05-20 13:50:00+08'::timestamptz
    ),
    (
        '40000000-0000-0000-0000-000000000003'::uuid,
        'Public Safety Advisory',
        'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.',
        'advisory',
        '2026-05-20 13:50:00+08'::timestamptz
    ),
    (
        '40000000-0000-0000-0000-000000000004'::uuid,
        'MRT Disruption Notice',
        'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.',
        'info',
        '2026-05-20 13:50:00+08'::timestamptz
    ),
    (
        '40000000-0000-0000-0000-000000000005'::uuid,
        'Volunteer Call - Medical Support',
        'Multiple medical incidents requiring first aid support. Certified volunteers should report to nearest SCDF station.',
        'warning',
        '2026-05-20 13:50:00+08'::timestamptz
    )
)
INSERT INTO broadcasts (
    id,
    title,
    message,
    broadcast_type,
    severity,
    broadcast_status,
    created_by_user_id,
    published_at,
    created_at,
    updated_at
)
SELECT
    seed_broadcasts.id,
    seed_broadcasts.title,
    seed_broadcasts.message,
    'emergency_advisory',
    seed_broadcasts.severity,
    'published',
    users.id,
    seed_broadcasts.created_at,
    seed_broadcasts.created_at,
    seed_broadcasts.created_at
FROM seed_broadcasts
LEFT JOIN users ON users.username = 'gov'
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    broadcast_type = EXCLUDED.broadcast_type,
    severity = EXCLUDED.severity,
    broadcast_status = EXCLUDED.broadcast_status,
    created_by_user_id = EXCLUDED.created_by_user_id,
    published_at = EXCLUDED.published_at,
    archived_at = NULL,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

DELETE FROM broadcast_audiences
WHERE broadcast_id IN (
    '40000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000002'::uuid,
    '40000000-0000-0000-0000-000000000003'::uuid,
    '40000000-0000-0000-0000-000000000004'::uuid,
    '40000000-0000-0000-0000-000000000005'::uuid
);

INSERT INTO broadcast_audiences (
    broadcast_id,
    audience_type,
    organisation_id,
    region
)
SELECT
    '40000000-0000-0000-0000-000000000001'::uuid,
    'region',
    NULL::uuid,
    'Central'
UNION ALL
SELECT
    '40000000-0000-0000-0000-000000000002'::uuid,
    'organisation',
    organisations.id,
    NULL
FROM organisations
WHERE organisations.org_name = 'SPF'
UNION ALL
SELECT
    '40000000-0000-0000-0000-000000000002'::uuid,
    'organisation',
    organisations.id,
    NULL
FROM organisations
WHERE organisations.org_name = 'SCDF'
UNION ALL
SELECT
    '40000000-0000-0000-0000-000000000003'::uuid,
    'public',
    NULL::uuid,
    NULL
UNION ALL
SELECT
    '40000000-0000-0000-0000-000000000004'::uuid,
    'public',
    NULL::uuid,
    NULL
UNION ALL
SELECT
    '40000000-0000-0000-0000-000000000005'::uuid,
    'organisation',
    organisations.id,
    NULL
FROM organisations
WHERE organisations.org_name = 'SCDF';
