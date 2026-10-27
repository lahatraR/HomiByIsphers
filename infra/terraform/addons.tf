# Contrôleur d'ingress : Traefik (ingress-nginx est retiré par Kubernetes depuis mars 2026).
# Il écoute en hostPort 80/443 sur le nœud ingress-ready, mappé sur la machine hôte par kind.
resource "helm_release" "traefik" {
  name             = "traefik"
  repository       = "https://traefik.github.io/charts"
  chart            = "traefik"
  version          = var.traefik_chart_version
  namespace        = "traefik"
  create_namespace = true
  atomic           = true
  wait             = true
  timeout          = 600

  values = [yamlencode({
    # Supprime les en-têtes qui "aliasent" ceux gérés par Traefik (X_Forwarded_For…) :
    # PHP les lirait comme X-Forwarded-For, ce qui permettrait de les usurper.
    additionalArguments = [
      "--entrypoints.web.http.aliasheadersstrategy=delete",
      "--entrypoints.websecure.http.aliasheadersstrategy=delete",
    ]
    nodeSelector = { "ingress-ready" = "true" }
    tolerations = [{
      key      = "node-role.kubernetes.io/control-plane"
      operator = "Exists"
      effect   = "NoSchedule"
    }]
    ports = {
      web       = { hostPort = 80 }
      websecure = { hostPort = 443 }
    }
    # Le trafic arrive par hostPort : pas besoin de LoadBalancer (qui resterait
    # "pending" dans kind et bloquerait l'attente de Helm).
    service = { spec = { type = "ClusterIP" } }
    ingressClass = {
      enabled        = true
      isDefaultClass = true
      name           = "traefik"
    }
    providers = {
      kubernetesIngress = { enabled = true }
      kubernetesCRD     = { enabled = true }
    }
  })]

  depends_on = [kind_cluster.this]
}

# metrics-server : fournit les métriques CPU/mémoire au HorizontalPodAutoscaler.
# --kubelet-insecure-tls : les certificats des kubelets kind ne sont pas signés par la CA du cluster.
resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  version    = var.metrics_server_chart_version
  namespace  = "kube-system"
  atomic     = true
  wait       = true
  timeout    = 300

  values = [yamlencode({
    args = ["--kubelet-insecure-tls"]
  })]

  depends_on = [kind_cluster.this]
}
