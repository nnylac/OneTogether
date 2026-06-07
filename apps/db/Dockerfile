FROM postgres:latest

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password

COPY 01_create.sql /docker-entrypoint-initdb.d/01_create.sql
COPY 02_populate.sql /docker-entrypoint-initdb.d/02_populate.sql
COPY 04_assigned_orgs_assignment_fields.sql /docker-entrypoint-initdb.d/04_assigned_orgs_assignment_fields.sql
