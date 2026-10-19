"use client";

import Link from "next/link";
import { useAuth } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import { COLLECTION_LABELS, GLOBAL_LABELS } from "@/lib/translation/admin-ui";

export interface FailedGroup {
  slug: string;
  label: string;
  href: string;
  count: number;
  overBudget: boolean;
}

interface TranslationFields {
  translation?: { lastError?: string | null };
}

const MAX_SAMPLE = 50;
const BUDGET_CODE = "budget_exceeded";

async function failedInCollection(slug: string): Promise<FailedGroup | null> {
  const query = `where[translation.status][equals]=failed&limit=${MAX_SAMPLE}&depth=0&select[translation]=true`;
  const response = await fetch(`/api/${slug}?${query}`, { credentials: "same-origin" });
  if (!response.ok) return null;
  const body = (await response.json()) as { totalDocs?: number; docs?: TranslationFields[] };
  const count = body.totalDocs ?? 0;
  if (count === 0) return null;
  const overBudget = (body.docs ?? []).some((doc) => doc.translation?.lastError === BUDGET_CODE);
  return { slug, label: COLLECTION_LABELS[slug] ?? slug, count, overBudget, href: `/admin/collections/${slug}?where[and][0][translation.status][equals]=failed` };
}

async function failedGlobal(slug: string): Promise<FailedGroup | null> {
  const response = await fetch(`/api/globals/${slug}?depth=0&select[translation]=true`, { credentials: "same-origin" });
  if (!response.ok) return null;
  const body = (await response.json()) as { translation?: { status?: string | null; lastError?: string | null } };
  if (body.translation?.status !== "failed") return null;
  return { slug, label: GLOBAL_LABELS[slug] ?? slug, count: 1, overBudget: body.translation.lastError === BUDGET_CODE, href: `/admin/globals/${slug}` };
}

/** Tìm mọi nội dung `failed` (gồm lỗi vượt hạn mức, vì job ghi `failed` + `lastError = budget_exceeded`); một nguồn tra cứu lỗi chỉ bị bỏ qua, không làm hỏng cả banner. */
export async function findFailedTranslations(): Promise<FailedGroup[]> {
  const results = await Promise.all([
    ...Object.keys(COLLECTION_LABELS).map((slug) => failedInCollection(slug).catch(() => null)),
    ...Object.keys(GLOBAL_LABELS).map((slug) => failedGlobal(slug).catch(() => null)),
  ]);
  return results.filter((group): group is FailedGroup => group !== null);
}

/** Cảnh báo ở trang tổng quan admin (FR-ADM-17): có bài dịch lỗi hoặc vượt hạn mức dịch. Chỉ admin thấy (admin xử lý hạn mức và cấu hình dịch). */
export function TranslationFailedBanner() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FailedGroup[]>([]);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void findFailedTranslations().then((found) => {
      if (!cancelled) setGroups(found);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin || groups.length === 0) return null;
  const overBudget = groups.some((group) => group.overBudget);
  return (
    // Style: .tami-admin-alert trong src/components/admin/styles/_surfaces.scss (tone danger, token BL-015).
    <div role="alert" className="tami-admin-alert tami-admin-alert--danger">
      <strong>{overBudget ? "Dịch tự động bị dừng do vượt hạn mức tháng." : "Có nội dung dịch lỗi."}</strong>
      <ul className="tami-admin-alert__list">
        {groups.map((group) => (
          <li key={group.slug}>
            <Link href={group.href} prefetch={false}>
              {group.label}: {group.count} nội dung dịch lỗi
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
