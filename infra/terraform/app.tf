locals {
  frontend_image_ref = "${var.frontend_image}:${var.frontend_image_tag}"
  api_image_ref      = "${var.api_image}:${var.api_image_tag}"

  # Empreinte des fichiers du chart local : le provider Helm ne détecte pas une
  # modification du chart tant que sa version ne change pas. Passée en valeur,
  # elle déclenche un helm upgrade dès qu'un template change.
  chart_dir      = "${path.module}/../helm/homi"
  chart_checksum = sha1(join("", [for f in sort(fileset(local.chart_dir, "**")) : filesha1("${local.chart_dir}/${f}")]))
}

# Les images sont construites localement (make build) : on les charge dans les
# nœuds kind, sans registre. Re-exécuté dès que le tag ou le cluster change.
resource "terraform_data" "load_images" {
  for_each = var.load_local_images ? toset([local.frontend_image_ref, local.api_image_ref]) : toset([])

  triggers_replace = [kind_cluster.this.id, each.value]

  provisioner "local-exec" {
    command = "kind load docker-image ${each.value} --name ${kind_cluster.this.name}"
  }
}

# Secrets générés par Terraform : rien en clair dans le dépôt.
# Alphanumériques car le mot de passe PostgreSQL est injecté dans DATABASE_URL.
resource "random_password" "app_secret" {
  length  = 48
  special = false
}

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "email_cron_token" {
  length  = 32
  special = false
}

resource "helm_release" "homi" {
  name             = "homi"
  chart            = local.chart_dir
  namespace        = var.namespace
  create_namespace = true
  wait             = true
  wait_for_jobs    = true
  timeout          = var.release_timeout

  values = [yamlencode({
    chartChecksum = local.chart_checksum
    frontend = {
      image = { repository = var.frontend_image, tag = var.frontend_image_tag }
    }
    api = {
      image = { repository = var.api_image, tag = var.api_image_tag }
      config = {
        FRONTEND_URL      = "http://${var.ingress_host}/HomiByIsphers"
        DEFAULT_URI       = "http://${var.ingress_host}"
        CORS_ALLOW_ORIGIN = "^https?://${replace(var.ingress_host, ".", "\\.")}(:[0-9]+)?$"
      }
    }
    ingress = { host = var.ingress_host }
  })]

  set_sensitive = [
    { name = "api.secrets.appSecret", value = random_password.app_secret.result },
    { name = "api.secrets.emailCronToken", value = random_password.email_cron_token.result },
    { name = "postgresql.auth.password", value = random_password.postgres.result },
  ]

  depends_on = [
    helm_release.traefik,
    helm_release.metrics_server,
    terraform_data.load_images,
  ]
}
