-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "boundaryGeoJson" TEXT;
ALTER TABLE "Incident" ADD COLUMN "latitude" REAL;
ALTER TABLE "Incident" ADD COLUMN "longitude" REAL;

-- AlterTable
ALTER TABLE "IncidentUpload" ADD COLUMN "latitude" REAL;
ALTER TABLE "IncidentUpload" ADD COLUMN "longitude" REAL;

-- AlterTable
ALTER TABLE "ResourceUnit" ADD COLUMN "lastKnownLat" REAL;
ALTER TABLE "ResourceUnit" ADD COLUMN "lastKnownLng" REAL;

-- AlterTable
ALTER TABLE "TimelineEvent" ADD COLUMN "latitude" REAL;
ALTER TABLE "TimelineEvent" ADD COLUMN "longitude" REAL;

-- CreateTable
CREATE TABLE "IncidentPOI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentPOI_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
