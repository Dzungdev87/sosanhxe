"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-good">
      Đăng xuất
    </button>
  );
}
