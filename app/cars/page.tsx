import Link from "next/link";
import { currentMetricPeriod } from "@/lib/carMetrics";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Top xe được xem và so sánh nhiều nhất",
  description: "Top 10 xe được xem và được so sánh nhiều nhất trong tháng.",
  alternates: {
    canonical: "/cars"
  }
};

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const period = currentMetricPeriod();
  const metrics = await prisma.carMonthlyMetric.findMany({
    where: { period },
    include: { car: true }
  });
  const topCars = metrics
    .map((metric) => ({
      ...metric,
      totalCount: metric.viewCount + metric.compareCount
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      if (b.compareCount !== a.compareCount) return b.compareCount - a.compareCount;
      return b.viewCount - a.viewCount;
    })
    .slice(0, 10);
  const fallbackCars = await prisma.car.findMany({
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    select: { id: true, slug: true },
    take: 20
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Top 10 xe được xem và so sánh nhiều nhất</h1>
      <p className="mt-3 text-sm text-muted">
        Bảng xếp hạng tính theo tổng lượt xem và lượt so sánh trong tháng {period}. Khi sang tháng mới, lượt tính bắt đầu lại từ 0.
      </p>
      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Hạng</th>
              <th className="px-4 py-3">Xe</th>
              <th className="px-4 py-3">Phân khúc</th>
              <th className="px-4 py-3">Lượt xem</th>
              <th className="px-4 py-3">Lượt so sánh</th>
              <th className="px-4 py-3">Tổng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {topCars.length > 0 ? (
              topCars.map((metric, index) => {
                const compareTarget = [...topCars.map((item) => item.car), ...fallbackCars].find((item) => item.id !== metric.car.id);
                const href = compareTarget ? `/compare/${metric.car.slug}-vs-${compareTarget.slug}` : "/compare";

                return (
                  <tr key={metric.id}>
                    <td className="px-4 py-3 font-bold text-ink">#{index + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={href} className="font-semibold text-ink hover:text-good">
                        {metric.car.name}
                      </Link>
                      <div className="text-xs text-muted">{metric.car.brand}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{metric.car.segment}</td>
                    <td className="px-4 py-3">{new Intl.NumberFormat("vi-VN").format(metric.viewCount)}</td>
                    <td className="px-4 py-3">{new Intl.NumberFormat("vi-VN").format(metric.compareCount)}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{new Intl.NumberFormat("vi-VN").format(metric.totalCount)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-muted" colSpan={6}>
                  Chưa có dữ liệu xem hoặc so sánh trong tháng này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
