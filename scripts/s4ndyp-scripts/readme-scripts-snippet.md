# Snippet voor s4ndyp/scripts/readme.md

**Webtool** (subsite-portal, build uit git — [s4ndyp/webtool](https://github.com/s4ndyp/webtool))

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Tabel: `| Webtool | [webtool](https://github.com/s4ndyp/webtool) | http://<ip> (git build, subsite-portal) |`

Update-blok:

```bash
cd /opt/webtool && git pull --ff-only && docker compose build && docker compose up -d
```

Standaard resources: Fileshare / **Webtool**: 2 CPU, 2 GB RAM, 10 GB disk.
