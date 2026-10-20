"use client";

import { useField } from "@payloadcms/ui";

import { mailtoHref, telHref, zaloNumber } from "@/lib/admin/lead-contact";

/** Nút gọi/Zalo dưới ô SĐT. Chỉ đọc giá trị đã có trong form (không có quyền đọc → không giá trị → không nút); không fetch thêm. */
export function LeadPhoneActions({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  const tel = telHref(value);
  const zalo = zaloNumber(value);
  if (!tel && !zalo) return null;
  return (
    <div className="tami-contact-actions">
      {tel && (
        <a className="tami-contact-action" href={tel}>
          Gọi
        </a>
      )}
      {zalo && (
        <a className="tami-contact-action" href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer">
          Zalo
        </a>
      )}
    </div>
  );
}

/** Nút "Gửi email" dưới ô email (cùng nguyên tắc như `LeadPhoneActions`). */
export function LeadEmailAction({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  const mailto = mailtoHref(value);
  if (!mailto) return null;
  return (
    <div className="tami-contact-actions">
      <a className="tami-contact-action" href={mailto}>
        Gửi email
      </a>
    </div>
  );
}
