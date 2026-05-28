const CLOUDINARY_BASE_URL = "https://res.cloudinary.com";
const DEFAULT_CARS_FOLDER = "cars";

type CarImageOptions = {
  width?: number;
  height?: number;
};

export function buildCarImageUrl(imageKey?: string | null, options: CarImageOptions = {}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName || !imageKey) {
    return null;
  }

  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER ?? DEFAULT_CARS_FOLDER;
  const publicId = [folder, imageKey]
    .filter(Boolean)
    .join("/")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${CLOUDINARY_BASE_URL}/${encodeURIComponent(cloudName)}/image/upload/f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}/${publicId}`;
}
