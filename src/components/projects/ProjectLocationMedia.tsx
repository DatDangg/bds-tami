import { useTranslations } from "next-intl";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { VideoFacade } from "@/components/media/VideoFacade";
import type { LocationMediaView } from "@/lib/projects/project-detail-view";

/**
 * Thẻ "Kết nối hạ tầng" cạnh bản đồ (BL-058, design `detail-du-an`): tiêu đề + video qua `VideoFacade` (ảnh thẻ làm ảnh bìa, iframe chỉ sau khi bấm play) hoặc chỉ ảnh bo góc.
 * Tiêu đề trống → nhãn mặc định theo ngôn ngữ. Server Component (facade là client).
 */
export function ProjectLocationMedia({ media }: { media: LocationMediaView }) {
  const t = useTranslations("page.projectDetail.v2");
  const title = media.title ?? t("locationMedia.title");
  return (
    <figure className="m-0 flex flex-col gap-3">
      <figcaption className="text-body font-semibold">{title}</figcaption>
      {media.videoUrl ? (
        <VideoFacade url={media.videoUrl} title={title} poster={media.image} className="rounded-md" />
      ) : (
        media.image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-muted">
            <ResponsiveImage media={media.image} alt={media.image.alt ?? title} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 40vw, 100vw" />
          </div>
        )
      )}
    </figure>
  );
}
