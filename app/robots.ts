import type { MetadataRoute } from "next";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"]
    },
    sitemap: `${siteUrl()}/sitemap.xml`
  };
}
