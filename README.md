# Michael Levin Archive Guide

A static, Hebrew RTL editorial guide for the Michael Levin documentary archive package.

## Architecture

- **GitHub Pages:** navigation and editorial context only.
- **Google Drive:** the shared production package.
- **Original sources:** viewing, clearance and licensing destinations.
- **No copied rights-unclear media** is stored in this repository.

## Refreshing the catalog

1. Replace `source/catalog.csv` with the verified production catalog.
2. Refresh `source/drive-index.json` from the durable Drive manifest.
3. Run `python tools/generate_data.py`.
4. Run `npm test` and visually inspect the site before publishing.

## Local preview

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/`.

The public page is deliberately marked `noindex,nofollow,noarchive`. It is a link-access production guide, not a broadcast-clearance statement.
