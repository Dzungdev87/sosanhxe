import { NextRequest, NextResponse } from "next/server";
import { CommentStatus, Prisma } from "@prisma/client";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  if (!isAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (![CommentStatus.APPROVED, CommentStatus.REJECTED, CommentStatus.PENDING].includes(status)) {
    return NextResponse.json({ error: "Trạng thái comment không hợp lệ" }, { status: 400 });
  }

  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Không tìm thấy comment" }, { status: 404 });
    }
    return NextResponse.json({ error: "Không thể cập nhật comment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  if (!isAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;

  try {
    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Không tìm thấy comment" }, { status: 404 });
    }
    return NextResponse.json({ error: "Không thể xoá comment" }, { status: 500 });
  }
}
