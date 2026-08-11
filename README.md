# Michael Levin Archive Guide

A static, Hebrew RTL **archive-materials guide for an editor**. It is not an edit script and does not catalog production interviews.

## Architecture and rights boundary

- **GitHub Pages:** navigation, editorial context and rights-safe previews.
- **Google Drive:** the shared production handoff package.
- **Original sources:** viewing, clearance and licensing destinations.
- **Inline previews:** official YouTube/Facebook/Archive.org players and openly licensed Wikimedia Commons stills only.
- Rights-unclear Getty, Flickr, Alamy, family and publisher imagery is not copied or hotlinked into this public repository.
- A preview or public player is not broadcast clearance.

## Refreshing the catalog

The canonical human-auditable catalog is:

`C:/Users/dtami/Projects/Michael-Levin-Archive/00_מדריך_וקטלוג/קטלוג_ארכיון_מייקל_לוין.csv`

The durable Drive mapping is:

`C:/Users/dtami/Projects/Michael-Levin-Archive/99_מקור_ומניפסט/drive_upload_manifest.json`

1. Generate the base `data/archive.json` with `tools/generate_data.py`, passing the canonical catalog and a sanitized Drive index when the local defaults are not present.
2. Run `npm run enrich` to add editor-facing context and reproducible preview metadata.
3. Run `npm test` and visually inspect desktop and mobile layouts.
4. Publish only after the item count, rights ledger and live JSON comparison pass.

For a metadata-only update to the committed 72-item dataset:

```bash
npm run check
```

## Local preview

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/`.

The public page is deliberately marked `noindex,nofollow,noarchive`. It is still public and is not a broadcast-clearance statement.
