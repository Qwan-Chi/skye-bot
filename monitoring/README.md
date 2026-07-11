# Monitoring

This stack keeps alerts local and sends observability data to Grafana Cloud:

- Uptime Kuma monitors the Skye container and `http://host.docker.internal:3001/healthz`.
- Grafana Alloy forwards Skye Docker logs, Docker metrics, and Skye process metrics.

## Start

Start Uptime Kuma:

```sh
docker compose up -d
```

Open Uptime Kuma through an SSH tunnel:

```sh
ssh -L 3002:127.0.0.1:3002 vilnius
```

Then visit `http://localhost:3002`, create the initial administrator account, and add:

- a Docker Container monitor for `skye-bot`;
- an HTTP(s) monitor for `http://host.docker.internal:3001/healthz`;
- a Telegram notification channel.

When Grafana Cloud values are ready, copy `.env.example` to `.env`, add the values,
then start Alloy:

```sh
docker compose --profile grafana up -d alloy
```

The Grafana credentials stay in `monitoring/.env`, which must not be committed.
