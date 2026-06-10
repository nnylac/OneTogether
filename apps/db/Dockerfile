FROM postgres:latest

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password

COPY 01_create.sql /docker-entrypoint-initdb.d/01_create.sql
COPY 02_populate.sql /docker-entrypoint-initdb.d/02_populate.sql
COPY 03_notifications.sql /docker-entrypoint-initdb.d/03_notifications.sql
COPY 04_assigned_orgs_assignment_fields.sql /docker-entrypoint-initdb.d/04_assigned_orgs_assignment_fields.sql
COPY 04_broadcasts.sql /docker-entrypoint-initdb.d/04_broadcasts.sql
COPY 05_volunteer.sql /docker-entrypoint-initdb.d/05_volunteer.sql
COPY 06_user_organisations_responder_role.sql /docker-entrypoint-initdb.d/06_user_organisations_responder_role.sql
COPY 07_resource_inventory.sql /docker-entrypoint-initdb.d/07_resource_inventory.sql
COPY 07_user_organisation_id.sql /docker-entrypoint-initdb.d/07_user_organisation_id.sql
COPY 08_incident_discussions.sql /docker-entrypoint-initdb.d/08_incident_discussions.sql
COPY 09_incident_aggregation.sql /docker-entrypoint-initdb.d/09_incident_aggregation.sql
COPY 10_ai_final_analysis.sql /docker-entrypoint-initdb.d/10_ai_final_analysis.sql
COPY 11_simplify_incident_analysis.sql /docker-entrypoint-initdb.d/11_simplify_incident_analysis.sql
COPY 12_incident_resources.sql /docker-entrypoint-initdb.d/12_incident_resources.sql
COPY 13_organisation_contact_guides.sql /docker-entrypoint-initdb.d/13_organisation_contact_guides.sql
COPY 14_government_alert_rules.sql /docker-entrypoint-initdb.d/14_government_alert_rules.sql
COPY 15_seed_broadcasts.sql /docker-entrypoint-initdb.d/15_seed_broadcasts.sql
COPY 16_community_and_volunteer.sql /docker-entrypoint-initdb.d/16_community_and_volunteer.sql
