import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const cars = await prisma.car.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      updatedAt: true
    }
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

  const compareRoutes: MetadataRoute.Sitemap = [];
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      compareRoutes.push({
        url: `${baseUrl}/compare/${cars[i].slug}-vs-${cars[j].slug}`,
        lastModified: cars[i].updatedAt > cars[j].updatedAt ? cars[i].updatedAt : cars[j].updatedAt,
        changeFrequency: "weekly",
        priority: 0.6
      });
    }
  }

  return [...staticRoutes, ...compareRoutes];
}
