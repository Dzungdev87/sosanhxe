import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const popularComparisons = await prisma.comparisonMonthlyMetric.findMany({
    include: {
      carA: { select: { slug: true, updatedAt: true } },
      carB: { select: { slug: true, updatedAt: true } }
    },
    orderBy: [{ compareCount: "desc" }, { updatedAt: "desc" }],
    take: 250
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];

  const compareRoutes: MetadataRoute.Sitemap = popularComparisons.map((comparison) => ({
    url: `${baseUrl}/compare/${comparison.carA.slug}-vs-${comparison.carB.slug}`,
    lastModified:
      comparison.carA.updatedAt > comparison.carB.updatedAt ? comparison.carA.updatedAt : comparison.carB.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...staticRoutes, ...compareRoutes];
}
