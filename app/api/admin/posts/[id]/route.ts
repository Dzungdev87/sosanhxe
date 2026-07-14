import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import type { PostStatus } from "@prisma/client";

// PATCH /api/admin/posts/[id] – cập nhật bài viết
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();

  const { id } = await params;

  let body: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImageKey?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    status?: PostStatus;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
  }

  // Kiểm tra slug trùng nếu đổi slug
  if (body.slug && body.slug !== existing.slug) {
    const slugConflict = await prisma.post.findUnique({ where: { slug: body.slug } });
    if (slugConflict) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }
  }

  const wasPublished = existing.status === "PUBLISHED";
  const willPublish = body.status === "PUBLISHED";

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() }),
      ...(body.excerpt !== undefined && { excerpt: body.excerpt.trim() }),
      ...(body.content !== undefined && { content: body.content.trim() }),
      ...(body.coverImageKey !== undefined && { coverImageKey: body.coverImageKey?.trim() || null }),
      ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle.trim() }),
      ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription.trim() }),
      ...(body.status !== undefined && { status: body.status }),
      // Set publishedAt khi chuyển sang PUBLISHED lần đầu
      ...(!wasPublished && willPublish && { publishedAt: new Date() }),
    },
  });

  return NextResponse.json({ post });
}

// DELETE /api/admin/posts/[id] – xoá bài viết
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();

  const { id } = await params;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
