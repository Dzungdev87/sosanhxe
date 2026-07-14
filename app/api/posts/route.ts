import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/posts – lấy bài viết đã published (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get("take") ?? "10"), 50);
  const skip = Number(searchParams.get("skip") ?? "0");

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      skip,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageKey: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
  ]);

  return NextResponse.json({ posts, total });
}
