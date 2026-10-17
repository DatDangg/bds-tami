"use client";

import { useTranslations } from "next-intl";
import { Switch } from "radix-ui";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface ConsentPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Giá trị hiện tại của mục Phân tích khi mở dialog. */
  analytics: boolean;
  onSave: (analytics: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

// Ô switch cao 28px; `after:-inset-y-2` nới vùng chạm lên 44px.
const SWITCH_ROOT =
  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-input p-0.5 transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-60";
const SWITCH_THUMB = "block size-6 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-5";

/** Dialog "Tuỳ chọn" (design-spec §3.10): Cần thiết luôn bật (disabled) · Phân tích (switch). Modal chuẩn: Radix lo bẫy focus, Esc, trả focus. */
export function ConsentPreferences({ open, onOpenChange, analytics, onSave, onCloseAutoFocus }: ConsentPreferencesProps) {
  const t = useTranslations("layout.consent");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")} onCloseAutoFocus={onCloseAutoFocus}>
        {/* Form chỉ dựng khi mở: mỗi lần mở lấy lại giá trị đã lưu, bỏ thay đổi dở của lần trước. */}
        {open && <PreferencesForm initialAnalytics={analytics} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function PreferencesForm({ initialAnalytics, onSave }: { initialAnalytics: boolean; onSave: (analytics: boolean) => void }) {
  const t = useTranslations("layout.consent");
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const necessaryId = useId();
  const analyticsId = useId();
  return (
    <>
      <DialogTitle>{t("preferencesTitle")}</DialogTitle>
      <DialogDescription>{t("preferencesDescription")}</DialogDescription>
      <ul className="flex flex-col divide-y divide-border">
        <PreferenceRow id={necessaryId} title={t("necessaryTitle")} description={t("necessaryDescription")}>
          <Switch.Root id={necessaryId} checked disabled aria-describedby={`${necessaryId}-desc`} className={SWITCH_ROOT}>
            <Switch.Thumb className={SWITCH_THUMB} />
          </Switch.Root>
        </PreferenceRow>
        <PreferenceRow id={analyticsId} title={t("analyticsTitle")} description={t("analyticsDescription")}>
          <Switch.Root
            id={analyticsId}
            checked={analytics}
            onCheckedChange={setAnalytics}
            aria-describedby={`${analyticsId}-desc`}
            className={SWITCH_ROOT}
          >
            <Switch.Thumb className={SWITCH_THUMB} />
          </Switch.Root>
        </PreferenceRow>
      </ul>
      <Button onClick={() => onSave(analytics)}>{t("save")}</Button>
    </>
  );
}

function PreferenceRow({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <li className="flex min-h-11 items-start justify-between gap-4 py-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-body font-semibold text-text">
          {title}
        </label>
        <p id={`${id}-desc`} className="text-small text-text-secondary">
          {description}
        </p>
      </div>
      {children}
    </li>
  );
}
