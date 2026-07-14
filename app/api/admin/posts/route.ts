import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import type { PostStatus } from "@prisma/client";

// GET /api/admin/posts – lấy toàn bộ bài viết (admin)
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();

  const posts = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      coverImageKey: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ posts });
}

// POST /api/admin/posts – tạo bài mới
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();

  let body: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImageKey?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: PostStatus;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { title, slug, excerpt, content, coverImageKey, metaTitle, metaDescription, status } = body;

  if (!title?.trim() || !slug?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Tiêu đề, slug và nội dung là bắt buộc" }, { status: 400 });
  }

  // Kiểm tra slug trùng
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug đã tồn tại, vui lòng dùng slug khác" }, { status: 409 });
  }

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt?.trim() ?? "",
      content: content.trim(),
      coverImageKey: coverImageKey?.trim() || null,
      metaTitle: metaTitle?.trim() ?? "",
      metaDescription: metaDescription?.trim() ?? "",
      status: status ?? "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
