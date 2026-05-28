import Image from "next/image";
import { buildCarImageUrl } from "@/lib/carImages";

type CarImageProps = {
  imageKey?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export default function CarImage({ imageKey, alt, width = 400, height = 300, className = "", priority = false, sizes = "400px" }: CarImageProps) {
  const src = buildCarImageUrl(imageKey, { width, height });
  const imageClassName = `block max-w-full bg-surface object-cover ${className}`;

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-surface text-sm font-semibold text-muted ${className}`} style={{ width, height }}>
        Chua co anh
      </div>
    );
  }

  return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={imageClassName} />;
}
