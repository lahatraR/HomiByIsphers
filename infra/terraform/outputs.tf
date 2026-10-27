output "kubeconfig_path" {
  description = "Chemin du kubeconfig du cluster : export KUBECONFIG=<valeur>."
  value       = kind_cluster.this.kubeconfig_path
}

output "frontend_url" {
  description = "URL du front via l'ingress."
  value       = "http://${var.ingress_host}${var.http_port == 80 ? "" : ":${var.http_port}"}/HomiByIsphers/"
}

output "api_health_url" {
  description = "URL du health check de l'API via l'ingress."
  value       = "http://${var.ingress_host}${var.http_port == 80 ? "" : ":${var.http_port}"}/api/health"
}

output "namespace" {
  description = "Namespace de l'application."
  value       = var.namespace
}
