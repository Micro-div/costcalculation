# CostCalc

CostCalc is a project cost estimator. You describe a project in plain language,
the app extracts the requirements, and a deterministic pricing engine turns them
into a localised cost range, scope, timeline and an editable quotation that can
be shared or exported as a PDF.

The important constraint: **the AI never invents prices**. The model only
extracts structured requirements (project kind, scope, quantities, features and
a location hint). Every number is produced by rate tables in this repository.

## Stack

- Next.js 15 (App Router, React 19 Server Components)
- TypeScript, Tailwind CSS
- Groq for requirement extraction (`GROQ_API_KEY` is required for estimate
  generation; `/api/analyze` returns HTTP 503 when it is missing)
- Upstash Redis / Vercel KV for rate limiting and share links when configured,
  with an in-memory fallback for local development
- Vitest for unit tests

## How pricing works

`lib/pricing.ts` holds the rule engine:

1. Base cards for software/service projects, plus feature add-on rates.
2. Per-unit cards for physical work (construction, fit-out, farms, roads,
   warehouses, venues and similar), priced per acre, room, floor, unit, animal,
   square metre or kilometre.
3. Multipliers for project size, quality and location, followed by contingency
   and tax at rates defined in `constants/index.ts`.

`lib/index.ts` (`calculateEstimate`) is the single entry point used by the UI.
`matchLocation`, `detectLocation` and the confidence score also come from the
rule engine; confidence reflects how complete the provided requirements are,
not a model's opinion.

All pricing, exchange and tax rates live in one place and carry a
`lastPricingUpdate` date (`PRICING_META` in `constants/index.ts`), which is
shown on every estimate and quotation.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Create `.env.local` for local development (see `app/api/health` for the
runtime configuration check):

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes for estimates | Groq API key. Without it, `POST /api/analyze` returns HTTP 503. |
| `UPSTASH_REDIS_REST_URL` | Recommended in production | Upstash Redis REST URL for shared rate limiting and durable share links. |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended in production | Upstash Redis REST token. Keep it secret. |

`GET /api/health` reports configuration and the pricing update date without
calling any external service. Its `checks.sharedStorageConfigured` value is
`true` only when both Upstash variables are configured.

### Upstash setup

1. Create a Redis database in Upstash and copy its REST URL and REST token.
2. Add both values to `.env.local` for local testing.
3. Add both environment variables to the hosting provider's production
   environment settings, then redeploy.
4. Check `/api/health`; `checks.sharedStorageConfigured` should be `true`.

Without Upstash, the app uses process-local in-memory storage. This is suitable
for local development only; shared rate limits and share links are not reliable
across production serverless instances.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint via `next lint`. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/analyze` | `phase: "prepare"` extracts requirements; `phase: "estimate"` returns a server-calculated estimate with prices. Both phases require Groq and return HTTP 503 if `GROQ_API_KEY` is missing. |
| `POST /api/chat` | Chat about a project. Client text is sent as data, never as system instructions. |
| `POST /api/share` | Store a computed estimate and return a share id. |
| `GET /api/share/[id]` | Load the exact stored estimate for a share id. |
| `GET /api/health` | Configuration/pricing status. |

Share links only carry `?estimate=<id>`. The estimate itself is loaded from the
server, so a shared page shows the same totals that were shared. Ids are
validated (`^[A-Za-z0-9_-]{8,64}$`) and expire after 30 days.

## Project layout

```
app/                 Routes, API handlers, error boundary, global styles
components/home/     Estimator, results, quotation/share entry points and
                     the interactive home experience
components/          Chat, layout, modals and shared UI
constants/           Categories, locations, rate tables and pricing metadata
lib/                 Rule engine, validation, Groq client, rate limiting,
                     estimate storage and shared hooks
types/               Shared TypeScript types
tests/               Vitest unit tests
```

## Limitations

- Estimates are preliminary market ranges, not binding quotations. Physical
  work may need an on-site inspection before a final price.
- Rate tables are static and maintained by hand; refresh them and update
  `PRICING_META.lastPricingUpdate` when rates change.
- The in-memory share/rate-limit fallback is intended for local development,
  not production serverless deployments.
