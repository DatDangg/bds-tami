import type { Payload, PayloadRequest } from "payload";

/**
 * Xoá một `private-files` (CV) cùng `req` (transaction của caller). Object S3 do hook `beforeDelete` của collection xoá TRƯỚC và NÉM nếu S3
 * lỗi: lỗi đó nằm trong `errors` của kết quả xoá theo `where` (dòng DB còn nguyên, lần chạy sau thử lại) nên ném lại ở đây.
 * Trả `false` nếu dòng đã không còn (bên khác xử lý trước).
 * Nếu commit của caller lỗi SAU khi object đã xoá, dòng DB còn mà object mất: lần chạy sau xoá lại được (DeleteObject idempotent).
 */
export async function deletePrivateFile(payload: Payload, id: string, req: PayloadRequest): Promise<boolean> {
  const deletion = await payload.delete({ collection: "private-files", where: { id: { equals: id } }, overrideAccess: true, req });
  if (deletion.errors.length > 0) throw new Error("Không xoá được bản ghi private-files");
  return deletion.docs.length > 0;
}
