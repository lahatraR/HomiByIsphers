variable "cluster_name" {
  description = "Nom du cluster kind (et préfixe du fichier kubeconfig généré)."
  type        = string
  default     = "homi"
}

variable "node_image" {
  description = "Image kindest/node : fixe la version de Kubernetes du cluster."
  type        = string
  default     = "kindest/node:v1.34.11"
}

variable "http_port" {
  description = "Port HTTP exposé sur la machine hôte (127.0.0.1) vers l'ingress. À changer si le port 80 est déjà pris."
  type        = number
  default     = 80
}

variable "https_port" {
  description = "Port HTTPS exposé sur la machine hôte (127.0.0.1) vers l'ingress."
  type        = number
  default     = 443
}

variable "namespace" {
  description = "Namespace Kubernetes de l'application."
  type        = string
  default     = "homi"
}

variable "ingress_host" {
  description = "Nom d'hôte de l'Ingress. *.localhost résout vers 127.0.0.1 dans les navigateurs."
  type        = string
  default     = "homi.localhost"
}

variable "frontend_image" {
  description = "Image du front (repository, sans tag)."
  type        = string
  default     = "homi-frontend"
}

variable "api_image" {
  description = "Image de l'API Symfony (repository, sans tag)."
  type        = string
  default     = "homi-api"
}

variable "frontend_image_tag" {
  description = "Tag de l'image du front. Le Makefile passe un tag dérivé du contenu de l'image."
  type        = string
  default     = "local"
}

variable "api_image_tag" {
  description = "Tag de l'image de l'API. Le Makefile passe un tag dérivé du contenu de l'image."
  type        = string
  default     = "local"
}

variable "load_local_images" {
  description = "Charge les images Docker locales dans le cluster (kind load). Désactiver si les images viennent d'un registre."
  type        = bool
  default     = true
}

variable "traefik_chart_version" {
  description = "Version du chart Helm Traefik (contrôleur d'ingress)."
  type        = string
  default     = "42.1.3"
}

variable "metrics_server_chart_version" {
  description = "Version du chart Helm metrics-server (nécessaire au HPA)."
  type        = string
  default     = "3.14.0"
}

variable "release_timeout" {
  description = "Délai maximal (secondes) pour que le release Homi soit prêt, migrations comprises."
  type        = number
  default     = 600
}
