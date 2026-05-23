import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const carA = searchParams.get("carA");
  const carB = searchParams.get("carB");

  if (!carA || !carB || carA === carB) {
    return NextResponse.json({ error: "carA and carB query parameters are required and must differ" }, { status: 400 });
  }

  const cars = await prisma.car.findMany({
    where: {
      slug: {
        in: [carA, carB]
      }
    }
  });

  if (cars.length !== 2) {
    return NextResponse.json({ error: "One or both cars were not found" }, { status: 404 });
  }

  return NextResponse.json({
    cars: {
      carA: cars.find((car) => car.slug === carA),
      carB: cars.find((car) => car.slug === carB)
    }
  });
}
