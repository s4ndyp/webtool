# Proxmox-scripts (Xdio) voor Webtool

Deze map spiegelt wat in [s4ndyp/scripts](https://github.com/s4ndyp/scripts) hoort (`webtool/`, `install/`, `ct/`). Na merge in **scripts** op `main` werkt:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/s4ndyp/scripts/main/webtool/webtool.sh)"
```

Tot die tijd vanaf **deze repo** (zelfde bestanden, andere base-URL):

```bash
export COMMUNITY_SCRIPTS_URL="https://raw.githubusercontent.com/s4ndyp/webtool/main/scripts/s4ndyp-scripts"
bash -c "$(curl -fsSL ${COMMUNITY_SCRIPTS_URL}/webtool/webtool.sh)"
```

Voeg in `s4ndyp/scripts` ook de regels uit [readme-scripts-snippet.md](./readme-scripts-snippet.md) toe.
