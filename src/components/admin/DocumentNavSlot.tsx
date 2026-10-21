import { getEnv } from "../../lib/env";
import { DocumentNavLinks } from "./DocumentNavLinks";

/** Phần server của slot `beforeDocumentControls` (BL-051 A7): chỉ để đọc `NEXT_PUBLIC_SITE_URL` qua `getEnv()` (cùng nguồn với `SiteLink`) rồi giao cho phần client. */
export function DocumentNavSlot() {
  return <DocumentNavLinks siteUrl={getEnv().NEXT_PUBLIC_SITE_URL} />;
}
