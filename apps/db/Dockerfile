FROM postgres:latest

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password

COPY 01_create.sql /docker-entrypoint-initdb.d/01_create.sql