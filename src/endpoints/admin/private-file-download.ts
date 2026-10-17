import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Endpoint, PayloadRequest } from "payload";

import { isAdmin } from "@/access";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getEnv } from "@/lib/env";
import { buildAttachmentDisposition } from "@/lib/http/content-disposition";
import { fail } from "@/lib/http/response";
import { logger } from "@/lib/logger";
import { getS3ClientConfig } from "@/lib/s3-config";

const log = logger.child({ component: "private-file-download" });

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIME_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;
const FALLBACK_MIME = "application/octet-stream";

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  contentLength?: number;
}

/** Mở stream đối tượng trong bucket private; `null` khi không có object. Tách ra để test thay thế được. */
export type OpenPrivateObject = (key: string) => Promise<StoredObject | null>;

let s3Client: S3Client | undefined;

const openFromS3: OpenPrivateObject = async (key) => {
  s3Client ??= new S3Client(getS3ClientConfig());
  try {
    const result = await s3Client.send(new GetObjectCommand({ Bucket: getEnv().S3_BUCKET_PRIVATE, Key: key }));
    if (!result.Body) return null;
    return { body: result.Body.transformToWebStream(), contentLength: result.ContentLength };
  } catch (error) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return null;
    throw error;
  }
};

/** Khoá object = `_objectKey` (thư mục do plugin lưu, nếu có) + tên file. Khoá có `..` hoặc rỗng thì coi như không có file. */
function resolveObjectKey(doc: { filename?: string | null; _objectKey?: string | null }): string | null {
  const filename = doc.filename;
  if (!filename) return null;
  const folder = (doc._objectKey ?? "").replace(/^\/+|\/+$/g, "");
  const key = folder ? `${folder}/${filename}` : filename;
  return key.split("/").includes("..") ? null : key;
}

/**
 * Thứ tự (PERMISSION §5): đăng nhập + tài khoản còn hoạt động (401) -> admin (403) -> id đúng UUID (400) -> có bản ghi (404)
 * -> mở object -> ghi audit `application.view_cv` -> stream. Audit fail-closed: ghi lỗi thì huỷ stream và trả 500, không
 * có lượt tải nào không để lại dấu vết. Audit chỉ có id file (không tên/email ứng viên).
 */
export async function handlePrivateFileDownload(
  req: PayloadRequest,
  fileId: string | undefined,
  openObject: OpenPrivateObject = openFromS3,
): Promise<Response> {
  if (!req.user || req.user.active !== true) return fail(401, "Chưa đăng nhập");
  if (!isAdmin({ req })) return fail(403, "Không có quyền");
  if (!fileId || !UUID_PATTERN.test(fileId)) return fail(400, "Mã file không hợp lệ");

  const found = await req.payload.find({
    collection: "private-files",
    where: { id: { equals: fileId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = found.docs[0];
  const key = doc && resolveObjectKey(doc);
  if (!doc || !key) return fail(404, "Không tìm thấy file");

  const stored = await openObject(key);
  if (!stored) return fail(404, "Không tìm thấy file");
  try {
    await writeAuditLog({
      actor: req.user,
      action: "application.view_cv",
      collection: "private-files",
      docId: doc.id,
      summary: "Tải CV ứng viên",
      req,
    });
  } catch (error) {
    await stored.body.cancel().catch(() => undefined);
    log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "không ghi được audit tải CV, huỷ lượt tải");
    return fail(500, "Không thể tải file");
  }

  const headers = new Headers({
    "Content-Type": doc.mimeType && MIME_PATTERN.test(doc.mimeType) ? doc.mimeType : FALLBACK_MIME,
    "Content-Disposition": buildAttachmentDisposition(doc.filename),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  if (stored.contentLength !== undefined) headers.set("Content-Length", String(stored.contentLength));
  return new Response(stored.body, { status: 200, headers });
}

export const privateFileDownloadEndpoint: Endpoint = {
  path: "/admin/private-files/:id/download",
  method: "get",
  handler: async (req) => {
    try {
      return await handlePrivateFileDownload(req, req.routeParams?.id as string | undefined);
    } catch (error) {
      log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "tải file private thất bại");
      return fail(500, "Không thể tải file");
    }
  },
};
