import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { buildPostImageUrl } from "@/lib/postImages";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
const pageTitle = "Chuyện của xe - Tin tức & câu chuyện ô tô tại Việt Nam";
const pageDescription =
  "Khám phá những câu chuyện thú vị, tin tức mới nhất và đánh giá xe ô tô từ So Sánh Xe. Cập nhật xu hướng, kinh nghiệm mua xe cho người Việt.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/chuyen-cua-xe" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteUrl}/chuyen-cua-xe`,
    type: "website",
  },
};

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

export default async function ChuyenCuaXePage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageKey: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-good">
            Chuyên mục
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Chuyện của xe
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Những câu chuyện, tin tức và đánh giá xe ô tô hay nhất dành cho người Việt.
          </p>
        </div>
      </section>

      {/* Danh sách bài viết */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-12 text-center">
            <p className="text-muted">Chưa có bài viết nào. Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const imageUrl = buildPostImageUrl(post.coverImageKey, { width: 600, height: 360 });
              const dateStr = formatDate(post.publishedAt ?? post.createdAt);

              return (
                <Link
                  key={post.id}
                  href={`/chuyen-cua-xe/${post.slug}`}
                  className="group rounded-xl border border-line bg-white overflow-hidden hover:border-good hover:shadow-md transition-all"
                >
                  {imageUrl ? (
                    <div className="aspect-[5/3] overflow-hidden bg-surface">
                      <Image
                        src={imageUrl}
                        alt={post.title}
                        width={600}
                        height={360}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="aspect-[5/3] bg-surface flex items-center justify-center">
                      <svg className="h-12 w-12 text-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <time className="text-xs text-muted">{dateStr}</time>
                    <h2 className="mt-2 text-base font-bold text-ink leading-snug line-clamp-2 group-hover:text-good transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="mt-3 inline-block text-sm font-semibold text-good">
                      Đọc tiếp →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
