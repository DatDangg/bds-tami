"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Lightbox } from "@/components/media/Lightbox";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { OptionSelect } from "@/components/ui/option-select";
import type { FloorPlanView } from "@/lib/projects/project-detail-view";
import { cn } from "@/lib/utils";

/** Từ số mặt bằng này trở lên, dưới `md` dùng ô chọn thay cho dải tab (design-spec S03 khối 7). */
const SELECT_MIN_PLANS = 6;

/**
 * Mặt bằng (S03 khối 7): tab theo tên mặt bằng (mẫu ARIA tabs: ← → Home End, tab đang chọn là điểm dừng Tab duy nhất), ảnh 4:3 nền trắng,
 * bấm mở lightbox của cả bộ mặt bằng. ≥ 6 mặt bằng: < md là ô chọn TAMI (hai điều khiển dùng chung một state, chỉ một cái hiện).
 */
export function FloorPlans({ plans }: { plans: FloorPlanView[] }) {
  const t = useTranslations("page.projectDetail.floorPlans");
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = plans[activeIndex] ?? plans[0];
  if (!active) return null;
  const useSelectOnMobile = plans.length >= SELECT_MIN_PLANS;

  function selectTab(index: number) {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent, index: number) {
    const last = plans.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {useSelectOnMobile && (
        <div className="md:hidden">
          <label htmlFor={`${baseId}-select`} className="sr-only">
            {t("select")}
          </label>
          <OptionSelect
            id={`${baseId}-select`}
            value={String(activeIndex)}
            onValueChange={(next) => setActiveIndex(Number(next))}
            options={plans.map((plan, index) => ({ value: String(index), label: plan.title }))}
          />
        </div>
      )}
      <div
        role="tablist"
        aria-label={t("tabs")}
        className={cn("flex gap-2 overflow-x-auto [scrollbar-width:none]", useSelectOnMobile && "hidden md:flex")}
      >
        {plans.map((plan, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={plan.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                "inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-sm border px-5 text-small font-semibold transition-colors duration-(--duration-fast)",
                selected ? "border-text bg-text text-surface" : "border-border bg-surface text-text hover:border-text",
              )}
            >
              {plan.title}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${activeIndex}`} className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          aria-label={t("open", { title: active.title })}
          onClick={(event) => {
            openerRef.current = event.currentTarget;
            setLightboxOpen(true);
          }}
          className="block w-full cursor-zoom-in overflow-hidden rounded-sm bg-surface"
        >
          <ResponsiveImage media={active.image} aspectRatio="4/3" fit="contain" sizes="(min-width: 1024px) 896px, 100vw" />
        </button>
      </div>
      <Lightbox
        images={plans.map((plan) => plan.image)}
        open={lightboxOpen}
        index={activeIndex}
        onOpenChange={setLightboxOpen}
        onIndexChange={setActiveIndex}
        returnFocusRef={openerRef}
      />
    </div>
  );
}
