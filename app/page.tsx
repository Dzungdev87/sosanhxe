import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import SearchBox from "@/components/SearchBox";
import { currentMetricPeriod } from "@/lib/carMetrics";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
const homeTitle = "So Sánh Xe - So sánh 2 xe ô tô chi tiết nhất Việt Nam";
const homeDescription =
  "So sánh xe ô tô theo giá bán, thông số kỹ thuật, kích thước, động cơ, tiêu hao nhiên liệu, tiện nghi, an toàn và bình chọn từ người dùng.";
const ogImageUrl =
  "https://res.cloudinary.com/dfv1e9p8p/image/upload/f_auto,q_auto,c_fill,g_auto,w_1200,h_630/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "So Sánh Xe"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [ogImageUrl]
  }
};

export default async function HomePage() {
  const period = currentMetricPeriod();
  const latestCars = await prisma.car.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: 6
  });
  const topCarMetrics = await prisma.carMonthlyMetric.findMany({
    where: { period },
    include: { car: true }
  });
  const topCars = topCarMetrics
    .map((metric) => ({
      ...metric,
      totalCount: metric.viewCount + metric.compareCount
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      if (b.compareCount !== a.compareCount) return b.compareCount - a.compareCount;
      return b.viewCount - a.viewCount;
    })
    .slice(0, 6);
  const popularComparisons = await prisma.comparisonMonthlyMetric.findMany({
    where: { period },
    include: { carA: true, carB: true },
    orderBy: [{ compareCount: "desc" }, { updatedAt: "desc" }],
    take: 6
  });
  const compareTargets = [...latestCars, ...topCars.map((item) => item.car)];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildHomeJsonLd()) }} />
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-good">Hãy chọn chiếc xe phù hợp nhất với bạn</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
              So sánh 2 xe chi tiết nhất Việt Nam
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Xem bảng so sánh rõ ràng, có đánh dấu thông số tốt hơn và lượt bình chọn của người xem.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-bold text-ink">Top xe được xem và so sánh nhiều nhất</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {topCars.length > 0 ? (
                  topCars.map((metric, index) => (
                    <Link
                      key={metric.id}
                      href={buildCompareHref(metric.car.slug, findCompareTarget(metric.car.id, compareTargets)?.slug)}
                      className="rounded-lg border border-line bg-white p-4 hover:border-good"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-ink">#{index + 1} {metric.car.name}</div>
                        <div className="text-sm font-bold text-good">{new Intl.NumberFormat("vi-VN").format(metric.totalCount)}</div>
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {metric.car.brand} - {metric.car.segment}
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState>Chưa có dữ liệu xem hoặc so sánh trong năm {period}.</EmptyState>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-ink">Xe mới nhất</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {latestCars.map((car) => (
                  <CarLink key={car.id} car={car} compareTarget={findCompareTarget(car.id, compareTargets)} />
                ))}
              </div>
            </section>
          </div>

          <aside>
            <h2 className="mb-4 text-xl font-bold text-ink">Top so sánh 2 xe phổ biến nhất</h2>
            <div className="space-y-3">
              {popularComparisons.length > 0 ? (
                popularComparisons.map((comparison) => (
                  <Link
                    key={comparison.id}
                    href={`/compare/${comparison.carA.slug}-vs-${comparison.carB.slug}`}
                    className="block rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-good"
                  >
                    <div>{comparison.carA.name} vs {comparison.carB.name}</div>
                    <div className="mt-1 text-xs font-normal text-muted">
                      {new Intl.NumberFormat("vi-VN").format(comparison.compareCount)} lượt so sánh
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState>Chưa có cặp so sánh phổ biến trong năm {period}.</EmptyState>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function buildHomeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "So Sánh Xe",
      url: siteUrl,
      inLanguage: "vi-VN",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/compare?query={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "So Sánh Xe",
      url: siteUrl,
      logo: "https://res.cloudinary.com/dfv1e9p8p/image/upload/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg"
    }
  ];
}

type CarSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  segment: string;
  seats?: number;
};

function CarLink({ car, compareTarget }: { car: CarSummary; compareTarget?: CarSummary }) {
  return (
    <Link href={buildCompareHref(car.slug, compareTarget?.slug)} className="rounded-lg border border-line bg-white p-4 hover:border-good">
      <div className="text-sm font-semibold text-ink">{car.name}</div>
      <div className="mt-1 text-sm text-muted">
        {car.brand} - {car.segment}
        {car.seats ? ` - ${car.seats} chỗ` : ""}
      </div>
    </Link>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-4 text-sm text-muted sm:col-span-2">
      {children}
    </div>
  );
}

function findCompareTarget(carId: string, cars: CarSummary[]) {
  return cars.find((item) => item.id !== carId);
}

function buildCompareHref(slug: string, targetSlug?: string) {
  return targetSlug ? `/compare/${slug}-vs-${targetSlug}` : "/compare";
}
