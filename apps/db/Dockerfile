FROM postgres:latest

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password

COPY 01_create.sql /docker-entrypoint-initdb.d/01_create.sql
COPY 02_populate.sql /docker-entrypoint-initdb.d/02_populate.sql
COPY 04_assigned_orgs_assignment_fields.sql /docker-entrypoint-initdb.d/04_assigned_orgs_assignment_fields.sql
COPY 07_user_organisation_id.sql /docker-entrypoint-initdb.d/07_user_organisation_id.sql
COPY 08_incident_discussions.sql /docker-entrypoint-initdb.d/08_incident_discussions.sql
COPY 09_incident_aggregation.sql /docker-entrypoint-initdb.d/09_incident_aggregation.sql
COPY 10_ai_final_analysis.sql /docker-entrypoint-initdb.d/10_ai_final_analysis.sql
COPY 11_simplify_incident_analysis.sql /docker-entrypoint-initdb.d/11_simplify_incident_analysis.sql
COPY 12_incident_resources.sql /docker-entrypoint-initdb.d/12_incident_resources.sql
