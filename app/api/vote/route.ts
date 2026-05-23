import { NextRequest, NextResponse } from "next/server";
import { VoteSide } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp, getVoteTotals, hashIp, normalizePair } from "@/lib/votes";

const voteSchema = z.object({
  carA: z.string().min(1),
  carB: z.string().min(1),
  vote: z.nativeEnum(VoteSide)
});

export async function POST(request: NextRequest) {
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || parsed.data.carA === parsed.data.carB) {
    return NextResponse.json({ error: "Dữ liệu bình chọn không hợp lệ" }, { status: 400 });
  }

  const count = await prisma.car.count({
    where: {
      id: {
        in: [parsed.data.carA, parsed.data.carB]
      }
    }
  });

  if (count !== 2) {
    return NextResponse.json({ error: "Không tìm thấy xe trong cặp so sánh" }, { status: 404 });
  }

  const pair = normalizePair(parsed.data.carA, parsed.data.carB);
  const ip = hashIp(getClientIp(request.headers));

  try {
    await prisma.vote.create({
      data: {
        carA: pair.carA,
        carB: pair.carB,
        ip,
        vote: pair.toStoredVote(parsed.data.vote)
      }
    });
  } catch {
    return NextResponse.json({ error: "Bạn đã bình chọn cho cặp xe này" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    votes: await getVoteTotals(parsed.data.carA, parsed.data.carB)
  });
}
