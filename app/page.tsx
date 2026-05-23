import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cars = await prisma.car.findMany({
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    take: 12
  });

  const popularPairs = [
    ["toyota-vios", "honda-city"],
    ["hyundai-accent", "mazda-2-sedan"],
    ["mazda-cx-5", "ford-territory"],
    ["byd-seal-5-2026", "honda-civic"]
  ];

  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-good">So sánh thông số ô tô</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
              So sánh xe theo giá bán, động cơ, kích thước, tiện nghi, an toàn và bình chọn.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Chọn hai mẫu xe để xem bảng so sánh rõ ràng, có đánh dấu thông số tốt hơn và nội dung tối ưu SEO.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="mb-4 text-xl font-bold text-ink">Xe mới cập nhật</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {cars.map((car) => (
                <Link key={car.id} href={`/compare/${car.slug}-vs-${cars.find((item) => item.id !== car.id)?.slug ?? car.slug}`} className="rounded-lg border border-line bg-white p-4 hover:border-good">
                  <div className="text-sm font-semibold text-ink">{car.name}</div>
                  <div className="mt-1 text-sm text-muted">
                    {car.brand} - {car.segment} - {car.seats} chỗ
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <aside>
            <h2 className="mb-4 text-xl font-bold text-ink">So sánh phổ biến</h2>
            <div className="space-y-3">
              {popularPairs.map(([a, b]) => (
                <Link key={`${a}-${b}`} href={`/compare/${a}-vs-${b}`} className="block rounded-lg border border-line bg-white p-4 text-sm font-semibold text-ink hover:border-good">
                  {a.replaceAll("-", " ")} vs {b.replaceAll("-", " ")}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
