import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { buildPostImageUrl } from "@/lib/postImages";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, metaTitle: true, metaDescription: true, excerpt: true, coverImageKey: true, publishedAt: true },
  });

  if (!post) return { title: "Không tìm thấy bài viết" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const ogImage = buildPostImageUrl(post.coverImageKey, { width: 1200, height: 630 });
  const canonicalUrl = `${siteUrl}/chuyen-cua-xe/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/chuyen-cua-xe/${slug}` },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
  });

  if (!post) notFound();

  const coverImageUrl = buildPostImageUrl(post.coverImageKey, { width: 1200, height: 630 });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "So Sánh Xe", url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: "So Sánh Xe",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/chuyen-cua-xe/${slug}` },
    ...(coverImageUrl && {
      image: { "@type": "ImageObject", url: coverImageUrl, width: 1200, height: 630 },
    }),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">
              Trang chủ
            </Link>
            <span>›</span>
            <Link href="/chuyen-cua-xe" className="hover:text-ink">
              Chuyện của xe
            </Link>
            <span>›</span>
            <span className="text-ink line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/chuyen-cua-xe"
            className="mb-4 inline-block text-sm font-semibold uppercase tracking-wide text-good hover:opacity-80"
          >
            ← Chuyện của xe
          </Link>
          <h1 className="text-3xl font-bold leading-tight text-ink md:text-4xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-3 text-sm text-muted">
            <span>So Sánh Xe</span>
            <span>·</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt ?? post.createdAt)}
            </time>
          </div>
        </header>

        {/* Cover image */}
        {coverImageUrl && (
          <div className="mb-8 overflow-hidden rounded-xl border border-line">
            <Image
              src={coverImageUrl}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose-static"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <footer className="mt-12 border-t border-line pt-8">
          <Link
            href="/chuyen-cua-xe"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-good"
          >
            ← Xem tất cả bài viết
          </Link>
        </footer>
      </article>
    </main>
  );
}
