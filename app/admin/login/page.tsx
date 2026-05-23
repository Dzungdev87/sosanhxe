import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { getAdminEmail, isAdminAuthenticated } from "@/lib/adminAuth";

export const metadata = {
  title: "Đăng nhập Admin",
  description: "Đăng nhập khu vực quản trị xe.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/cars");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-lg border border-line bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-good">Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm text-muted">Email mặc định: {getAdminEmail()}</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
