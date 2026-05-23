import { NextRequest, NextResponse } from "next/server";
import { CommentStatus } from "@prisma/client";
import { commentSchema, getCommentIpHash, publicCommentSelect } from "@/lib/comments";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") ?? "";
  const targetId = searchParams.get("targetId") ?? "";

  if (targetType !== "comparison" || !targetId) {
    return NextResponse.json({ error: "Thiếu target comment" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: {
      targetType,
      targetId,
      status: CommentStatus.APPROVED
    },
    orderBy: { createdAt: "desc" },
    select: publicCommentSelect()
  });

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const parsed = commentSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Comment không hợp lệ", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const ipHash = getCommentIpHash(request.headers);
  const approvedBefore = await prisma.comment.findFirst({
    where: {
      ipHash,
      status: CommentStatus.APPROVED
    },
    select: { id: true }
  });

  const comment = await prisma.comment.create({
    data: {
      ...parsed.data,
      ipHash,
      status: approvedBefore ? CommentStatus.APPROVED : CommentStatus.PENDING
    },
    select: {
      id: true,
      displayName: true,
      content: true,
      status: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    comment,
    approved: comment.status === CommentStatus.APPROVED,
    message: comment.status === CommentStatus.APPROVED ? "Comment đã được đăng." : "Comment đang chờ admin duyệt."
  });
}
