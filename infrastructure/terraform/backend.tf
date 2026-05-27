# Remote state stored in S3 with DynamoDB locking.
# Run infrastructure/bootstrap/init-backend.ps1 FIRST to create the bucket and table,
# then: terraform init -backend-config=backend.hcl
# Copy backend.hcl.example → backend.hcl and fill in your account ID.

terraform {
  backend "s3" {
    # All values supplied via -backend-config=backend.hcl at init time
    # so this file can be committed without hardcoded account IDs.
  }
}
