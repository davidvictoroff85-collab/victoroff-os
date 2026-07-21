# Victoroff OS

Governed authority-to-outcome infrastructure for institutional work.

This repository is private and currently contains the first concept landing page. It does not
assert client authority, commission, or production status.

**Live concept:** <https://victoroff-os.vercel.app>

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

## Current receipts

- Initial page source: `799ca7f` on `organvm/victoroff-os` `main`
- Production: Vercel deployment `dpl_9MT8gN1UWCjC9eq793F8izLi8aw5` (`READY`)
- Access: `Victoroff OS Admins` has repository-admin permission; the requested email invite is
  held at [issue #1](https://github.com/organvm/victoroff-os/issues/1) because the paid plan is at
  2 of 2 seats.
- Delivery automation: CLI deployment is verified; private-repo Git integration is owned by
  [issue #2](https://github.com/organvm/victoroff-os/issues/2).
