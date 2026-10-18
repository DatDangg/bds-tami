import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Payload, PayloadRequest } from "payload";

import { getEnv } from "../env";
import { getS3ClientConfig } from "../s3-config";

let privateBucketClient: S3Client | undefined;
const getPrivateBucketClient = (): S3Client => (privateBucketClient ??= new S3Client(getS3ClientConfig()));

/**
 * Xoá object khỏi bucket private và NÉM lỗi nếu S3 từ chối. Cần làm tường minh vì hook `afterDelete` của
 * `@payloadcms/plugin-cloud-storage` (3.91.0) nuốt lỗi xoá S3 (chỉ log): dựa vào hook thì DB xoá xong còn object (PII) mồ côi vĩnh viễn.
 * `DeleteObject` idempotent (key không còn vẫn thành công) nên chạy lại và việc plugin xoá thêm lần nữa đều vô hại.
 */
async function deletePrivateObject(key: string): Promise<void> {
  await getPrivateBucketClient().send(new DeleteObjectCommand({ Bucket: getEnv().S3_BUCKET_PRIVATE, Key: key }));
}

/**
 * Xoá một `private-files` (CV; không có prefix, key = `filename`): object S3 TRƯỚC (lỗi S3 → ném, dòng DB còn nguyên, lần chạy sau thử lại), rồi dòng DB cùng `req`
 * (transaction của caller). Trả `false` nếu dòng đã không còn (bên khác xử lý trước).
 * Nếu commit của caller lỗi SAU khi object đã xoá, dòng DB còn mà object mất: lần chạy sau xoá lại được (DeleteObject idempotent).
 */
export async function deletePrivateFile(payload: Payload, id: string, req: PayloadRequest): Promise<boolean> {
  const file = await payload.findByID({ collection: "private-files", id, depth: 0, overrideAccess: true, req, disableErrors: true });
  if (!file) return false;
  if (typeof file.filename === "string" && file.filename !== "") {
    await deletePrivateObject(file.filename);
  }
  const deletion = await payload.delete({ collection: "private-files", where: { id: { equals: id } }, overrideAccess: true, req });
  if (deletion.errors.length > 0) throw new Error("Không xoá được bản ghi private-files");
  return deletion.docs.length > 0;
}
