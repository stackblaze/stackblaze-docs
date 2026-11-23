# Page plan (from product code on `main`, 2026-11-23)

Derived only from dashboard / kubero-server / CLI code on `main` — never from old docs.
Each page is written by performing it (scripts/capture/flows/<slug>.mjs) and captured on
dashboard-dev. Status: `todo` · `captured` · `blocked: <what is needed>`.

Shorthand: **Canvas** = project → `/pipeline/:p/apps?phase=<env>`. **+Service** = canvas toolbar
"Service" → "Add to <env>". **Sheet** = click a service (tabs "Code", "Deployment", "Agent",
"Variables", "Logs", "Metrics", "Security", "Terminal", "Settings", "Add-ons"). **Settings rail** =
"Schedule", "Source", "Build", "Access", "Domains", "Deploy", "Health", "Network", "Scale",
"Storage", "Scans", "Tracing", "Logs". Canvas changes are staged: "Commit N changes" → "Deploy N changes".

## A. Getting started
| slug | dashboard path | needs | status |
|---|---|---|---|
| quickstart | Projects → "New Project" → Start → "Docker image" → nginx → card → "Deploy" | — | captured |
| concepts | "Create a New Project": "Project Name", "Region", "Environments", "Owning team" | — | todo |
| canvas | "Apps"/"Designer"; "Commit N changes" → "Commit message" → "Deploy N changes" / "Discard all" | — | todo |
| organizations | Org switcher → "Create Organization" (`/workspaces/new`) | — | todo |
| ai-assistant | "Chat assistant" panel (`/?deploy=ai`) | platform AI configured | todo |

## B. Deploy
| slug | dashboard path | needs | status |
|---|---|---|---|
| deploy/github | +Service → "GitHub repository" / "Public git repo" | GitHub link (app install for private) | blocked: GitHub link |
| deploy/docker-image | +Service → "Docker image" → "Container registry" | — | todo |
| deploy/templates | +Service → "Template"; `/new/template/:slug` "Review what gets created" | plan `maxTemplateTier` | todo |
| deploy/cli-local-folder | `stackblaze login` → `stackblaze up [path]` | CLI | todo |
| deploy/import | +Service → "Import" (docker-compose, render.yaml, fly.toml, stackblaze.yaml) | — | todo |
| deploy/deployments | Sheet → "Deployment" → "Redeploy", "Rollback", "Cancel deploy", "Diagnose", "View logs" | an existing deploy | todo |
| deploy/builds | Sheet "Actions" → "Builds"; build-failure analysis | git app; AI analysis: plan `aiFeatures` | todo |
| deploy/autodeploy | Settings rail → "Source" (Repository, Branch, "Enabled") | GitHub App repo | blocked: GitHub link |
| deploy/build-settings | Settings rail → "Build" ("Build method", "Dockerfile", "Build path") | git app | todo |
| deploy/start-and-pre-deploy | Settings rail → "Deploy" ("Build command", "Start command", "Pre-deploy") | — | todo |
| deploy/promote | "Deployment" → "Promote" → "Promote to production?" | two environments | todo |

## C. Configure
| slug | dashboard path | needs | status |
|---|---|---|---|
| config/environment-variables | Sheet → "Variables" (raw .env/JSON, download, random secret) | — | todo |
| config/shared-variables | `/pipeline/:p/settings/variables`; Sheet → Variables → "Shared groups" | — | todo |
| config/custom-domains | Settings rail → "Domains" → "Add Custom Domain" (2 steps) | a domain with DNS access | todo |
| config/visibility | Settings rail → "Access" → "Visibility": "Public", "Internal", "Worker" | Worker: plan `allowWorkers` | todo |
| config/scaling | Settings rail → "Scale" ("Instances", "CPU", "Memory", "Autoscale") | plan caps | todo |
| config/sleep-mode | "Sleep mode" ("Scale down after") | plan `sleepModeAllowed` | todo |
| config/health-checks | Settings rail → "Health" | web service | todo |
| config/volumes | Settings rail → "Storage" → "Volumes" | plan `volumesAllowed` | todo |
| config/volume-file-browser | volume → `/pipeline/:p/:phase/volume/:pvc/files` | flag `fileBrowser` | todo |
| config/scheduled-tasks | +Service → "Add-on" → "Scheduled tasks"; Sheet → "Add-ons" | plan `allowCronJobs` | todo |
| config/environments | Project settings → General → "Environments"; header "Switch Environment" | — | todo |
| config/preview-environments | Project settings → General → "Preview environments" | GitHub repo + PR; plan `previewEnvironments` | blocked: GitHub link |
| config/regions | "Region" in New Project; Settings → General → "Default region for new projects" | — | todo |
| config/networking | Settings rail → "Network" (CORS, IP rules) | plan `advancedNetworking` | todo |
| config/basic-auth | Settings rail → "Network" → "Basic Auth" | plan `basicAuthAllowed` | todo |
| config/app-actions | Sheet "Actions": "Restart", "Pause"/"Resume", "Maintenance", "Clear CDN cache", "Delete" | — | todo |
| config/terminal-ssh | Sheet → "Terminal"; "Console", "Copy SSH command"; Personal settings → "SSH keys" | `consoleEnabled`/`sshEnabled` | todo |
| config/infrastructure-as-code | Project settings → General → "Infrastructure as Code"; CLI apply/plan/export/destroy | flag `iac` | todo |
| config/saved-stacks | Left nav "Saved stacks" (`/templates`), designer | `templatesEnabled` + `iac` | todo |
| config/project-settings | `/pipeline/:p/settings/general`, "Ownership & access" | `pipeline:write` | todo |

## D. Databases and add-ons (+Service → "Database or cache" / "Add-on")
| slug | what | needs | status |
|---|---|---|---|
| databases/overview | instance tabs; connecting apps | — | todo |
| databases/postgresql | "PostgreSQL" | — | todo |
| databases/mariadb | "MariaDB" | — | todo |
| databases/valkey | "Valkey" | persistence: plan `kvPersistent` | todo |
| databases/mongodb | "MongoDB", "Document DB", "FerretDB" | — | todo |
| databases/other | CockroachDB, CouchDB, ScyllaDB, Cassandra, Milvus, OpenSearch | — | todo |
| databases/backups | +Service → "Backups" → "Back up now", "Restore as a new database" | flag `databaseBackups`, plan `dbBackups` | todo |
| databases/high-availability | Settings → "HA" | plan `dbHaAllowed` | todo |
| databases/public-access | Settings → "Access" → "Public access"; CLI `connect` | flag `databasePublicAccess` | todo |
| databases/data-browser | Settings → "Access" (admin console) | — | todo |
| addons/kafka | "Kafka (Strimzi)", connectors | — | todo |
| addons/rabbitmq | "RabbitMQ" | — | todo |
| addons/memcached-proxysql | "Memcached", "ProxySQL" | — | todo |
| addons/email | "Email (SMTP)" | `platformEmail` | todo |
| addons/app-shield | "App Shield (WAF)": "Overview", "Protection", "Rules" | — | todo |

## E. AI
| slug | what | needs | status |
|---|---|---|---|
| ai/models | +Service → "AI model (GPU)" | flag `aiModels`, GPU credit | blocked: GPU credit |
| ai/agents | +Service → "AI agent" → "New AI agent" | flag `aiAgents` + provider key | blocked: provider key |
| ai/agent-channels | widget, API keys, webhooks, schedules, sessions | same | blocked: provider key |
| ai/agent-knowledge-skills | "Knowledge", "Skills", "Integrations" | same | blocked: provider key |
| ai/agent-evals | evals and optimizations | same | blocked: provider key |
| ai/gateway | AI Gateway (LiteLLM) from the agent model picker | Anthropic/OpenAI key | blocked: provider key |

## F. Functions, sandboxes, object storage
| slug | what | needs | status |
|---|---|---|---|
| functions | +Service → "Function" | add-on kind `FunctionGroup` enabled | todo (check on dev) |
| sandboxes | +Service → "Developer sandbox" | flag `sandboxes`, plan `sandboxes` | todo |
| object-storage | +Service → "Object storage" ("Buckets", "Access", "Events") | — | todo |
| volume-snapshots | Sheet "Actions" → "Snapshots" | flag `volumeSnapshots` | todo |

## G. Observability
| slug | what | needs | status |
|---|---|---|---|
| observability/logs | Sheet → "Logs" | — | todo |
| observability/metrics | Sheet → "Metrics" (alert rules) | — | todo |
| observability/tracing | Settings rail → "Tracing" | flag `tracing`, plan `tracingAllowed` | todo |
| observability/log-drains | Settings → "Log drains" | `logsEnabled`, an endpoint | todo |
| observability/notifications | Settings → "Notifications" | a webhook URL | todo |
| observability/security-scans | Settings rail → "Scans"; "Security" tab | plan `securityScans` — verify live (marked retired in code) | todo |

## H. Teams and organization
| slug | what | needs | status |
|---|---|---|---|
| team/members-roles-teams | Settings → "Access control" (Users, Invitations, Teams, Roles) | `user:write`, a 2nd email | todo |
| team/sso | Settings → "SSO & provisioning" | Enterprise + IdP | blocked: IdP |
| team/audit-log | `/audit-log` | — | todo |
| team/account-security | Personal settings → "Authentication" (2FA, passkeys) | — | todo |
| team/api-tokens | Personal settings → "API tokens" | — | todo |
| team/integrations | Settings → "Integrations" (GitHub, Hugging Face) | — | todo |

## I. Billing
| slug | what | needs | status |
|---|---|---|---|
| billing | "Billing", "Usage", spend limit, "Support" | Stripe on dev to change plans | todo |

## J. Reference
CLI groups from `cli/src/cli/register-*.ts` (install-login, deploy, apps, variables, projects,
addons, storage, operate, access, models, functions, sandboxes, waf, app-features, notifications,
account, workspace, iac) — each command's text taken from `stackblaze <cmd> --help` on the
released binary. `mcp` (`stackblaze setup mcp|skills|agent`, `https://mcp.stackblaze.cloud/mcp`).
`api` (Swagger at `/api/docs`, bearer tokens from "API tokens").

## Not documented (no UI, retired or admin-only)
PITR (API only), DB import/transfer (CLI only — document under CLI), Linkerd, Cloudflare Tunnel,
Supabase add-on (template only), redirect-only routes, `/noc` and `/platform/*` (super admin).
Off-by-default kinds (MySQL, Redis, OpenSearch operator, ClickHouse, Functions) only if enabled on prod.
