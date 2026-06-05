# Fresh installation
These commands can be run to whenever u make changes to the schema and need to recreate the whole db.

Run these commands from the root (where the `docker-compose.yml` is)
```bash
docker compose down --volumes --remove-orphans

docker compose build --no-cache

docker compose up --force-recreate db
```

# Connecting to the DB
**Host** is localhost duh.  
**Port** to use can be found in `docker-compose.yml` in the root.  
**Username** and **Password** can be found in `Dockerfile` in this directory.

This will be changed when our DB goes public.

# Stopping the DB
Run this command from the root
```bash
docker compose down
```

# Modifying the schema
`01_create.sql` is the script that creates all the tables in the db and any changes to the schema should be made on that script.

Run the Fresh Installation commands after you have changed the schema