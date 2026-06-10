# Government Analytics Contract

This document defines the metrics and data-quality rules for the government
analytics dashboard. It is the contract for the implemented overview endpoint
and the remaining backend analytics/frontend chart work.

No metric should be presented as an operational fact unless its source and
quality level below support that claim.

## Quality Levels

- `direct`: calculated from dedicated structured database fields.
- `estimated`: calculated from a structured estimate, such as an agency ETA.
- `inferred`: derived from log wording or lifecycle status because no dedicated
  timestamp exists.

Dashboard tooltips and API responses should expose the quality level for timing
metrics.

## Shared Filters

All analytics endpoints should support the same optional filters:

- `from`: inclusive ISO timestamp.
- `to`: exclusive ISO timestamp.
- `incidentType`: exact canonical incident type.
- `severity`: integer from 1 to 5.
- `status`: canonical incident status.
- `organisationId`: assigned organisation UUID.
- `region`: derived Singapore macro-region.

The default date range should be the most recent 30 days. Date filtering uses
`incidents.created_at`.

## Region Derivation

The current incident table does not contain a region field. Region is therefore
derived without changing the database schema.

Preferred source order:

1. Incident latitude and longitude.
2. Recognised area text in `incidents.inc_location`.
3. `Unknown` when neither source can be mapped safely.

Initial dashboard regions:

- Central
- East
- West
- North
- North-East
- Unknown

Region is a derived reporting dimension and must not overwrite incident data.

## Overview Metrics

| Metric | Calculation | Source | Quality |
|---|---|---|---|
| Total incidents | Count of filtered incidents | `incidents.id` | direct |
| Active incidents | Count where status is not closed | `incidents.inc_status` | direct |
| Closed incidents | Count where status is closed | `incidents.inc_status` | direct |
| Critical incidents | Count where severity is 5 | `incidents.severity` | direct |
| Critical incident rate | Critical incidents / total incidents | `incidents.severity` | direct |
| Average severity | Average filtered severity | `incidents.severity` | direct |
| Average resolution time | Average `resolved_at - created_at` for closed incidents | `incidents` timestamps | direct |
| Median resolution time | 50th percentile of resolution duration | `incidents` timestamps | direct |
| P90 resolution time | 90th percentile of resolution duration | `incidents` timestamps | direct |
| Multi-agency rate | Incidents with more than one assignment / total incidents | `assigned_orgs` | direct |
| Average SCDF ETA | Average SCDF resource ETA | `incident_resources.eta_minutes` | estimated |
| Resource utilisation | Deployed / total resources | `resource_inventory` | direct snapshot |

Rates return `0`, not `NaN`, when the denominator is zero. Duration metrics
return `null` when no qualifying records exist.

## Incident Analytics

### Incident Volume Over Time

- Group incidents by day by default.
- Allow hourly buckets for ranges of seven days or less.
- Allow weekly buckets for ranges longer than 90 days.
- Source: `incidents.created_at`.
- Quality: direct.

### Incidents By Type

- Count by `incidents.incident_type`.
- Include percentage of the filtered total.
- Quality: direct.

### Incidents By Region

- Count using the derived region mapping.
- Include `Unknown` instead of dropping unmapped incidents.
- Quality: inferred dimension over direct incident counts.

### Severity Distribution

- Count severity values 1 through 5.
- Missing buckets must be returned with count `0`.
- Quality: direct.

### Status Distribution

- Count canonical active and closed statuses.
- Preserve unexpected values under `other` for visibility.
- Quality: direct.

### Peak Periods

- Group by Singapore local hour and weekday.
- Store and query timestamps in UTC, then convert to `Asia/Singapore` for
  reporting.
- Quality: direct.

### Resolution Performance

- Use only incidents with non-null `resolved_at`.
- Ignore negative durations as invalid records and report their count under
  `dataQuality.invalidDurations`.
- Return average, median and P90 duration in minutes.
- Quality: direct.

## Organisation Analytics

### Incidents Handled

- Count distinct incidents per organisation.
- Source: `assigned_orgs` joined to `organisations`.
- Quality: direct.

### Active Workload

- Count assignments not marked `COMPLETED`.
- Quality: direct snapshot.

### Completion Rate

- Completed assignments / all assignments.
- Quality: direct snapshot.

### First Recorded Agency Update

- For each incident and agency, find the earliest matching `logs.created_at`.
- Duration is earliest agency log minus incident creation.
- This is not guaranteed to be dispatch or arrival time.
- Quality: inferred.

### First Active Response

- Find the earliest agency log containing a status or update indicating
  `IN_PROGRESS`, `ON SCENE`, `REOPENED`, `ACTIVE`, or recognised arrival text.
- Duration is that log timestamp minus incident creation.
- Quality: inferred.

### Assignment Timestamp Limitation

New assignments preserve `assigned_orgs.assigned_at` as the time the
organisation was first assigned. Later agency updates change assignment status
without replacing this timestamp.

Records created before this behavior changed may contain the timestamp of their
last middleware update. Historical seed data can use `assigned_at` reliably,
but pre-existing simulator records must not automatically be labelled as
original assignment timestamps.

## SCDF Response Analytics

### Dispatch Timestamp

- Earliest `incident_resources.dispatched_at` for an SCDF incident resource.
- Quality: direct for the simulator dispatch record.

### Estimated Travel Time

- Average, median and P90 of `incident_resources.eta_minutes`.
- Filter to `agency = 'SCDF'`.
- Quality: estimated.

### Estimated Arrival Timestamp

- Use `incident_resources.eta_at` when present.
- This is not actual arrival.
- Quality: estimated.

### First On-Scene Signal

- Earliest SCDF log containing `on scene`, `arrived`, or
  `location confirmed on scene`.
- Quality: inferred.

### Actual Response Time

Actual dispatch-to-arrival time is unavailable because the current schema has no
dedicated arrival timestamp. The dashboard must not label ETA or log inference
as actual response time.

## Resource Analytics

### Current Inventory

- Sum `total`, `available`, `deployed`, `reserved`, and `maintenance`.
- Group by agency, region, outlet and resource category.
- Source: `resource_outlets` and `resource_inventory`.
- Quality: direct snapshot.

### Utilisation

```txt
utilisation = deployed / total
```

- Return `0` when total is zero.
- Flag over-allocated records where component counts exceed total.
- Quality: direct snapshot.

### Availability

```txt
availability = available / total
```

- Quality: direct snapshot.

### Incident Resource Demand

- Count `incident_resources` by agency, resource kind and incident type.
- Report average units dispatched per incident.
- Quality: direct for extracted agency resource records.

### Capacity Pressure

An outlet is under pressure when either:

- availability is below 20 percent, or
- deployed resources exceed 70 percent.

Thresholds are dashboard policy, not fields stored in the database.

## Analysis Quality Metrics

- Category distribution from `incidents.category`.
- Urgency distribution from `incidents.urgency`.
- Average analysis confidence from `incidents.confidence`.
- Analysis completion rate from `incidents.analysis_status`.
- Low-confidence count where confidence is below `0.7`.

These metrics describe the deterministic incident-analysis output, not response
agency performance.

## Proposed API Boundaries

All routes use the backend global `/api` prefix.

```txt
GET /api/analytics/overview
GET /api/analytics/forecast
GET /api/analytics/incidents
GET /api/analytics/organisations
GET /api/analytics/resources
GET /api/analytics/response-times
```

### Implemented: Overview

`GET /api/analytics/overview` is the first implemented endpoint. It is
multi-agency and returns:

- national incident totals and resolution-time percentiles;
- incident type, region, severity and lifecycle status distributions;
- one row per assigned organisation, including SPF, SCDF, PUB, NEA, Town
  Council, SingHealth and NUHS when present;
- incidents handled, active workload and completion rate;
- inferred first-update and first-active-response timing.

Example:

```txt
GET /api/analytics/overview?from=2026-06-01T00:00:00.000Z&to=2026-07-01T00:00:00.000Z&region=East
```

Organisation timing uses only logs whose `agency_id` matches that assigned
organisation. Scenario-engine milestone logs are therefore not treated as
agency performance. Common response signals include dispatch, deployment,
en-route, on-scene and active-response statuses; agency-specific metrics such
as ambulance ETA remain outside this shared comparison.

The government frontend at `/government/analytics` currently consumes this
endpoint and renders:

- date, region, severity and organisation filters;
- national KPI cards;
- switchable bar and doughnut charts for type, region, severity and lifecycle
  status;
- direct average, median and P90 resolution-time visualisation;
- switchable multi-agency workload chart and detailed performance table;
- loading, empty, error and data-quality states.

These visualisations use existing React/CSS components and accessible inline
SVG, without a charting dependency or fabricated data.

Each response should include:

```json
{
  "filters": {},
  "generatedAt": "2026-06-10T00:00:00.000Z",
  "data": {},
  "dataQuality": {
    "unknownRegions": 0,
    "invalidDurations": 0,
    "inferredMetrics": []
  }
}
```

The frontend should receive aggregated chart data rather than raw incidents.

### Implemented: Simulation Forecast

`GET /api/analytics/forecast` projects scenario-engine incident behavior over a
future horizon. It uses the same filters and date range as the overview
endpoint, plus an optional `days` value from 1 to 30. The default horizon is
seven days.

The first model is intentionally simple and explainable:

1. Incidents receive exponentially decreasing weight with a 14-day half-life.
2. Weighted incident volume is divided by the weighted history exposure to
   estimate a current daily rate.
3. The daily rate is multiplied by the forecast horizon.
4. The expected total is distributed across future dates using smoothed,
   recency-weighted weekday patterns.
5. Incident type and derived region projections use their weighted historical
   shares.
6. The likely range is an approximate 95 percent Poisson interval.

The response includes:

- expected incidents and likely low/high range;
- up to 14 observed daily values followed by the projected daily time series;
- confidence, sample size and history duration;
- highest projected incident type and region;
- projected distributions by type and region;
- model metadata and limitations.

Confidence describes the amount of supporting simulation history, not a
guarantee of forecast accuracy:

- `very_low`: fewer than 10 incidents or 7 days;
- `low`: fewer than 30 incidents or 21 days;
- `medium`: fewer than 100 incidents or 60 days;
- `high`: at least 100 incidents across at least 60 days.

The forecast recalculates whenever the endpoint is requested, so newly ingested
scenario incidents are included automatically. It does not require a trained ML
model, a schema migration or seeded history.

The dashboard must label this as a simulation forecast. It predicts patterns
produced by the scenario engine and must not be represented as real-world
Singapore emergency risk.

## Dashboard Sections

1. Shared date, region, incident type, severity, status and organisation
   filters.
2. Overview metric cards.
3. Automatic simulation forecast with uncertainty and confidence.
4. Incident volume, type, region, severity and peak-period charts.
5. Resolution-time trends.
6. Organisation workload and inferred response metrics.
7. SCDF dispatch and ETA analytics with explicit estimated/inferred labels.
8. Resource utilisation, availability, demand and capacity pressure.
9. Data-quality notes explaining unavailable or inferred metrics.

## Next Analytics Phase

The planned next phase is:

1. Add incident volume time-series data to the backend.
2. Add resource utilisation and capacity-pressure analytics.
3. Add agency-specific measures only where the source data supports them, such
   as SCDF ETA or hospital handoff measures.
4. Add responsive time-series and utilisation charts with detailed tooltips
   when those backend datasets are available.
5. Backtest the simulation forecast once enough generated history exists and
   compare it with seasonal or count-regression models.

## Empty Data Behaviour

- Return all expected categories with zero counts where practical.
- Return `null` for unavailable averages and percentiles.
- Return an empty array for chart series with no records.
- Never fabricate trends in the API or frontend.
- Show a dashboard empty state when the selected filters contain no incidents.

## Historical Seed Requirements

Historical analytics seed data will be a separate, opt-in development script.
It must:

- avoid Prisma schema changes;
- use the existing tables and constraints;
- prefix `external_incident_id` with `ANALYTICS-SEED-`;
- be idempotent;
- include a cleanup script limited to seeded records;
- create internally consistent incidents, assignments, logs and SCDF resources;
- distribute records across incident types, regions, severity levels and dates;
- preserve existing non-seeded data.

No historical seed should run automatically during normal Docker startup.
