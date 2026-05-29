# ============================================================
# EKS — Kubernetes cluster in ap-southeast-1, dual-AZ
# ============================================================

resource "aws_eks_cluster" "main" {
  name     = local.name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_kubernetes_version

  vpc_config {
    # Nodes live in private subnets; only the API endpoint is internet-accessible
    subnet_ids              = aws_subnet.private[*].id
    security_group_ids      = [aws_security_group.eks_nodes.id]
    endpoint_private_access = true
    endpoint_public_access  = true  # Set to false after configuring a VPN/bastion
  }

  # Ship control-plane logs to CloudWatch for audit + troubleshooting
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]

  tags = local.tags
}

# --- Managed node group (EC2 Auto Scaling Group managed by EKS) -------------
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn

  # Spread nodes across both private subnets (one per AZ)
  subnet_ids = aws_subnet.private[*].id

  instance_types = [var.eks_node_instance_type]

  scaling_config {
    desired_size = var.eks_desired_nodes
    min_size     = var.eks_min_nodes
    max_size     = var.eks_max_nodes
  }

  # Rolling updates: replace nodes one at a time to keep capacity
  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_read,
  ]

  tags = local.tags
}

# --- aws-auth ConfigMap: grant GitHub Actions role access to the cluster ----
# This allows the CI/CD pipeline to run kubectl commands
resource "kubernetes_config_map_v1_data" "aws_auth" {
  metadata {
    name      = "aws-auth"
    namespace = "kube-system"
  }

  data = {
    mapRoles = yamlencode([
      {
        rolearn  = aws_iam_role.eks_nodes.arn
        username = "system:node:{{EC2PrivateDNSName}}"
        groups   = ["system:bootstrappers", "system:nodes"]
      },
      {
        # Allow GitHub Actions to deploy via kubectl
        rolearn  = aws_iam_role.github_actions.arn
        username = "github-actions"
        groups   = ["system:masters"]
      }
    ])
  }

  force = true

  depends_on = [aws_eks_cluster.main, aws_eks_node_group.main]
}

# --- ArgoCD namespace and Helm install --------------------------------------
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  depends_on = [aws_eks_cluster.main]
}

# --- cert-manager (required by AWS LB Controller v3.x for webhook TLS) ------
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true

  wait    = true
  timeout = 300

  set {
    name  = "crds.enabled"
    value = "true"
  }

  depends_on = [aws_eks_node_group.main]
}

# cert-manager's webhook server needs ~30s after Helm reports ready before it
# can serve TLS for the LB controller's own webhook validation.
resource "time_sleep" "cert_manager_ready" {
  create_duration = "30s"
  depends_on      = [helm_release.cert_manager]
}

# --- AWS Load Balancer Controller (required for ALB Ingress) ----------------
# Must deploy before ArgoCD — ArgoCD's Service creation triggers the LB
# Controller's mutating webhook, which must be running first.
resource "helm_release" "aws_lb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  wait    = true
  timeout = 600

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.aws_lb_controller.arn
  }

  # v3.x can no longer auto-discover VPC ID via instance metadata — must be explicit
  set {
    name  = "vpcId"
    value = aws_vpc.main.id
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  depends_on = [aws_eks_node_group.main, aws_iam_role_policy_attachment.aws_lb_controller, time_sleep.cert_manager_ready]
}

resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "6.7.3"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  set {
    name  = "server.service.type"
    value = "ClusterIP"
  }

  # Depends on LB Controller so the mutating webhook is live before ArgoCD
  # creates any Services that trigger it
  depends_on = [helm_release.aws_lb_controller]
}
