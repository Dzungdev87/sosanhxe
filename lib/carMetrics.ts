import { prisma } from "@/lib/db";

export function currentMetricPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export async function recordCarComparison(carAId: string, carBId: string) {
  const period = currentMetricPeriod();
  const uniqueCarIds = [...new Set([carAId, carBId])];
  const [firstCarId, secondCarId] = [carAId, carBId].sort();

  await Promise.all(
    [
      ...uniqueCarIds.map((carId) =>
        prisma.carMonthlyMetric.upsert({
          where: {
            carId_period: {
              carId,
              period
            }
          },
          create: {
            carId,
            period,
            viewCount: 1,
            compareCount: 1
          },
          update: {
            viewCount: { increment: 1 },
            compareCount: { increment: 1 }
          }
        })
      ),
      prisma.comparisonMonthlyMetric.upsert({
        where: {
          carAId_carBId_period: {
            carAId: firstCarId,
            carBId: secondCarId,
            period
          }
        },
        create: {
          carAId: firstCarId,
          carBId: secondCarId,
          period,
          compareCount: 1
        },
        update: {
          compareCount: { increment: 1 }
        }
      })
    ]
  );
}
