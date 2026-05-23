import { createHash } from "crypto";
import type { VoteSide } from "@prisma/client";
import { prisma } from "@/lib/db";

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export function hashIp(ip: string) {
  const salt = process.env.VOTE_IP_SALT ?? "local-development-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function normalizePair(displayCarA: string, displayCarB: string) {
  const [carA, carB] = [displayCarA, displayCarB].sort();
  const displayAIsNormalizedA = displayCarA === carA;

  return {
    carA,
    carB,
    toStoredVote(vote: VoteSide): VoteSide {
      return displayAIsNormalizedA ? vote : vote === "A" ? "B" : "A";
    },
    toDisplayVote(vote: VoteSide): VoteSide {
      return displayAIsNormalizedA ? vote : vote === "A" ? "B" : "A";
    }
  };
}

export async function getVoteTotals(displayCarA: string, displayCarB: string) {
  const pair = normalizePair(displayCarA, displayCarB);
  const votes = await prisma.vote.groupBy({
    by: ["vote"],
    where: {
      carA: pair.carA,
      carB: pair.carB
    },
    _count: true
  });

  return votes.reduce(
    (totals, item) => {
      const side = pair.toDisplayVote(item.vote);
      totals[side.toLowerCase() as "a" | "b"] = item._count;
      return totals;
    },
    { a: 0, b: 0 }
  );
}
