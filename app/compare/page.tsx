import SearchBox from "@/components/SearchBox";

export const metadata = {
  title: "So sánh xe",
  description: "Tìm hai mẫu xe để tạo trang so sánh chi tiết.",
  alternates: {
    canonical: "/compare"
  }
};

export default function CompareIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">So sánh hai mẫu xe</h1>
      <p className="mt-3 text-muted">Chọn hai mẫu xe để xem bảng so sánh chi tiết.</p>
      <div className="mt-6 rounded-lg border border-line bg-white p-5">
        <SearchBox />
      </div>
    </main>
  );
}
