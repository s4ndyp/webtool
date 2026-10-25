# Webtool (subsite-portal)

Donker-themed startpagina om **subsites** te publiceren: upload een map met je static site, kies een naam en optioneel een tegel-icoon. Bestanden en metadata staan in **PocketBase** (collecties via `pocketbase/pb_migrations/`). Geen login in de UI; PocketBase-collecties zijn publiek leesbaar/schrijfbaar (alleen geschikt op een vertrouwd netwerk).

## Functies

- Tegels op de hoofdpagina; klik opent `/s/<slug>/`
- Map-upload (inclusief submappen) via de browser
- Optioneel icoon per tegel
- PocketBase-migraties voor `subsites` en `site_files`

## Lokaal draaien (zonder Docker)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Open [http://localhost:3000](http://localhost:3000). PocketBase draait lokaal op poort 8090; de browser praat via de proxy op `/api`.

## Docker (GHCR, zoals [TrackNote](https://github.com/s4ndyp/tracknote))

De image wordt op **GitHub Actions** gebouwd en gepusht naar `ghcr.io/s4ndyp/webtool:latest` (workflow: `.github/workflows/build.yml` bij push naar `main` / `beta`).

```bash
cp .env.example .env   # optioneel poort aanpassen
docker compose pull
docker compose up -d
```

Update:

```bash
docker compose pull && docker compose up -d
```

**Lokaal bouwen** (zonder GHCR):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Data (PocketBase database + uploads) staat in het volume `webtool_data` (`/data/pb` in de container).

Maak het GHCR-package **public** onder GitHub → Packages, of log in met `docker login ghcr.io` voordat je pullt.

## Deploy op Proxmox (LXC + Docker)

Uitrol via **[s4ndyp/scripts](https://github.com/s4ndyp/scripts)** (Xdio): download `docker-compose.yml` van GitHub, **pull** van GHCR — geen build in de LXC.

Op de **Proxmox host** als root:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Tijdelijk vanuit deze repo (tot merge in scripts):

```bash
export COMMUNITY_SCRIPTS_URL="https://raw.githubusercontent.com/s4ndyp/webtool/main/scripts/s4ndyp-scripts"
bash -c "$(curl -fsSL ${COMMUNITY_SCRIPTS_URL}/webtool/webtool.sh)"
```

Standaard: **1 CPU**, **1 GB RAM**, **8 GB disk**; poort **80** (`http://<IP>/`).

**Update** in de container: `update`, of:

```bash
cd /opt/webtool && docker compose pull && docker compose up -d
```

Optioneel: `WEBTOOL_COMPOSE_URL`, `GHCR_TOKEN`. Zie [scripts/s4ndyp-scripts/webtool/README-proxmox-section.md](scripts/s4ndyp-scripts/webtool/README-proxmox-section.md).

## Omgevingsvariabelen

| Variabele         | Default                 | Beschrijving                          |
|-------------------|-------------------------|---------------------------------------|
| `PORT`            | `3000`                  | Poort van het portal in de container  |
| `WEBTOOL_PORT`    | `3000`                  | Host-poort in docker-compose          |
| `POCKETBASE_URL`  | `http://127.0.0.1:8090` | Interne PocketBase-URL voor Node    |
| `PB_DATA_DIR`     | `/data/pb`              | PocketBase `--dir` (Docker volume)    |

## Beveiliging

Geen ingebouwde authenticatie. Gebruik alleen op een vertrouwd netwerk, VPN of achter een reverse proxy met toegangsbeheer.
