import { CaretDown, CaretUp } from "@/components/icons";

interface DetailExpandButtonProps {
  expanded: boolean;
  onToggle: () => void;
  /** `id` danh sách được mở rộng (`aria-controls`). */
  controls: string;
  /** Nhãn lúc thu gọn (vd "Khám phá tất cả tiện ích"). */
  moreLabel: string;
  lessLabel: string;
}

/** Nút "Xem thêm / Thu gọn" dùng chung của các danh sách dài trong trang chi tiết (`aria-expanded` + `aria-controls`). Chỉ dùng trong client component. */
export function DetailExpandButton({ expanded, onToggle, controls, moreLabel, lessLabel }: DetailExpandButtonProps) {
  const Icon = expanded ? CaretUp : CaretDown;
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-small font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {expanded ? lessLabel : moreLabel}
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
