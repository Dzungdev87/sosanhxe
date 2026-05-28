import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { carUpdateSchema } from "@/lib/carValidation";
import { prisma } from "@/lib/db";
import { serializeBigInt } from "@/lib/serialize";
import { slugify } from "@/lib/slug";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteProps) {
  if (!isAdminRequest(_request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id } });

  if (!car) {
    return NextResponse.json({ error: "Không tìm thấy xe" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt({ car }));
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  if (!isAdminRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = carUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dữ liệu xe không hợp lệ",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const car = await prisma.car.update({
      where: { id },
      data: {
        ...parsed.data,
        slug: slugify(parsed.data.name)
      }
    });

    return NextResponse.json(serializeBigInt({ car }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Tên xe tạo slug bị trùng với xe khác" }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Không tìm thấy xe" }, { status: 404 });
    }

    return NextResponse.json({ error: "Không thể cập nhật xe" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  if (!isAdminRequest(_request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;

  try {
    await prisma.car.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Không tìm thấy xe" }, { status: 404 });
    }

    return NextResponse.json({ error: "Không thể xoá xe" }, { status: 500 });
  }
}
