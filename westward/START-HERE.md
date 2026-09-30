# WESTWARD complete project

This archive contains the full WESTWARD React/Vinext storefront source, Cloudflare D1/SQLite schema, 100-product sample catalog, local images, and verification scripts.

## Run locally

1. Install Node.js 20+.
2. Run `npm run install:ci`.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

## Verify

- `node node_modules/typescript/bin/tsc --noEmit`
- `node scripts/check-catalog.mjs`
- `node scripts/check-store.mjs`

The storefront is a private demo. Checkout creates demo orders and does not charge or fulfill real purchases. See `README.md` for the D1 setup and commercial launch requirements.
