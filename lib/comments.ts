import { createHash } from "crypto";
import { z } from "zod";
import { getClientIp } from "@/lib/votes";

export const commentSchema = z.object({
  targetType: z.literal("comparison"),
  targetId: z.string().min(3).max(180),
  displayName: z.string().trim().min(2).max(60),
  content: z.string().trim().min(3).max(1200)
});

export function getCommentIpHash(headers: Headers) {
  const ip = getClientIp(headers);
  const salt = process.env.COMMENT_IP_SALT ?? process.env.VOTE_IP_SALT ?? "local-comment-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function publicCommentSelect() {
  return {
    id: true,
    displayName: true,
    content: true,
    createdAt: true
  } as const;
}
