import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Danh sách xe",
  description: "Danh sách xe dùng cho công cụ so sánh ô tô.",
  alternates: {
    canonical: "/cars"
  }
};

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const cars = await prisma.car.findMany({
    orderBy: [{ brand: "asc" }, { name: "asc" }]
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Danh sách xe</h1>
      <p className="mt-3 text-sm text-muted">Chọn một mẫu xe để mở nhanh trang so sánh với xe khác trong database.</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Xe</th>
              <th className="px-4 py-3">Phân khúc</th>
              <th className="px-4 py-3">Công suất</th>
              <th className="px-4 py-3">Tiêu hao</th>
              <th className="px-4 py-3">Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="px-4 py-3">
                  <Link href={`/compare/${car.slug}-vs-${cars.find((item) => item.id !== car.id)?.slug ?? car.slug}`} className="font-semibold text-ink hover:text-good">
                    {car.name}
                  </Link>
                  <div className="text-xs text-muted">{car.brand}</div>
                </td>
                <td className="px-4 py-3 text-muted">{car.segment}</td>
                <td className="px-4 py-3">{car.engineHp} mã lực</td>
                <td className="px-4 py-3">{car.fuelConsumption} lít/100 km</td>
                <td className="px-4 py-3">{new Intl.NumberFormat("vi-VN").format(car.price)} VND</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
