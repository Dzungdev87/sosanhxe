# CarCompare

Production-ready Next.js App Router MVP for SEO-friendly car comparisons, backed by Supabase PostgreSQL through Prisma.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma with Supabase PostgreSQL
- API routes for compare, CSV import, votes, and autocomplete
- SSR compare pages with dynamic metadata and JSON-LD

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill your Supabase PostgreSQL URLs:

```bash
cp .env.example .env
```

3. Push schema and seed sample data:

```bash
npm run db:push
npm run db:seed
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## CSV Import

Upload a CSV with multipart field name `file`:

```bash
curl -X POST http://localhost:3000/api/import \
  -F "file=@scripts/sample-cars.csv"
```

Required CSV headers:

```text
name,brand,segment,engine_hp,torque,fuel_consumption,price,seats,ground_clearance,length,width,height,wheelbase
```

Rows are validated and upserted by generated slug.

## Example Routes

- `/`
- `/cars`
- `/compare`
- `/compare/toyota-vios-vs-honda-city`
- `/api/compare?carA=toyota-vios&carB=honda-city`

## Database Notes

The Prisma schema maps to the required tables:

- `cars`
- `votes`

The `cars` model includes the requested fields plus `slug`, `safety`, and timestamps for routing, SEO, and import updates. Votes are unique per IP hash and normalized car pair.
