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

## Docker (build from git, zoals [fileshare](https://github.com/s4ndyp/fileshare))

```bash
cp .env.example .env   # optioneel poort aanpassen
docker compose up -d --build
```

Update na `git pull`:

```bash
docker compose build && docker compose up -d
```

Data (PocketBase database + uploads) staat in het volume `webtool_data` (`/data/pb` in de container).

## Omgevingsvariabelen

| Variabele         | Default                 | Beschrijving                          |
|-------------------|-------------------------|---------------------------------------|
| `PORT`            | `3000`                  | Poort van het portal in de container  |
| `WEBTOOL_PORT`    | `3000`                  | Host-poort in docker-compose          |
| `POCKETBASE_URL`  | `http://127.0.0.1:8090` | Interne PocketBase-URL voor Node    |
| `PB_DATA_DIR`     | `/data/pb`              | PocketBase `--dir` (Docker volume)    |

## Beveiliging

Geen ingebouwde authenticatie. Gebruik alleen op een vertrouwd netwerk, VPN of achter een reverse proxy met toegangsbeheer.
