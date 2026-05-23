import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-ink">Không tìm thấy trang</h1>
      <p className="mt-3 text-muted">Trang so sánh xe này chưa tồn tại.</p>
      <Link href="/compare" className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">
        Tạo so sánh mới
      </Link>
    </main>
  );
}
