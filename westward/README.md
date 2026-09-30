# WESTWARD

Premium western-inspired menswear storefront built in React 19, TypeScript, Vinext and Cloudflare D1 (SQLite SQL).

## Implemented
- Responsive storefront, catalog search/category filters/sorting, product pages and quick shop.
- Accessible size selection, size guide, wishlists and shopping bag with quantity/removal controls.
- SQL-backed products, bags, wishlists and demo orders; server-side account ownership.
- ChatGPT sign-in, account history, order review and idempotent demo checkout with authoritative server totals.
- Keyboard-accessible Radix/Shadcn dialogs, sheets, selects, radio groups and tables.
- Local catalog photographs and custom favicon. Sources in PHOTO-SOURCES.md.
- WebMCP catalog filtering on home and shop routes, feature-detected.

## Preview and checks
Install with `npm run install:ci`, then use `npm run dev`.
Generate migrations with `npm run db:generate`. Sites owns the hosted D1 resource; schema is in db/schema.ts and the migration is in drizzle/.
After a build, apply the migration locally using the starter README's Wrangler instructions (the initial migration must only be applied once).
Run `node scripts/check-store.mjs` against the local preview to verify authentication, persistence, validation, pricing, idempotent checkout and order privacy. This creates a local sample order.
TypeScript validation: `node node_modules/typescript/bin/tsc --noEmit`.

## Commercial launch requirements
This is a working private demonstration storefront, not a live merchant payment system. Checkout explicitly saves demo orders; it does not charge or fulfill them. No payment credentials or card data are collected.
Before commercial launch: replace sample products/photos/prices/material descriptions and draft shipping/return terms with approved brand content; connect a payment provider with signed webhook verification; implement authoritative variant inventory and fulfillment; configure support contact and transactional email; add an owner-authorized product/order management workflow; review applicable tax/privacy/legal requirements and production monitoring. No admin identity has been assumed or exposed.
Current currency and delivery market: INR / India. Guest browsing works; durable bags and orders require platform sign-in. Site access remains private.

## Expanded collection

The sample catalog contains 100 products: 20 each in Shirts, Essentials, Denim, Outerwear and Footwear. Existing product URLs are preserved. New product definitions are in lib/catalog-expanded.json; all definitions synchronize idempotently to SQL on catalog access. Customer bags, wishlists and order history are preserved. Category counts, 20-item collection pages and homepage links expose the full catalog. Collection photos are illustrative and are reused across some related sample styles.
