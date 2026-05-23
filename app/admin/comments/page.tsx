import Link from "next/link";
import { redirect } from "next/navigation";
import AdminCommentsClient from "@/components/AdminCommentsClient";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Admin duyệt comment",
  description: "Duyệt, từ chối và xoá comment người dùng.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-good">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Duyệt comment</h1>
          <div className="mt-3 flex gap-4 text-sm font-semibold text-muted">
            <Link href="/admin/cars" className="hover:text-ink">
              Quản lý xe
            </Link>
            <Link href="/admin/comments" className="text-ink">
              Duyệt comment
            </Link>
          </div>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminCommentsClient
        initialComments={comments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString()
        }))}
      />
    </main>
  );
}
