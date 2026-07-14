import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const POSTS_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_POSTS_FOLDER ?? "sosanhxe/posts";

// POST /api/admin/upload-post-image – upload ảnh bài viết lên Cloudinary
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Dữ liệu form không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Vui lòng chọn file ảnh" }, { status: 400 });
  }

  const blob = file as Blob;
  const mimeType = blob.type;
  if (!mimeType.startsWith("image/")) {
    return NextResponse.json({ error: "Chỉ chấp nhận file ảnh" }, { status: 400 });
  }

  const maxSizeMb = 5;
  if (blob.size > maxSizeMb * 1024 * 1024) {
    return NextResponse.json({ error: `Ảnh tối đa ${maxSizeMb}MB` }, { status: 400 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: POSTS_FOLDER,
    resource_type: "image",
  });

  // Trả về publicId tương đối (bỏ folder prefix để lưu vào DB)
  const relativeKey = result.public_id.replace(`${POSTS_FOLDER}/`, "");

  return NextResponse.json({
    imageKey: relativeKey,
    url: result.secure_url,
    publicId: result.public_id,
  });
}
