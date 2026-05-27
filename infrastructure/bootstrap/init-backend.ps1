<#
.SYNOPSIS
  Bootstrap Terraform remote state: creates the S3 bucket and DynamoDB table
  that Terraform needs BEFORE you can run terraform init with the S3 backend.

.HOW TO RUN
  1. Configure AWS CLI: aws configure
  2. Run this script: .\infrastructure\bootstrap\init-backend.ps1
  3. Copy the output values into infrastructure/terraform/backend.hcl
  4. Run: cd infrastructure/terraform && terraform init -backend-config=backend.hcl
#>

param(
  [string]$Region  = "ap-southeast-1",
  [string]$Project = "onetogether"
)

# Get AWS account ID to ensure a globally unique bucket name
$AccountId = (aws sts get-caller-identity --query Account --output text)
if (-not $AccountId) {
  Write-Error "AWS CLI not configured or no permissions. Run: aws configure"
  exit 1
}

$BucketName = "$Project-tfstate-$AccountId"
$TableName  = "$Project-tfstate-lock"

Write-Host "Creating Terraform state backend..."
Write-Host "  Bucket : $BucketName"
Write-Host "  Table  : $TableName"
Write-Host "  Region : $Region"
Write-Host ""

# Create S3 bucket for Terraform state
# ap-southeast-1 requires LocationConstraint (us-east-1 does NOT — different behaviour)
$BucketExists = aws s3api head-bucket --bucket $BucketName 2>&1
if ($LASTEXITCODE -ne 0) {
  aws s3api create-bucket `
    --bucket $BucketName `
    --region $Region `
    --create-bucket-configuration LocationConstraint=$Region
  Write-Host "S3 bucket created: $BucketName"
} else {
  Write-Host "S3 bucket already exists: $BucketName"
}

# Enable versioning (lets you recover from accidental state file deletion)
aws s3api put-bucket-versioning `
  --bucket $BucketName `
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption `
  --bucket $BucketName `
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }'

# Block all public access
aws s3api put-public-access-block `
  --bucket $BucketName `
  --public-access-block-configuration `
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

Write-Host "S3 bucket configured."

# Create DynamoDB table for state locking (prevents concurrent Terraform runs)
$TableExists = aws dynamodb describe-table --table-name $TableName 2>&1
if ($LASTEXITCODE -ne 0) {
  aws dynamodb create-table `
    --table-name $TableName `
    --attribute-definitions AttributeName=LockID,AttributeType=S `
    --key-schema AttributeName=LockID,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST `
    --region $Region
  Write-Host "DynamoDB table created: $TableName"
} else {
  Write-Host "DynamoDB table already exists: $TableName"
}

Write-Host ""
Write-Host "==========================================================="
Write-Host "Bootstrap complete! Now create backend.hcl:"
Write-Host ""
Write-Host "  cd infrastructure/terraform"
Write-Host "  Copy-Item backend.hcl.example backend.hcl"
Write-Host "  # Edit backend.hcl and set bucket = `"$BucketName`""
Write-Host "  terraform init -backend-config=backend.hcl"
Write-Host "==========================================================="
