import { getEnv } from "../../lib/env";

const SITE_LINK_LABEL = "Xem website";

/** Nút "Xem website" ở header admin (BL-041, FR-ADM-19): mở website công khai ở tab mới; URL lấy từ `NEXT_PUBLIC_SITE_URL`. */
export function SiteLink() {
  return (
    <a className="tami-admin-site-link" href={getEnv().NEXT_PUBLIC_SITE_URL} target="_blank" rel="noopener noreferrer" aria-label={`${SITE_LINK_LABEL} (mở tab mới)`}>
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2.5h4.5V7M13.5 2.5 7 9M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
      </svg>
      <span className="tami-admin-site-link__text">{SITE_LINK_LABEL}</span>
    </a>
  );
}
