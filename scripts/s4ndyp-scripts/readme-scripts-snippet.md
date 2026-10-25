# Snippet voor s4ndyp/scripts/readme.md

**Webtool** (subsite-portal, GHCR — [s4ndyp/webtool](https://github.com/s4ndyp/webtool))

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Tabel: `| Webtool | [webtool](https://github.com/s4ndyp/webtool) | http://<ip> (GHCR pull) |`

Update:

```bash
cd /opt/webtool && docker compose pull && docker compose up -d
```

Resources: **1 CPU, 1 GB RAM, 8 GB disk** (geen build in LXC). Optioneel `GHCR_TOKEN` als het package niet public is.
