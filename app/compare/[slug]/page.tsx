import type { Metadata } from "next";
import type { Car } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import CarImage from "@/components/CarImage";
import CommentsSection from "@/components/CommentsSection";
import CompareTable from "@/components/CompareTable";
import VoteButtons from "@/components/VoteButtons";
import { publicCommentSelect } from "@/lib/comments";
import { prisma } from "@/lib/db";
import { compareField } from "@/lib/compareEngine";
import { recordCarComparison } from "@/lib/carMetrics";
import { getVoteTotals } from "@/lib/votes";
import { parseCompareSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const ogImageUrl =
  "https://res.cloudinary.com/dfv1e9p8p/image/upload/f_auto,q_auto,c_fill,g_auto,w_1200,h_630/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getCars(slug: string) {
  const parsed = parseCompareSlug(slug);
  if (!parsed) {
    return null;
  }

  const cars = await prisma.car.findMany({
    where: {
      slug: {
        in: [parsed.car1, parsed.car2]
      }
    }
  });

  const carA = cars.find((car) => car.slug === parsed.car1);
  const carB = cars.find((car) => car.slug === parsed.car2);

  if (!carA || !carB || carA.id === carB.id) {
    return null;
  }

  return { carA, carB };
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCars(slug);

  if (!data) {
    return {
      title: "Không tìm thấy so sánh",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const title = `${data.carA.name} vs ${data.carB.name} - So sánh chi tiết`;
  const description = `So sánh ${data.carA.name} và ${data.carB.name} theo giá bán, động cơ, hộp số, kích thước, tiện nghi, hỗ trợ vận hành và công nghệ an toàn.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/compare/${slug}`
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/compare/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${data.carA.name} vs ${data.carB.name}`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl]
    }
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCars(slug);

  if (!data) {
    notFound();
  }

  const { carA, carB } = data;
  await recordCarComparison(carA.id, carB.id);
  const votes = await getVoteTotals(carA.id, carB.id);
  const comments = await prisma.comment.findMany({
    where: {
      targetType: "comparison",
      targetId: slug,
      status: "APPROVED"
    },
    orderBy: { createdAt: "desc" },
    select: publicCommentSelect()
  });
  const relatedCars = await prisma.car.findMany({
    where: {
      id: { notIn: [carA.id, carB.id] },
      OR: [{ brand: { in: [carA.brand, carB.brand] } }, { segment: { in: [carA.segment, carB.segment] } }]
    },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    take: 8
  });
  const strengths = buildSummary(carA, carB);
  const canonicalUrl = `${siteUrl()}/compare/${slug}`;
  const jsonLd = buildJsonLd(carA, carB, slug, canonicalUrl);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <Link href="/compare" className="hover:text-ink">
          So sánh
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">
          {carA.name} vs {carB.name}
        </span>
      </nav>

      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-good">So sánh xe</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {carA.name} vs {carB.name}
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          Bảng so sánh chi tiết theo giá bán, động cơ/hộp số, kích thước/trọng lượng, treo/phanh, ngoại thất, nội thất, hỗ trợ vận hành và an toàn.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        {[carA, carB].map((car) => (
          <div key={car.id} className="overflow-hidden rounded-lg border border-line bg-white">
            <CarImage imageKey={car.imageKey} alt={car.name} width={400} height={300} priority sizes="400px" className="mx-auto" />
            <div className="p-5">
              <div className="text-sm font-semibold text-muted">{car.brand}</div>
              <h2 className="mt-1 text-2xl font-bold text-ink">{car.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Giá" value={`${new Intl.NumberFormat("vi-VN").format(car.price)} VND`} />
                <Stat label="Công suất" value={`${car.engineHp} mã lực`} />
                <Stat label="Tiêu hao" value={`${car.fuelConsumption} lít/100 km`} />
                <Stat label="Phân khúc" value={car.segment} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-lg border border-line bg-white p-5">
        <h2 className="text-xl font-bold text-ink">Xe nào phù hợp hơn với bạn?</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{strengths}</p>
      </section>

      <CompareTable carA={carA} carB={carB} />

      <section className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="text-xl font-bold text-ink">So sánh liên quan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {relatedCars.map((car) => (
            <Link key={car.id} href={`/compare/${carA.slug}-vs-${car.slug}`} className="rounded-md border border-line p-3 text-sm font-semibold hover:border-good">
              {carA.name} vs {car.name}
            </Link>
          ))}
          {relatedCars.map((car) => (
            <Link key={`${car.id}-${carB.id}`} href={`/compare/${car.slug}-vs-${carB.slug}`} className="rounded-md border border-line p-3 text-sm font-semibold hover:border-good">
              {car.name} vs {carB.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <VoteButtons carAId={carA.id} carBId={carB.id} carAName={carA.name} carBName={carB.name} initialVotes={votes} />
      </div>

      <div className="mt-6">
        <CommentsSection
          targetId={slug}
          initialComments={comments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt.toISOString()
          }))}
        />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface p-3">
      <div className="text-xs font-semibold uppercase text-muted">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function buildSummary(carA: Car, carB: Car) {
  const power = compareField(carA.engineHp, carB.engineHp, "higher");
  const price = compareField(carA.price, carB.price, "lower");
  const fuel = compareField(carA.fuelConsumption, carB.fuelConsumption, "lower");
  const space = compareField(carA.wheelbase, carB.wheelbase, "higher");
  const notes: string[] = [];

  if (price.aBetter) notes.push(`${carA.name} có lợi thế về chi phí nhờ giá tham khảo thấp hơn`);
  if (price.bBetter) notes.push(`${carB.name} có lợi thế về chi phí nhờ giá tham khảo thấp hơn`);
  if (power.aBetter) notes.push(`${carA.name} có công suất cao hơn`);
  if (power.bBetter) notes.push(`${carB.name} có công suất cao hơn`);
  if (fuel.aBetter) notes.push(`${carA.name} tiết kiệm nhiên liệu hơn`);
  if (fuel.bBetter) notes.push(`${carB.name} tiết kiệm nhiên liệu hơn`);
  if (space.aBetter) notes.push(`${carA.name} có chiều dài cơ sở lớn hơn`);
  if (space.bBetter) notes.push(`${carB.name} có chiều dài cơ sở lớn hơn`);

  return `${notes.slice(0, 4).join(". ")}. Hãy xem các ô được tô nổi bật trong bảng dưới để đối chiếu với nhu cầu sử dụng của bạn.`;
}

function buildJsonLd(carA: Car, carB: Car, slug: string, canonicalUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteUrl() },
        { "@type": "ListItem", position: 2, name: "So sánh xe", item: `${siteUrl()}/compare` },
        { "@type": "ListItem", position: 3, name: `${carA.name} vs ${carB.name}`, item: canonicalUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: `${carA.name} vs ${carB.name} - So sánh chi tiết`,
      description: `Bảng so sánh ${carA.name} và ${carB.name}.`,
      inLanguage: "vi-VN",
      mainEntity: {
        "@type": "ItemList",
        name: `So sánh ${carA.name} và ${carB.name}`,
        itemListElement: [carJsonLd(carA, 1), carJsonLd(carB, 2)]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "So Sánh Xe",
      url: siteUrl(),
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl()}/compare?query={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ];
}

function carJsonLd(car: Car, position: number) {
  return {
    "@type": "ListItem",
    position,
    item: {
      "@type": "Car",
      name: car.name,
      brand: {
        "@type": "Brand",
        name: car.brand
      },
      bodyType: car.segment,
      seatingCapacity: car.seats,
      vehicleEngine: {
        "@type": "EngineSpecification",
        enginePower: `${car.engineHp} hp`,
        torque: `${car.torque} Nm`
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "VND",
        price: Number(car.price),
        availability: "https://schema.org/InStock"
      }
    }
  };
}
