import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DOCUMENTS_DOM_ID, type DocumentView } from "@/lib/projects/project-detail-view";
import { ProjectSection } from "./ProjectSection";

/**
 * Tài liệu dự án (S03 khối 10): mỗi file PDF một hàng (tên, "PDF · dung lượng") và nút "Tải tài liệu" là link thật mở TAB MỚI
 * (`target="_blank"` + `rel="noopener noreferrer"`: trang PDF không giữ `window.opener`). Nhãn đọc màn hình chứa tên file để
 * nhiều nút cùng chữ "Tải tài liệu" vẫn phân biệt được. Không có tài liệu thì không render khối. Server Component.
 */
export function Documents({ documents }: { documents: DocumentView[] }) {
  const t = useTranslations("page.projectDetail");
  if (documents.length === 0) return null;
  return (
    <ProjectSection id={DOCUMENTS_DOM_ID} title={t("documents.title")}>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-surface px-5">
        {documents.map((file) => (
          <li key={file.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="font-semibold break-words">{file.name}</p>
              <p className="text-small text-text-muted">{[t("documents.pdf"), file.sizeLabel].filter(Boolean).join(" · ")}</p>
            </div>
            <Button asChild variant="dark" className="w-full sm:w-auto">
              <a href={file.href} target="_blank" rel="noopener noreferrer" aria-label={t("documents.downloadNamed", { name: file.name })}>
                {t("documents.download")}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </ProjectSection>
  );
}
