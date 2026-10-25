<!-- Copy-paste this section into https://github.com/s4ndyp/webtool/blob/main/readme.md (Deploy op Proxmox). -->

## Deploy op Proxmox (LXC + Docker)

Gebruik het **Xdio**-installatiescript in [s4ndyp/scripts](https://github.com/s4ndyp/scripts) (zelfde stijl als Fileshare: `community-scripts/core`, statisch netwerk, geen GHCR — deze repo wordt in de container gekloond en met `docker compose build` gebouwd).

Op de **Proxmox host** als root:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Standaard resources: **2 CPU**, **2 GB RAM**, **10 GB disk**. De app luistert in de LXC op **poort 80** (`http://<container-ip>`).

**Update** in de container: `update`, of handmatig:

```bash
cd /opt/webtool && git pull --ff-only && docker compose build && docker compose up -d
```

Optioneel andere fork/branch in de LXC (tijdens install): `WEBTOOL_REPO_URL`, `WEBTOOL_BRANCH`.

Geen ingebouwde login — alleen vertrouwd netwerk of reverse proxy met toegangsbeheer.
