import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "../../../src/collections/AuditLogs";
import { Categories } from "../../../src/collections/Categories";
import { JobApplications } from "../../../src/collections/JobApplications";
import { createJobPostings } from "../../../src/collections/JobPostings";
import { Media } from "../../../src/collections/Media";
import { PrivateFiles } from "../../../src/collections/PrivateFiles";
import { Provinces } from "../../../src/collections/Provinces";
import { Staff } from "../../../src/collections/Staff";
import type { RevalidatePaths } from "../../../src/hooks/revalidate-content";

/** Config test cho tuyển dụng: collection THẬT `job-postings` + `job-applications` + `categories`/`provinces`/`private-files`; `push: true` chỉ trên DB tạm. */
export function buildJobPostingsTestConfig(databaseUrl: string, revalidatePaths: RevalidatePaths) {
  return buildConfig({
    secret: "test-job-postings-secret-khong-dung-o-production",
    collections: [Staff, Media, PrivateFiles, AuditLogs, Categories, Provinces, createJobPostings(revalidatePaths), JobApplications],
    editor: lexicalEditor(),
    sharp,
    localization: { locales: ["vi", "en"], defaultLocale: "vi", fallback: false },
    db: postgresAdapter({ pool: { connectionString: databaseUrl }, idType: "uuid", push: true }),
  });
}
