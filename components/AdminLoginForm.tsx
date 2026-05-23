"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("dzungrock@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    let response: Response;
    try {
      response = await fetch(new URL("/api/admin/login", window.location.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch {
      setLoading(false);
      setMessage("Không kết nối được API đăng nhập. Hãy mở đúng địa chỉ http://127.0.0.1:3000/admin/login và kiểm tra dev server.");
      return;
    }

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Không thể đăng nhập");
      return;
    }

    router.push("/admin/cars");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-3 text-sm outline-none focus:border-good"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">Mật khẩu</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-3 text-sm outline-none focus:border-good"
          required
        />
      </label>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        Đăng nhập
      </button>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </form>
  );
}
