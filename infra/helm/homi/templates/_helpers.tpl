{{- define "homi.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "homi.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "homi.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
app.kubernetes.io/name: {{ include "homi.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: homi
{{- end }}

{{/* Sélecteur d'un composant : include "homi.selectorLabels" (dict "ctx" . "component" "api") */}}
{{- define "homi.selectorLabels" -}}
app.kubernetes.io/name: {{ include "homi.name" .ctx }}
app.kubernetes.io/instance: {{ .ctx.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{- define "homi.apiSecretName" -}}
{{- default (printf "%s-api" (include "homi.fullname" .)) .Values.api.existingSecret }}
{{- end }}

{{- define "homi.postgresSecretName" -}}
{{- default (printf "%s-postgresql" (include "homi.fullname" .)) .Values.postgresql.auth.existingSecret }}
{{- end }}

{{- define "homi.postgresHost" -}}
{{- printf "%s-postgresql" (include "homi.fullname" .) }}
{{- end }}

{{/* Variables d'environnement communes à l'API et au Job de migration */}}
{{- define "homi.apiEnv" -}}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "homi.postgresSecretName" . }}
      key: POSTGRES_PASSWORD
- name: DATABASE_URL
  value: {{ printf "postgresql://%s:$(POSTGRES_PASSWORD)@%s:5432/%s?serverVersion=16&charset=utf8" .Values.postgresql.auth.username (include "homi.postgresHost" .) .Values.postgresql.auth.database | quote }}
{{- end }}

{{/* Contexte de sécurité de l'API : l'image officielle tourne en root (supervisord
     lance nginx + php-fpm qui basculent ensuite sur www-data), on retire donc
     toutes les capabilities sauf celles nécessaires au changement d'utilisateur. */}}
{{- define "homi.apiSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: [ALL]
  add: [CHOWN, DAC_OVERRIDE, FOWNER, SETUID, SETGID]
seccompProfile:
  type: RuntimeDefault
{{- end }}
