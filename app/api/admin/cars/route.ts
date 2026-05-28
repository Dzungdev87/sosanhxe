import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { serializeBigInt } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const cars = await prisma.car.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
  });

  return NextResponse.json(serializeBigInt({ cars }));
}
