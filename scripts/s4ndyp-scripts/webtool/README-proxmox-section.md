<!-- Copy-paste into s4ndyp/webtool readme (Deploy op Proxmox). -->

## Deploy op Proxmox (LXC + Docker)

**Xdio**-script in [s4ndyp/scripts](https://github.com/s4ndyp/scripts): GHCR-image `ghcr.io/s4ndyp/webtool:latest` (gebouwd via GitHub Actions), geen build in de LXC.

Op de **Proxmox host** als root:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Standaard: **1 CPU**, **1 GB RAM**, **8 GB disk**. Poort **80** in de LXC (`http://<container-ip>`).

Private package: `GHCR_TOKEN` (+ optioneel `GHCR_USERNAME`) op de host vóór install.

**Update** in de container: `update`, of:

```bash
cd /opt/webtool && curl -fsSL -O https://raw.githubusercontent.com/s4ndyp/webtool/main/docker-compose.yml && docker compose pull && docker compose up -d
```

Optioneel: `WEBTOOL_COMPOSE_URL` (andere branch/fork compose).
