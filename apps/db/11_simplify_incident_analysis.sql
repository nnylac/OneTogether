\c one_together;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_category'
  ) THEN
    UPDATE incidents SET category = COALESCE(category, ai_category);
    ALTER TABLE incidents DROP COLUMN ai_category;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_urgency'
  ) THEN
    UPDATE incidents SET urgency = COALESCE(urgency, ai_urgency);
    ALTER TABLE incidents DROP COLUMN ai_urgency;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_severity_estimate'
  ) THEN
    UPDATE incidents
    SET severity_estimate = COALESCE(severity_estimate, ai_severity_estimate);
    ALTER TABLE incidents DROP COLUMN ai_severity_estimate;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_confidence'
  ) THEN
    UPDATE incidents SET confidence = COALESCE(confidence, ai_confidence);
    ALTER TABLE incidents DROP COLUMN ai_confidence;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_analysis_status'
  ) THEN
    UPDATE incidents
    SET analysis_status = COALESCE(ai_analysis_status, analysis_status);
    ALTER TABLE incidents DROP COLUMN ai_analysis_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_executive_summary'
  ) THEN
    UPDATE incidents
    SET executive_summary = COALESCE(executive_summary, ai_executive_summary);
    ALTER TABLE incidents DROP COLUMN ai_executive_summary;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_response_plan'
  ) THEN
    UPDATE incidents
    SET response_plan = COALESCE(response_plan, ai_response_plan);
    ALTER TABLE incidents DROP COLUMN ai_response_plan;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_entities'
  ) THEN
    UPDATE incidents
    SET entities = COALESCE(entities, ai_entities::text);
    ALTER TABLE incidents DROP COLUMN ai_entities;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'ai_finalized_at'
  ) THEN
    UPDATE incidents
    SET analysis_finalized_at = COALESCE(
      analysis_finalized_at,
      ai_finalized_at
    );
    ALTER TABLE incidents DROP COLUMN ai_finalized_at;
  END IF;
END
$$;

ALTER TABLE incidents
  DROP COLUMN IF EXISTS ai_outcome,
  DROP COLUMN IF EXISTS ai_follow_up_actions,
  DROP COLUMN IF EXISTS ai_data_quality_notes;

ALTER TABLE logs
  ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) NOT NULL DEFAULT 'SYSTEM';

UPDATE logs
SET agency_id = COALESCE(
  NULLIF(substring(content FROM '^([A-Z_]+) '), ''),
  'SYSTEM'
)
WHERE agency_id = 'SYSTEM';
