import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const cars = await prisma.car.findMany({
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      segment: true
    }
  });

  return NextResponse.json({ cars });
}
