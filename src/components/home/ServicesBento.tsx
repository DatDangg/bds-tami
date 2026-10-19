import { useId } from "react";
import { ServiceCard } from "@/components/services/ServiceCard";
import type { ServiceCardData } from "@/lib/services/service-view";
import { cn } from "@/lib/utils";

/** Khung từng thẻ theo số mục (design-spec S01.4): 1 → ngang 21:9 · 2 → 7/5 · 3 → bento (lớn cao 2 hàng + 2 nhỏ) · ≥ 4 → hàng cuộn ngang. */
const BENTO_THREE = [
  { item: "lg:col-span-7 lg:row-span-2", card: "aspect-[4/3] lg:aspect-auto lg:h-full" },
  { item: "lg:col-span-5", card: "aspect-[4/3]" },
  { item: "md:col-span-2 lg:col-span-5", card: "aspect-[4/3] md:aspect-[21/9] lg:aspect-[4/3]" },
] as const;
const PAIR = [
  { item: "md:col-span-7", card: "aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]" },
  { item: "md:col-span-5", card: "aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]" },
] as const;

function Cards({ items, labelledBy }: { items: ServiceCardData[]; labelledBy: string }) {
  if (items.length >= 4) {
    return (
      <ul tabIndex={0} aria-labelledby={labelledBy} className="-mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-2 [scroll-padding-inline:var(--spacing-gutter)] md:gap-6">
        {items.map((item) => (
          <li key={item.id} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[30%]">
            <ServiceCard data={item} />
          </li>
        ))}
      </ul>
    );
  }
  const frames = items.length === 3 ? BENTO_THREE : items.length === 2 ? PAIR : null;
  const gridClass = items.length === 3 ? "md:grid-cols-2 lg:grid-cols-12" : items.length === 2 ? "md:grid-cols-12" : "";
  return (
    <ul className={cn("grid gap-4 md:gap-6", gridClass)}>
      {items.map((item, position) => (
        <li key={item.id} className={cn("flex", frames?.[position]?.item)}>
          <ServiceCard data={item} className={cn("w-full", frames?.[position]?.card ?? "aspect-[4/3] md:aspect-[21/9]")} />
        </li>
      ))}
    </ul>
  );
}

/** Dịch vụ dạng bento bất đối xứng (design-spec S01.4), tiêu đề căn trái. Mỗi thẻ là MỘT link tới trang dịch vụ. Server Component. */
export function ServicesBento({ title, items }: { title: string; items: ServiceCardData[] }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="bg-bg py-section">
      <div className="mx-auto w-full max-w-container px-gutter">
        <h2 id={headingId} className="mb-10 font-display text-h2">
          {title}
        </h2>
        <Cards items={items} labelledBy={headingId} />
      </div>
    </section>
  );
}
