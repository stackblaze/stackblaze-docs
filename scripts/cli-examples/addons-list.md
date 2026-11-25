The add-on types you can attach to an app (the `kind` is what `addons add --kind` takes):

```sh
stackblaze addons list -p github-demo-gv35 -e dev -a nginx
```

```text
Memcached  kind=Memcached
ProxySQL  kind=ProxySQL
Cloudflare Tunnel  kind=Tunnel
PostgreSQL (CloudNativePG)  kind=Cluster
MariaDB  kind=MariaDB
Valkey  kind=Valkey
Kafka (Strimzi)  kind=Kafka
OpenSearch  kind=OpenSearchCluster
FerretDB  kind=FerretDB
MongoDB  kind=MongoDB
MySQL  kind=MySQL
S3 bucket  kind=Tenant
ClickHouse  kind=ClickHouseInstallation
RabbitMQ  kind=RabbitmqCluster
Scheduled tasks  kind=ScheduledTasks
Email  kind=Smtp
Linkerd  kind=Linkerd
```

With `--attached`, the add-ons this app already uses, with their instance names:

```sh
stackblaze addons list -p github-demo-gv35 -e dev -a nginx --attached
```

```text
OK github-demo-gv35/dev/nginx-9agm
email  kind=Smtp  phase=running  Canvas-level add-on — no operator resource
scheduled-tasks-31d7  kind=ScheduledTasks  phase=running
memcached-o440  kind=Memcached  phase=running
```
