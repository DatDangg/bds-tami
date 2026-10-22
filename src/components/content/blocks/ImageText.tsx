import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { ImageTextPosition } from "@/blocks/news";
import { cn } from "@/lib/utils";

interface ImageTextProps {
  image: MediaImage;
  text: string;
  position: ImageTextPosition;
}

/** Khối "Ảnh cạnh chữ" (BL-054): ≥ md ảnh trái/phải cạnh chữ, < md ảnh trên chữ dưới. Xuống dòng trong ô chữ được giữ. */
export function ImageText({ image, text, position }: ImageTextProps) {
  return (
    <div className={cn("my-8 flex flex-col gap-5 first:mt-0 md:items-center md:gap-8", position === "right" ? "md:flex-row-reverse" : "md:flex-row")}>
      <div className="overflow-hidden rounded-xl md:w-5/12 md:shrink-0">
        <ResponsiveImage media={image} sizes="(min-width: 1024px) 320px, (min-width: 768px) 40vw, 100vw" aspectRatio="4/3" />
      </div>
      <p className="min-w-0 flex-1 text-body whitespace-pre-line">{text}</p>
    </div>
  );
}
