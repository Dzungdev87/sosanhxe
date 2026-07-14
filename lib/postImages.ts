const CLOUDINARY_BASE_URL = "https://res.cloudinary.com";
const DEFAULT_POSTS_FOLDER = "posts";

type PostImageOptions = {
  width?: number;
  height?: number;
};

export function buildPostImageUrl(imageKey?: string | null, options: PostImageOptions = {}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName || !imageKey) {
    return null;
  }

  const width = options.width ?? 1200;
  const height = options.height ?? 630;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_POSTS_FOLDER ?? DEFAULT_POSTS_FOLDER;
  const publicId = [folder, imageKey]
    .filter(Boolean)
    .join("/")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${CLOUDINARY_BASE_URL}/${encodeURIComponent(cloudName)}/image/upload/f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}/${publicId}`;
}
