"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Play } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ResponsiveImage, type MediaImage } from "./ResponsiveImage";
import { parseVideoUrl } from "./video-url";

type VideoFacadeProps = {
  /** URL YouTube/TikTok do nhân viên nhập; ngoài whitelist thì không render gì. */
  url: string;
  /** Tên video (đã dịch theo locale) cho `aria-label`, `alt` và `title` iframe. */
  title: string;
  /** Ảnh bìa từ `media`. YouTube không có thì dùng thumbnail YouTube (trừ khi Save-Data); TikTok bắt buộc có poster mới hiện ảnh. */
  poster?: MediaImage | null;
  className?: string;
};

type NetworkInformationLike = { saveData?: boolean; addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
const getConnection = () => (navigator as Navigator & { connection?: NetworkInformationLike }).connection;

function subscribeSaveData(onChange: () => void) {
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);
  return () => connection?.removeEventListener?.("change", onChange);
}
const readSaveData = () => Boolean(getConnection()?.saveData);
// null = chưa biết (SSR/trước hydrate): chưa tải gì từ bên thứ ba.
const unknownOnServer = () => null;

/**
 * Facade (design-spec §1.5): chỉ ảnh + nút phát; iframe chỉ được tạo SAU khi bấm. YouTube dùng `youtube-nocookie`.
 * Không preconnect trước khi bấm. Save-Data: không tải thumbnail từ YouTube (ảnh `media` của mình vẫn lazy).
 */
export function VideoFacade({ url, title, poster, className }: VideoFacadeProps) {
  const t = useTranslations("media.video");
  const video = useMemo(() => parseVideoUrl(url), [url]);
  const [playing, setPlaying] = useState(false);
  const saveData = useSyncExternalStore<boolean | null>(subscribeSaveData, readSaveData, unknownOnServer);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  if (!video) return null;
  const frameClass = cn("relative mx-auto w-full overflow-hidden rounded-sm bg-dark", video.provider === "tiktok" && "max-w-[325px]", className);
  const frameStyle = { aspectRatio: video.aspectRatio };

  if (playing) {
    return (
      <div className={frameClass} style={frameStyle}>
        <iframe
          ref={iframeRef}
          src={video.embedUrl}
          title={t("frameTitle", { title })}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  const thumbnailAlt = t("thumbnailAlt", { title });
  const showYoutubeThumbnail = !poster && video.provider === "youtube" && saveData === false;
  return (
    <div className={frameClass} style={frameStyle}>
      {poster && <ResponsiveImage media={poster} alt={thumbnailAlt} sizes={video.provider === "tiktok" ? "325px" : "(min-width: 1024px) 50vw, 100vw"} />}
      {showYoutubeThumbnail && (
        <Image
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt={thumbnailAlt}
          fill
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      )}
      <button
        type="button"
        aria-label={t("play", { title })}
        onClick={() => setPlaying(true)}
        className="absolute inset-0 flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-dark-deep/30 transition-colors duration-(--duration-fast) hover:bg-dark-deep/45"
      >
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Play size={28} weight="fill" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
