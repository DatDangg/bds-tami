"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useHydrated, useUrlBackedState } from "./FilterFacets";

/** `null` = đầu đó đang ở mép (không lên URL: mép dưới = từ 0, mép trên = không giới hạn). */
export type RangeValue = readonly [number | null, number | null];

interface RangeSliderFacetProps {
  /** Tên hai tham số `[min, max]` (vd `["priceMin", "priceMax"]`), cùng đơn vị với `min`/`max`/`step`. */
  names: readonly [string, string];
  min: number;
  max: number;
  step: number;
  value: RangeValue;
  /** Định dạng một giá trị cho nhãn hai đầu + `aria-valuetext` (vd `5` → "5 tỷ", `50` → "50+ tỷ"). */
  formatValue: (value: number) => string;
  /** Tên hai đầu kéo; mặc định "Thấp nhất" / "Cao nhất". */
  thumbLabels?: readonly [string, string];
  /**
   * Gọi NGAY khi thả đầu kéo (chuột / ngón tay), hoặc sau khi ngừng bấm phím `RANGE_COMMIT_DELAY_MS` (giữ phím ←/→ không bắn mỗi bước một lần điều hướng).
   * Đầu ở mép → `null`.
   */
  onCommit?: (value: RangeValue) => void;
}

/** Chờ sau lần commit cuối của Radix (mỗi phím bấm là một commit) rồi mới báo ra ngoài. */
export const RANGE_COMMIT_DELAY_MS = 300;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function sameNumbers(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * Khoảng giá trị bằng thanh trượt 2 đầu (BL-052 Mức giá / Diện tích): bàn phím ←/→/Home/End (Radix), `aria-valuetext` theo `formatValue`, nhãn hai đầu dưới thanh.
 * Chưa có JS → hai ô số `name` (Từ / Đến) để form GET vẫn lọc được. Đầu ở mép không lên URL.
 * Hẹn giờ commit gọi `onCommit` MỚI NHẤT (qua ref): trong 300ms chờ, URL có thể đã đổi (ô lọc khác vừa áp dụng) và `onCommit` của lần render cũ sẽ dựng URL từ tham số cũ.
 * Thả chuột / ngón tay thì commit ngay, không hẹn giờ (P1-T02 review r3 n2): kéo rồi bấm "Xem kết quả" đóng Sheet ngay không làm mất giá vừa chọn.
 */
export function RangeSliderFacet({ names, min, max, step, value, formatValue, thumbLabels, onCommit }: RangeSliderFacetProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();
  const fromId = useId();
  const toId = useId();
  // URL có thể đảo (`priceMin` > `priceMax`): sắp lại để hai đầu kéo đúng thứ tự.
  const fromUrl = [clamp(value[0] ?? min, min, max), clamp(value[1] ?? max, min, max)].sort((a, b) => a - b);
  const [range, setRange] = useUrlBackedState<readonly number[]>(fromUrl, sameNumbers);
  const low = range[0] ?? min;
  const high = range[1] ?? max;
  const toParam = (next: number, edge: number) => (next === edge ? "" : String(next));
  const labels = thumbLabels ?? [t("rangeLow"), t("rangeHigh")];
  const onCommitRef = useRef(onCommit);
  useLayoutEffect(() => {
    onCommitRef.current = onCommit;
  });
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Lần tương tác cuối là con trỏ (kéo / chạm) hay bàn phím: Radix gọi `onValueCommit` cho cả hai. */
  const fromPointer = useRef(false);
  useEffect(() => () => clearTimeout(commitTimer.current), []);

  function commit([nextLow = min, nextHigh = max]: number[]) {
    clearTimeout(commitTimer.current);
    const report = () => onCommitRef.current?.([nextLow === min ? null : nextLow, nextHigh === max ? null : nextHigh]);
    if (fromPointer.current) report();
    else commitTimer.current = setTimeout(report, RANGE_COMMIT_DELAY_MS);
  }

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={fromId} className="flex flex-col gap-1 text-xsmall text-text-secondary">
          {t("rangeFrom")}
          <Input id={fromId} type="number" name={names[0]} min={min} max={max} step={step} defaultValue={value[0] ?? ""} placeholder={String(min)} className="h-11 text-small" />
        </label>
        <label htmlFor={toId} className="flex flex-col gap-1 text-xsmall text-text-secondary">
          {t("rangeTo")}
          <Input id={toId} type="number" name={names[1]} min={min} max={max} step={step} defaultValue={value[1] ?? ""} placeholder={String(max)} className="h-11 text-small" />
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Slider
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={0}
        value={[low, high]}
        onValueChange={(next) => setRange(next)}
        onValueCommit={commit}
        onPointerDown={() => {
          fromPointer.current = true;
        }}
        onKeyDown={() => {
          fromPointer.current = false;
        }}
        thumbs={[
          { label: labels[0], valueText: formatValue(low) },
          { label: labels[1], valueText: formatValue(high) },
        ]}
      />
      <input type="hidden" name={names[0]} value={toParam(low, min)} />
      <input type="hidden" name={names[1]} value={toParam(high, max)} />
      <div aria-hidden="true" className="flex justify-between text-xsmall text-text-secondary tabular-nums">
        <span>{formatValue(low)}</span>
        <span>{formatValue(high)}</span>
      </div>
    </div>
  );
}
