import { redirect } from "next/navigation";
import Link from "next/link";
import AdminCarsClient from "@/components/AdminCarsClient";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { serializeBigInt } from "@/lib/serialize";

export const metadata = {
  title: "Admin quản lý xe",
  description: "Sửa thông số và xoá xe trong cơ sở dữ liệu.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminCarsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const cars = await prisma.car.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-good">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Quản lý thông số xe</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Màn hình này cho phép sửa và xoá xe trực tiếp trong Supabase.
          </p>
          <div className="mt-3 flex gap-4 text-sm font-semibold text-muted">
            <Link href="/admin/cars" className="text-ink">
              Quản lý xe
            </Link>
            <Link href="/admin/comments" className="hover:text-ink">
              Duyệt comment
            </Link>
            <Link href="/admin/posts" className="hover:text-ink">
              Chuyện của xe
            </Link>
          </div>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminCarsClient initialCars={serializeBigInt(cars)} />
    </main>
  );
}
