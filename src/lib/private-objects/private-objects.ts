import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

import { getEnv } from "../env";
import { getS3ClientConfig } from "../s3-config";

let privateBucketClient: S3Client | undefined;
const getPrivateBucketClient = (): S3Client => (privateBucketClient ??= new S3Client(getS3ClientConfig()));

/** Phần của dòng `private-files` đủ để dựng key S3 (`prefix` chỉ có khi plugin được cấu hình `prefix`). */
export interface PrivateObjectRef {
  filename?: string | null;
  prefix?: string | null;
}

/** Key thật của object trong bucket private, cùng quy tắc plugin `plugin-cloud-storage` (`prefix/filename`; không prefix thì key = filename). */
export function buildPrivateObjectKey(file: PrivateObjectRef): string {
  const filename = file.filename ?? "";
  return file.prefix ? `${file.prefix.replace(/\/+$/, "")}/${filename}` : filename;
}

/** Phần tên file của key (sau dấu `/` cuối): dùng để tra dòng `private-files` theo `filename` từ key liệt kê trong bucket. */
export const filenameFromObjectKey = (key: string): string => key.slice(key.lastIndexOf("/") + 1);

/**
 * Xoá object khỏi bucket private và NÉM lỗi nếu S3 từ chối. Cần làm tường minh vì hook `afterDelete` của
 * `@payloadcms/plugin-cloud-storage` (3.91.0) nuốt lỗi xoá S3 (chỉ log): dựa vào hook thì DB xoá xong còn object (PII) mồ côi vĩnh viễn.
 * `DeleteObject` idempotent (key không còn vẫn thành công) nên chạy lại và việc plugin xoá thêm lần nữa đều vô hại.
 */
export async function deletePrivateObject(key: string): Promise<void> {
  await getPrivateBucketClient().send(new DeleteObjectCommand({ Bucket: getEnv().S3_BUCKET_PRIVATE, Key: key }));
}

export interface PrivateObjectPage {
  objects: { key: string; lastModified: Date }[];
  nextToken: string | undefined;
}

/** Một trang liệt kê object của bucket private (tối đa 1000 key), lọc theo `prefix` (rỗng = cả bucket). */
export async function listPrivateObjectsPage(prefix: string, continuationToken?: string): Promise<PrivateObjectPage> {
  const response = await getPrivateBucketClient().send(
    new ListObjectsV2Command({ Bucket: getEnv().S3_BUCKET_PRIVATE, Prefix: prefix || undefined, ContinuationToken: continuationToken }),
  );
  const objects = (response.Contents ?? []).flatMap((item) => (item.Key && item.LastModified ? [{ key: item.Key, lastModified: item.LastModified }] : []));
  return { objects, nextToken: response.IsTruncated ? response.NextContinuationToken : undefined };
}
