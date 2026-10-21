"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState, useSyncExternalStore } from "react";
import { MagnifyingGlass } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { OptionSelect, type SelectOption } from "@/components/ui/option-select";
import { normalizeSearchText } from "@/lib/search/normalize";
import { cn } from "@/lib/utils";

const subscribeNever = () => () => {};

/** `false` khi SSR / lượt hydrate đầu (trang chạy như form GET không JS), `true` ngay sau hydrate. Không setState trong effect. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * Giá trị hiển thị lạc quan: đổi ngay khi người dùng chọn (URL còn đang tải), rồi theo lại `value` từ URL mỗi khi nó đổi (back, "Xoá tất cả", chip…).
 * `same` so sánh hai giá trị (mảng so theo nội dung).
 */
export function useUrlBackedState<T>(value: T, same: (a: T, b: T) => boolean = Object.is) {
  const [state, setState] = useState(value);
  const [source, setSource] = useState(value);
  if (!same(source, value)) {
    setSource(value);
    setState(value);
  }
  return [state, setState] as const;
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((item, index) => item === b[index]);

/** Một nhóm lọc trong thẻ "Bộ lọc": `fieldset` + tiêu đề nhỏ in hoa (`legend`). */
export function FilterGroup({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0", className)}>
      <legend className="float-left mb-3 w-full text-xsmall font-semibold tracking-[0.08em] text-text-secondary uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

export interface ChipOption {
  /** `""` = "Tất cả" (không lên URL). */
  value: string;
  label: string;
}

interface ChipChoiceProps {
  /** Tên tham số (form GET không JS gửi `name=value`). */
  name: string;
  options: readonly ChipOption[];
  /** Giá trị đang trên URL; `""` = mục "Tất cả". */
  value: string;
  onChange?: (value: string) => void;
}

/** Chọn một trong các chip (BL-052 "Tình trạng"): radio gốc ẩn + nhãn kiểu chip nên bàn phím (mũi tên) và form GET không JS chạy sẵn; đang chọn nền tối. */
export function ChipChoice({ name, options, value, onChange }: ChipChoiceProps) {
  const [selected, setSelected] = useUrlBackedState(value);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selected === option.value}
            onChange={() => {
              setSelected(option.value);
              onChange?.(option.value);
            }}
            className="peer sr-only"
          />
          <span className="inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-input-border px-4 text-small font-medium text-text transition-colors duration-(--duration-fast) peer-checked:border-dark peer-checked:bg-dark peer-checked:text-on-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring hover:border-accent-text lg:min-h-10">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export interface FacetOption {
  value: string;
  label: string;
  /** Số tin khớp mọi lọc khác trừ chiều này; 0 → mục mờ (vẫn chọn được, không ẩn); không truyền → không hiện số. */
  count?: number;
}

interface CheckboxFacetListProps {
  /** Tên tham số (không JS gửi khoá lặp `name=a&name=b`; `parseMultiValue` nhận cả hai dạng). */
  name: string;
  /** Tên danh sách cho trình đọc màn hình + ô tìm (vd "Tỉnh / thành"). */
  label: string;
  options: readonly FacetOption[];
  value: readonly string[];
  onChange?: (value: string[]) => void;
  /** Có → ô tìm trong danh sách (khớp không dấu) với gợi ý này. */
  searchPlaceholder?: string;
  /** Chỉ hiện N mục đầu + "Xem thêm" (mục đang chọn nằm sau N thì mở sẵn). Không truyền → hiện hết. Chưa có JS luôn hiện hết. */
  initialVisible?: number;
}

/** Danh sách ô tích + số đếm (BL-052 Tỉnh/thành, Loại hình, Tiện ích): ô `checkbox` gốc có `name` nên form GET không JS gửi được; có JS thì mỗi lần tích gọi `onChange` với danh sách mới. */
export function CheckboxFacetList({ name, label, options, value, onChange, searchPlaceholder, initialVisible }: CheckboxFacetListProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();
  const listId = useId();
  const [selected, setSelected] = useUrlBackedState<readonly string[]>(value, sameList);
  const [query, setQuery] = useState("");
  const limit = initialVisible ?? options.length;
  const [expanded, setExpanded] = useState(() => options.some((option, index) => index >= limit && value.includes(option.value)));
  const needle = normalizeSearchText(query);
  const matching = needle ? options.filter((option) => normalizeSearchText(option.label).includes(needle)) : options;
  const collapsible = hydrated && !needle && options.length > limit;
  const visible = !hydrated || needle || expanded ? matching : matching.slice(0, limit);

  function toggle(optionValue: string, checked: boolean) {
    const next = checked ? [...selected, optionValue] : selected.filter((item) => item !== optionValue);
    // Giữ thứ tự của danh sách (URL ổn định), không theo thứ tự bấm.
    const ordered = options.map((option) => option.value).filter((item) => next.includes(item));
    setSelected(ordered);
    onChange?.(ordered);
  }

  return (
    <div className="flex flex-col gap-1">
      {hydrated && searchPlaceholder && (
        <div className="relative mb-2">
          <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            aria-label={t("searchIn", { label })}
            aria-controls={listId}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // Enter trong ô tìm không được gửi form lọc bao ngoài.
            onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
            className="h-11 rounded-pill pl-10 text-small"
          />
        </div>
      )}
      <ul id={listId} aria-label={label} className="flex flex-col">
        {visible.map((option) => (
          <li key={option.value} data-empty={option.count === 0 ? "true" : undefined} className={cn(option.count === 0 && "opacity-60")}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-text lg:min-h-10">
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={(event) => toggle(option.value, event.target.checked)}
                className="size-5 shrink-0 cursor-pointer accent-primary"
              />
              <span className="min-w-0 flex-1 break-words">{option.label}</span>
              {option.count !== undefined && <span className="shrink-0 text-xsmall text-text-muted tabular-nums">({option.count})</span>}
            </label>
          </li>
        ))}
      </ul>
      {needle && matching.length === 0 && <p className="text-small text-text-muted">{t("noMatch")}</p>}
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className="inline-flex min-h-11 cursor-pointer items-center self-start text-small font-semibold text-accent-text underline-offset-4 hover:underline lg:min-h-9"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}

interface SelectFacetProps {
  /** Tên tham số. */
  name: string;
  /** Tên ô cho trình đọc màn hình (tiêu đề nhóm hiển thị đã nằm ở `FilterGroup`). */
  label: string;
  /** Nên có mục `value: ""` "Tất cả…". */
  options: readonly SelectOption[];
  value: string;
  onChange?: (value: string) => void;
}

/** Ô chọn một (BL-052 "Chủ đầu tư", "Dự án", "Phường"): Select TAMI (`OptionSelect progressive`: chưa có JS là `<select name>` gốc). */
export function SelectFacet({ name, label, options, value, onChange }: SelectFacetProps) {
  const id = useId();
  const [selected, setSelected] = useUrlBackedState(value);
  return (
    <OptionSelect
      progressive
      id={id}
      name={name}
      aria-label={label}
      options={[...options]}
      value={selected}
      onValueChange={(next) => {
        setSelected(next);
        onChange?.(next);
      }}
      className="h-11 rounded-pill text-small"
    />
  );
}
