import { prisma } from "@/lib/db";

export function currentMetricPeriod(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric"
    }).formatToParts(date);
    return parts.find((part) => part.type === "year")?.value ?? String(date.getFullYear());
  } catch (e) {
    return String(date.getFullYear());
  }
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
