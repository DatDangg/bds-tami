import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { Buildings, ClipboardText, Clock, Headset, MapPin, ShieldCheck, Star, Users } from "@/components/icons";
import type { StrengthIcon } from "@/globals/homepage/blocks";

/**
 * Giá trị lưu trong admin (`STRENGTH_ICONS`) → component Phosphor. Dùng cho khối Điểm mạnh và số liệu Về TAMI (BL-044).
 * `file-check`: Phosphor không có `FileCheck`, hiển thị bằng `ClipboardText`.
 */
export const STRENGTH_ICON_COMPONENTS: Record<StrengthIcon, ComponentType<IconProps>> = {
  "map-pin": MapPin,
  buildings: Buildings,
  headset: Headset,
  "file-check": ClipboardText,
  "shield-check": ShieldCheck,
  clock: Clock,
  users: Users,
  star: Star,
};
