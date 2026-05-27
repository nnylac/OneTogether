# ============================================================
# Cognito — user auth with three role groups
# (citizen / responder / government)
# ============================================================

resource "aws_cognito_user_pool" "main" {
  name = "${local.name}-users"

  # Username is the email address
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # MFA: optional (users can enable TOTP)
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  # Account recovery via email
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Custom attribute to store the user role
  schema {
    name                     = "role"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    string_attribute_constraints {
      min_length = 1
      max_length = 32
    }
  }

  tags = local.tags
}

# --- App client (used by the React frontend) --------------------------------
resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${local.name}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Public client — no secret (SPA cannot store secrets securely)
  generate_secret = false

  # Auth flows allowed for the SPA
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",      # Secure Remote Password (standard login)
    "ALLOW_REFRESH_TOKEN_AUTH"  # Token refresh without re-login
  ]

  # Callback and sign-out URLs — update with your actual domain
  callback_urls = ["https://${var.domain_name}/callback", "http://localhost:5173/callback"]
  logout_urls   = ["https://${var.domain_name}/", "http://localhost:5173/"]

  allowed_oauth_flows                  = ["code"]  # PKCE code flow for SPAs
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  supported_identity_providers = ["COGNITO"]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
}

# --- User groups (maps to role-based access in the frontend) ----------------
resource "aws_cognito_user_group" "citizen" {
  name         = "citizen"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular citizens: report incidents, view public alerts, join volunteer tasks"
  precedence   = 10
}

resource "aws_cognito_user_group" "responder" {
  name         = "responder"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Organisation responders (SCDF, SPF, Red Cross): manage and respond to incidents"
  precedence   = 5
}

resource "aws_cognito_user_group" "government" {
  name         = "government"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Government officials: full dashboard, analytics, broadcast emergency alerts"
  precedence   = 1
}

# --- Hosted UI domain (provides a default login page) -----------------------
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name}-auth"  # Creates auth.${local.name}.auth.ap-southeast-1.amazoncognito.com
  user_pool_id = aws_cognito_user_pool.main.id
}
