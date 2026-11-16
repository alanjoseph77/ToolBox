# Share tools: setup

The **Share** section has two tools.

## Send Files with a Code (`/send-files`)
Works out of the box. Files go directly between the two devices (WebRTC). A free public PeerJS matchmaker introduces the devices using the 6-digit code.
Optional environment variables (Vercel → Settings → Environment Variables), for better reliability:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PEER_HOST`, `NEXT_PUBLIC_PEER_PORT`, `NEXT_PUBLIC_PEER_PATH`, `NEXT_PUBLIC_PEER_SECURE` | Use your own PeerJS server instead of the free public one |
| `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USER`, `NEXT_PUBLIC_TURN_PASS` | A TURN relay, so phones on strict mobile networks can still connect |

## Code Share (`/code-share`)
Needs a small database, because the other person opens the text later. Without one, the tool shows "not switched on yet".

1. Vercel → your project → **Storage** → **Create** → **Upstash Redis** (free plan is enough) → connect it to the project.
2. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`). Either pair works.
3. Redeploy.

Pads are deleted automatically after 1 hour, 1 day or 7 days. With a password, the text is encrypted in the browser (AES-GCM) before it is stored.

## Shop Product QR Code (`/product-qr`, pages at `/p/<id>`)
Uses the same database as Code Share (no extra setup). Each product page is stored for a year and renewed on every edit. Without the database keys the tool still works in a reduced "packed" mode: the details travel inside the QR code itself, with no photo.
Templates: `/product-qr/templates` shows 9 shop designs (colours, poster layout, QR style, sample text); the tool applies one with `/product-qr?template=<id>`. Add or change templates in `lib/productTemplates.ts`, colours in `lib/productThemes.ts`.
Product pages are `noindex` and `/p/` is disallowed in `robots.txt`.

## Local testing
Without the database keys, `npm run dev` keeps pads in server memory (lost on restart). In production, memory is not used.
