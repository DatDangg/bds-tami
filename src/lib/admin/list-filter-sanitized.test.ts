import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type Field } from "payload";
import { describe, expect, it } from "vitest";

import { hideTechnicalListFields } from "./list-filter";
import { Media } from "../../collections/Media";
import { PrivateFiles } from "../../collections/PrivateFiles";
import { Staff } from "../../collections/Staff";

/** Cùng quy tắc `filterFields` của @payloadcms/ui: nút có `disableListColumn` bị bỏ cả cây; trả đường dẫn các cột còn hiện. */
function visibleColumns(fields: Field[], prefix = ""): string[] {
  return fields.flatMap((field): string[] => {
    const admin = "admin" in field ? (field.admin as { disableListColumn?: boolean } | undefined) : undefined;
    if (admin?.disableListColumn || ("hidden" in field && field.hidden)) return [];
    if (field.type === "row" || field.type === "collapsible") return visibleColumns(field.fields, prefix);
    const path = `${prefix}${"name" in field ? field.name : ""}`;
    if (field.type === "group") return visibleColumns(field.fields, `${path}.`);
    return [path];
  });
}

describe("Media/PrivateFiles sau plugin S3 + sanitize (config thật)", () => {
  it("menu cột chỉ còn trường nghiệp vụ, không có url/sizes/…", async () => {
    const config = await buildConfig({
      secret: "test-secret",
      db: postgresAdapter({ pool: { connectionString: "postgres://x:x@localhost:1/x" } }),
      collections: [Staff, hideTechnicalListFields(Media), hideTechnicalListFields(PrivateFiles)],
      plugins: [
        s3Storage({ bucket: "pub", config: { region: "x" }, collections: { media: true } }),
        s3Storage({ bucket: "priv", config: { region: "x" }, collections: { "private-files": { disablePayloadAccessControl: true, generateFileURL: () => "" } } }),
      ],
    });
    const media = config.collections.find((collection) => collection.slug === "media")!;
    const privateFiles = config.collections.find((collection) => collection.slug === "private-files")!;
    const mediaColumns = visibleColumns(media.fields);
    expect(mediaColumns.filter((column) => /^(url|thumbnailURL|filesize|width|height|sizes|focalX|focalY|prefix|_objectKey)/.test(column))).toEqual([]);
    expect(mediaColumns).toEqual(expect.arrayContaining(["filename", "mimeType", "alt"]));
    expect(visibleColumns(privateFiles.fields).filter((column) => /^(url|thumbnailURL|filesize|width|height|prefix|_objectKey)/.test(column))).toEqual([]);
  });
});
