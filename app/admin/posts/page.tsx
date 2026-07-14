import { redirect } from "next/navigation";
import Link from "next/link";
import AdminPostsClient from "@/components/AdminPostsClient";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Admin - Chuyện của xe",
  description: "Quản lý bài viết chuyên mục Chuyện của xe.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const posts = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImageKey: true,
      metaTitle: true,
      metaDescription: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Serialize dates thành string để truyền vào client component
  const serializedPosts = posts.map((post) => ({
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-good">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Chuyện của xe</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Tạo và quản lý bài viết trong chuyên mục Chuyện của xe. Hỗ trợ SEO đầy đủ.
          </p>
          <div className="mt-3 flex gap-4 text-sm font-semibold text-muted">
            <Link href="/admin/cars" className="hover:text-ink">
              Quản lý xe
            </Link>
            <Link href="/admin/comments" className="hover:text-ink">
              Duyệt comment
            </Link>
            <Link href="/admin/posts" className="text-ink">
              Chuyện của xe
            </Link>
          </div>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminPostsClient initialPosts={serializedPosts} />
    </main>
  );
}
