import type { ReactNode } from "react";
import { IMAGE_TEXT_POSITIONS, type ImageTextPosition, NEWS_BLOCK_SLUGS, STAT_HIGHLIGHTS_MAX } from "@/blocks/news";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { relationId } from "@/lib/payload/relation-id";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { ImageText } from "./ImageText";
import { ProjectMention } from "./ProjectMention";
import { type StatHighlightItem, StatHighlights } from "./StatHighlights";

type Fields = Record<string, unknown>;

const nonEmpty = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

function statItems(value: unknown): StatHighlightItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((row: unknown) => {
      const item = typeof row === "object" && row !== null ? (row as Fields) : {};
      const itemValue = nonEmpty(item.value);
      const label = nonEmpty(item.label);
      return itemValue && label ? [{ value: itemValue, label }] : [];
    })
    .slice(0, STAT_HIGHLIGHTS_MAX);
}

/** Ảnh `media` đã populate (depth ≥ 1) và là ảnh; id chưa populate / PDF → `null` (như node `upload` của `RichText`). */
function imageMedia(value: unknown): MediaImage | null {
  if (typeof value !== "object" || value === null) return null;
  const media = value as MediaImage & { mimeType?: string | null };
  if (!media.url || (media.mimeType && !media.mimeType.startsWith("image/"))) return null;
  return media;
}

const imagePosition = (value: unknown): ImageTextPosition => (IMAGE_TEXT_POSITIONS.includes(value as ImageTextPosition) ? (value as ImageTextPosition) : "left");

/**
 * Node `block` của Lexical → khối Tin tức theo DANH SÁCH CHO PHÉP `blockType` (BL-054). Khối lạ, thiếu dữ liệu bắt buộc, ảnh chưa populate
 * hoặc dự án không có trong `projects` (chưa xuất bản / đã xoá / `/en` chưa có bản EN) → `null`, không render gì. Chữ đi qua React (escape).
 */
export function renderNewsBlock(fields: unknown, key: number, projects: ReadonlyMap<string, ProjectCardData> | undefined): ReactNode {
  if (typeof fields !== "object" || fields === null) return null;
  const data = fields as Fields;
  switch (data.blockType) {
    case NEWS_BLOCK_SLUGS.statHighlights: {
      const items = statItems(data.items);
      return items.length > 0 ? <StatHighlights key={key} items={items} /> : null;
    }
    case NEWS_BLOCK_SLUGS.imageText: {
      const image = imageMedia(data.image);
      const text = nonEmpty(data.text);
      return image && text ? <ImageText key={key} image={image} text={text} position={imagePosition(data.imagePosition)} /> : null;
    }
    case NEWS_BLOCK_SLUGS.projectMention: {
      const id = relationId(data.project);
      const project = id ? projects?.get(id) : undefined;
      return project ? <ProjectMention key={key} project={project} /> : null;
    }
    default:
      return null;
  }
}
