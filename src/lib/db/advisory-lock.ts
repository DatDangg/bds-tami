import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type PayloadRequest } from "payload";

/**
 * Lấy khoá advisory Postgres theo transaction của `req` (tự nhả khi commit/rollback): các lần chạy chồng nhau của cùng một job xếp hàng,
 * bên sau đọc lại dữ liệu SAU KHI bên trước đã commit nên không xử lý trùng. Ném lỗi (fail-closed) nếu `req` chưa có transaction:
 * không có khoá thì không được đi tiếp với thao tác không hoàn tác được.
 */
export async function lockForTransaction(req: PayloadRequest, lockKey: number): Promise<void> {
  if (!Number.isSafeInteger(lockKey)) throw new Error("Khoá advisory phải là số nguyên");
  const transactionId = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  if (!session) throw new Error("Cần transaction đang mở để lấy khoá advisory");
  await adapter.execute({ db: session.db, raw: `SELECT pg_advisory_xact_lock(${lockKey})` });
}

/**
 * Chạy `work` trong MỘT transaction mới, sau khi đã giữ khoá `lockKey`; commit khi xong, rollback khi lỗi.
 * `work` phải đọc lại bản ghi cần xử lý bên trong (dùng `req` truyền vào) vì giữa lúc chọn ứng viên và lúc giữ khoá, bên khác có thể đã xử lý.
 */
export async function runInLockedTransaction<T>(payload: Payload, lockKey: number, work: (req: PayloadRequest) => Promise<T>): Promise<T> {
  const req = await createLocalReq({}, payload);
  const ownsTransaction = await initTransaction(req);
  try {
    await lockForTransaction(req, lockKey);
    const result = await work(req);
    if (ownsTransaction) await commitTransaction(req);
    return result;
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
}
