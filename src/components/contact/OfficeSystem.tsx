"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { ArrowRight, EnvelopeSimple, MapPin, Phone } from "@/components/icons";
import { LazyMap } from "@/components/media/LazyMap";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { OfficeView } from "@/lib/content/contact-view";
import { cn } from "@/lib/utils";

const TAB_CLASS = "inline-flex min-h-11 items-center rounded-pill border px-5 text-small font-semibold transition-colors duration-(--duration-fast)";
const LINE_LINK_CLASS = "inline-flex min-h-11 items-center gap-2 break-all text-small text-text-secondary transition-colors hover:text-accent-text lg:min-h-8";

function OfficeCard({ office }: { office: OfficeView }) {
  const t = useTranslations("page.contact.v2");
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface sm:flex-row">
      {office.image && (
        <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:w-40 md:w-48">
          <ResponsiveImage media={office.image} sizes="(min-width: 640px) 12rem, 100vw" decorative className="absolute inset-0" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-h4 font-semibold text-text">{office.name}</h3>
          {office.directionsUrl && (
            <a
              href={office.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("directionsAria", { name: office.name })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-border px-4 text-small font-semibold text-accent-text transition-colors hover:border-accent-text lg:min-h-9"
            >
              {t("directions")}
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          )}
        </div>
        {office.address && (
          <p className="flex items-start gap-2 text-small text-text-secondary">
            <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            <span className="sr-only">{t("address")}: </span>
            {office.address}
          </p>
        )}
        {(office.phone || office.email) && (
          <div className="flex flex-wrap gap-x-6">
            {office.phone && (
              <a href={office.phone.telHref} className={LINE_LINK_CLASS}>
                <Phone size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
                <span className="sr-only">{t("phone")}: </span>
                {office.phone.label}
              </a>
            )}
            {office.email && (
              <a href={`mailto:${office.email}`} className={LINE_LINK_CLASS}>
                <EnvelopeSimple size={18} aria-hidden="true" className="shrink-0 text-accent-text" />
                <span className="sr-only">{t("email")}: </span>
                {office.email}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * "Hệ thống văn phòng" trang Liên hệ (BL-054, design `lien-he`): tab chi nhánh (mẫu ARIA tabs: ←/→ vòng, Home/End, roving tabindex; ẩn khi chỉ 1 văn phòng)
 * → bản đồ lười của văn phòng đang chọn (`LazyMap`; văn phòng không có toạ độ thì không có bản đồ) → thẻ văn phòng (ảnh, tên, địa chỉ, `tel:`, `mailto:`, "Chỉ đường" tab mới).
 * Một panel duy nhất (bản đồ dùng lại khi đổi tab). Không có văn phòng → không render.
 */
export function OfficeSystem({ offices }: { offices: readonly OfficeView[] }) {
  const t = useTranslations("page.contact.v2");
  const uid = useId();
  const headingId = `${uid}-heading`;
  const panelId = `${uid}-panel`;
  const [activeId, setActiveId] = useState(offices[0]?.id ?? "");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = offices.find((office) => office.id === activeId) ?? offices[0];
  if (!active) return null;
  const hasTabs = offices.length > 1;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = offices.length - 1;
    const index = Math.max(0, offices.findIndex((office) => office.id === active.id));
    const nextIndex = { ArrowRight: (index + 1) % offices.length, ArrowLeft: (index + last) % offices.length, Home: 0, End: last }[event.key];
    const next = nextIndex === undefined ? undefined : offices[nextIndex];
    if (!next) return;
    event.preventDefault();
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5 rounded-xl bg-surface p-5 shadow-md md:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 id={headingId} className="font-display text-h3 text-text">
          {t("officesTitle")}
        </h2>
        {hasTabs && <p className="text-small text-text-secondary">{t("officesDescription")}</p>}
      </div>
      {hasTabs && (
        <div role="tablist" aria-label={t("officesTabs")} className="flex flex-wrap gap-2">
          {offices.map((office) => {
            const selected = office.id === active.id;
            return (
              <button
                key={office.id}
                ref={(node) => {
                  tabRefs.current[office.id] = node;
                }}
                type="button"
                role="tab"
                id={tabId(office.id)}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(office.id)}
                onKeyDown={onTabKeyDown}
                className={cn(TAB_CLASS, selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-text hover:border-text")}
              >
                {office.name}
              </button>
            );
          })}
        </div>
      )}
      <div id={panelId} role={hasTabs ? "tabpanel" : undefined} aria-labelledby={hasTabs ? tabId(active.id) : undefined} className="flex flex-col gap-4">
        {active.location && (
          <LazyMap location={active.location} label={t("mapLabel", { name: active.name })} aspectRatio="16/9" showGoogleMapsLink={false} className="[&>[role=region]]:rounded-lg" />
        )}
        <OfficeCard office={active} />
      </div>
    </section>
  );
}
