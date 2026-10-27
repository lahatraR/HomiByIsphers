# Homi - infrastructure locale (kind + Terraform + Helm)
# Prérequis : docker, kind, kubectl, helm, terraform (+ kubeconform et checkov pour make lint).
# Sous Windows : lancer depuis Git Bash.

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

TF_DIR      := infra/terraform
CHART_DIR   := infra/helm/homi
CLUSTER     ?= homi
NAMESPACE   ?= homi
HOST        ?= homi.localhost
HTTP_PORT   ?= 80
K8S_VERSION ?= 1.34.0

FRONT_IMAGE := homi-frontend
API_IMAGE   := homi-api

export KUBECONFIG := $(CURDIR)/$(TF_DIR)/$(CLUSTER)-config

# Tag dérivé du contenu de l'image : une image reconstruite à l'identique ne
# redéploie rien, une image modifiée est rechargée dans kind et redéployée.
image_tag = $$(docker image inspect -f '{{.Id}}' $(1):local | cut -c8-19)

TF_VARS = -var cluster_name=$(CLUSTER) -var namespace=$(NAMESPACE) \
          -var ingress_host=$(HOST) -var http_port=$(HTTP_PORT)

.PHONY: help build up deploy down test lint smoke logs status

help: ## Affiche cette aide
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  make %-8s %s\n", $$1, $$2}'

build: ## Construit les images Docker du front et de l'API
	docker build -t $(FRONT_IMAGE):local homi_frontend
	docker build -t $(API_IMAGE):local homi_backend

up: build deploy ## Construit les images, crée le cluster kind et déploie Homi

deploy: ## Crée le cluster et déploie les images homi-*:local existantes (Terraform)
	front_tag=$(call image_tag,$(FRONT_IMAGE)); api_tag=$(call image_tag,$(API_IMAGE)); \
	docker tag $(FRONT_IMAGE):local $(FRONT_IMAGE):$$front_tag; \
	docker tag $(API_IMAGE):local $(API_IMAGE):$$api_tag; \
	terraform -chdir=$(TF_DIR) init -input=false; \
	terraform -chdir=$(TF_DIR) apply -auto-approve -input=false $(TF_VARS) \
		-var frontend_image_tag=$$front_tag -var api_image_tag=$$api_tag
	@echo "Front : http://$(HOST)$(if $(filter 80,$(HTTP_PORT)),,:$(HTTP_PORT))/HomiByIsphers/"

down: ## Détruit le cluster et toutes les ressources
	terraform -chdir=$(TF_DIR) destroy -auto-approve -input=false $(TF_VARS) || kind delete cluster --name $(CLUSTER)

test: lint smoke ## Lint de l'infra + smoke test sur le cluster

lint: ## helm lint, kubeconform, terraform fmt/validate, checkov
	helm lint $(CHART_DIR) -f $(CHART_DIR)/values.example.yaml --strict
	helm template homi $(CHART_DIR) -f $(CHART_DIR)/values.example.yaml \
		| kubeconform -strict -summary -kubernetes-version $(K8S_VERSION)
	terraform -chdir=$(TF_DIR) fmt -check -recursive
	terraform -chdir=$(TF_DIR) init -backend=false -input=false > /dev/null
	terraform -chdir=$(TF_DIR) validate
	@if command -v checkov > /dev/null; then \
		checkov --config-file infra/.checkov.yaml -d $(TF_DIR) --framework terraform; \
		checkov --config-file infra/.checkov.yaml -d $(CHART_DIR) --framework helm \
			--var-file $(CHART_DIR)/values.example.yaml; \
	else echo "checkov absent : scan ignoré (pip install checkov)"; fi

smoke: ## Smoke test HTTP via l'ingress (front + API + BDD)
	kubectl -n $(NAMESPACE) wait --for=condition=Ready pod --all --field-selector=status.phase=Running --timeout=300s
	HOST=$(HOST) HTTP_PORT=$(HTTP_PORT) bash infra/scripts/smoke-test.sh

logs: ## Suit les logs de tous les pods Homi
	kubectl -n $(NAMESPACE) logs -l app.kubernetes.io/part-of=homi --all-containers --prefix --tail=50 -f --max-log-requests=10

status: ## État des ressources du namespace
	kubectl -n $(NAMESPACE) get pods,svc,ingress,hpa,pvc,networkpolicy
