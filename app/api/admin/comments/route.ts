import { NextRequest, NextResponse } from "next/server";
import { CommentStatus } from "@prisma/client";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const status = request.nextUrl.searchParams.get("status");
  const statusFilter = status && status !== "ALL" && Object.values(CommentStatus).includes(status as CommentStatus) ? (status as CommentStatus) : undefined;
  const comments = await prisma.comment.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ comments });
}
