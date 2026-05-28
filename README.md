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

2. Create `.env` from `.env.example` and fill your Supabase PostgreSQL and Cloudinary values:

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
name,image_key,brand,segment,engine_hp,torque,fuel_consumption,price,seats,ground_clearance,length,width,height,wheelbase
```

`image_key` is optional. Store car images in Cloudinary under `NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER` and use a file key such as `byd-seal.jpg`; the frontend renders it through a Cloudinary 800x600 transform.

Rows are validated and upserted by generated slug.

## Car Images

Download Toyota V-Car images from VnExpress into `D:\1. Pictures\1SosanhCar`:

```bash
npm run images:crawl:toyota
```

Upload the downloaded images to Cloudinary with public IDs under `NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER`:

```bash
npm run images:upload:toyota
```

Cloudinary upload mode requires these `.env` values:

```text
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER=cars
```

The script writes `manifest.json` and `image-keys.csv` next to the downloaded images. Use `image_key` values from that CSV in car data.

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
