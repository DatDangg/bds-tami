"use client";

import { useConfig, useDocumentInfo, useLocale } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/** Đường dẫn field Payload (`faqs.0.question`) → giá trị trong JSON bản ghi. */
function readPath(doc: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), doc);
}

/** Một bản tiếng Việt cho cả form: mọi ô dùng chung 1 request (khoá theo URL + `updatedAt`, lưu lại thì tải mới). */
const cache = new Map<string, Promise<unknown>>();

function loadVietnamese(url: string): Promise<unknown> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
    cache.set(url, pending);
  }
  return pending;
}

/** BL-133: dưới ô chữ có bản dịch, khi đang sửa bản tiếng Anh, hiện câu tiếng Việt gốc để đối chiếu. Chỉ đọc. */
export function ViSourceHint({ path }: { path: string }) {
  const { code: locale } = useLocale();
  const { config } = useConfig();
  const { collectionSlug, globalSlug, id, savedDocumentData } = useDocumentInfo();
  const [loaded, setLoaded] = useState<{ url: string; text: string | null } | null>(null);
  const version = String((savedDocumentData as { updatedAt?: unknown } | undefined)?.updatedAt ?? "");
  const base = config.routes.api;
  const url = locale !== "en" ? null : globalSlug ? `${base}/globals/${globalSlug}?locale=vi&depth=0&draft=true&v=${version}` : collectionSlug && id ? `${base}/${collectionSlug}/${id}?locale=vi&depth=0&draft=true&v=${version}` : null;

  useEffect(() => {
    if (!url) return;
    let alive = true;
    void loadVietnamese(url).then((doc) => {
      const value = readPath(doc, path);
      if (alive) setLoaded({ url, text: typeof value === "string" && value.trim() ? value : null });
    });
    return () => {
      alive = false;
    };
  }, [url, path]);

  const text = url && loaded?.url === url ? loaded.text : null;
  if (!text) return null;
  return (
    <p className="field-description tami-vi-source">
      <span className="tami-vi-source__label">Bản tiếng Việt:</span> {text}
    </p>
  );
}
