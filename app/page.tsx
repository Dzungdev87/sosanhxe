import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import SearchBox from "@/components/SearchBox";
import { currentMetricPeriod } from "@/lib/carMetrics";
import { prisma } from "@/lib/db";
import { buildPostImageUrl } from "@/lib/postImages";

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

  // Dùng Promise.allSettled để không crash khi bất kỳ query nào lỗi
  const [carsResult, metricsResult, comparisonsResult, postsResult] = await Promise.allSettled([
    prisma.car.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 6,
    }),
    prisma.carMonthlyMetric.findMany({
      where: { period },
      include: { car: true },
    }),
    prisma.comparisonMonthlyMetric.findMany({
      where: { period },
      include: { carA: true, carB: true },
      orderBy: [{ compareCount: "desc" }, { updatedAt: "desc" }],
      take: 6,
    }),
    prisma.post
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: { id: true, title: true, slug: true, excerpt: true, coverImageKey: true, publishedAt: true, createdAt: true },
      })
      .catch(() => []),
  ]);

  const latestCars = carsResult.status === "fulfilled" && Array.isArray(carsResult.value) ? carsResult.value : [];
  const topCarMetrics = metricsResult.status === "fulfilled" && Array.isArray(metricsResult.value) ? metricsResult.value : [];
  const popularComparisons = comparisonsResult.status === "fulfilled" && Array.isArray(comparisonsResult.value) ? comparisonsResult.value : [];
  const latestPosts = postsResult.status === "fulfilled" && Array.isArray(postsResult.value) ? postsResult.value : [];

  const topCars = topCarMetrics
    .filter((metric) => metric && metric.car)
    .map((metric) => ({
      ...metric,
      totalCount: (metric.viewCount ?? 0) + (metric.compareCount ?? 0)
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      if ((b.compareCount ?? 0) !== (a.compareCount ?? 0)) return (b.compareCount ?? 0) - (a.compareCount ?? 0);
      return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    })
    .slice(0, 6);

  const compareTargets = [
    ...latestCars.filter((c) => c && c.id && c.slug),
    ...topCars.map((item) => item.car).filter((c) => c && c.id && c.slug)
  ];

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

          <aside className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-bold text-ink">Top so sánh 2 xe phổ biến nhất</h2>
              <div className="space-y-3">
                {popularComparisons.length > 0 ? (
                  popularComparisons
                    .filter((c) => c && c.carA && c.carB)
                    .map((comparison) => (
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
            </section>

            {latestPosts.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-ink">Chuyện của xe</h2>
                  <Link href="/chuyen-cua-xe" className="text-sm font-semibold text-good hover:opacity-80">
                    Xem tất cả →
                  </Link>
                </div>
                <div className="space-y-3">
                  {latestPosts.map((post) => {
                    const imageUrl = buildPostImageUrl(post.coverImageKey, { width: 120, height: 80 });
                    const dateStr = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
                      new Date(post.publishedAt ?? post.createdAt)
                    );
                    return (
                      <Link
                        key={post.id}
                        href={`/chuyen-cua-xe/${post.slug}`}
                        className="flex gap-3 rounded-lg border border-line bg-white p-3 hover:border-good"
                      >
                        {imageUrl ? (
                          <div className="flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={imageUrl}
                              alt={post.title}
                              width={80}
                              height={60}
                              className="h-[60px] w-[80px] object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-[60px] w-[80px] flex-shrink-0 items-center justify-center rounded-md bg-surface">
                            <svg className="h-6 w-6 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">{post.title}</p>
                          <time className="mt-1 block text-xs text-muted">{dateStr}</time>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
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
  if (!Array.isArray(cars)) return undefined;
  return cars.find((item) => item && item.id && item.id !== carId);
}

function buildCompareHref(slug: string, targetSlug?: string) {
  return targetSlug ? `/compare/${slug}-vs-${targetSlug}` : "/compare";
}
