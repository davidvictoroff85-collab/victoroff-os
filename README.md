# Victoroff OS

Governed authority-to-outcome infrastructure for institutional work.

This repository is private and currently contains the first concept landing page. It does not
assert client authority, commission, or production status.

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Verify

```bash
python3 scripts/verify.py
```

## Deploy

```bash
vercel --prod --yes
```

The deployment intentionally emits `noindex, nofollow` until the product and public identity are
approved.
