# ============================================================
# VPC — Singapore region, dual-AZ, three subnet tiers
# ============================================================

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true  # Required for EKS nodes to resolve cluster endpoint
  enable_dns_support   = true

  tags = merge(local.tags, { Name = "${local.name}-vpc" })
}

# --- Internet Gateway (gives public subnets internet access) ----------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name}-igw" })
}

# --- Public subnets (one per AZ) --------------------------------------------
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true  # Instances launched here get a public IP

  # EKS ALB controller discovers subnets via these tags
  tags = merge(local.tags, {
    Name                     = "${local.name}-public-${local.azs[count.index]}"
    "kubernetes.io/role/elb" = "1"
  })
}

# --- Private subnets (EKS nodes, Lambda, not internet-reachable directly) ---
resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = local.azs[count.index]

  # EKS internal LBs discover these subnets via this tag
  tags = merge(local.tags, {
    Name                              = "${local.name}-private-${local.azs[count.index]}"
    "kubernetes.io/role/internal-elb" = "1"
    # EKS requires this tag on subnets where nodes will run
    "kubernetes.io/cluster/${local.name}" = "shared"
  })
}

# --- Database subnets (RDS + ElastiCache, isolated tier) --------------------
resource "aws_subnet" "database" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.database_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.tags, {
    Name = "${local.name}-db-${local.azs[count.index]}"
  })
}

# --- Elastic IPs for NAT Gateways -------------------------------------------
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]
  tags       = merge(local.tags, { Name = "${local.name}-nat-eip-${count.index}" })
}

# --- NAT Gateways (one per AZ so each AZ is independent) --------------------
resource "aws_nat_gateway" "main" {
  count         = length(local.azs)
  subnet_id     = aws_subnet.public[count.index].id  # NAT lives in the public subnet
  allocation_id = aws_eip.nat[count.index].id

  depends_on = [aws_internet_gateway.main]
  tags       = merge(local.tags, { Name = "${local.name}-nat-${local.azs[count.index]}" })
}

# --- Route table: public → Internet Gateway ---------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.tags, { Name = "${local.name}-rt-public" })
}

resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --- Route tables: private → NAT Gateway (per AZ) ---------------------------
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.tags, { Name = "${local.name}-rt-private-${local.azs[count.index]}" })
}

resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database subnets share the first private route table (no direct internet needed)
resource "aws_route_table_association" "database" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# --- Subnet groups (required by RDS and ElastiCache) ------------------------
resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  tags       = local.tags
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-cache-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  tags       = local.tags
}
