import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setAdminSession, validateAdminLogin } from "@/lib/adminAuth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !validateAdminLogin(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSession(response, parsed.data.email);
  return response;
}
