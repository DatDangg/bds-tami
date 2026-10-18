import { ValidationError } from "payload";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
  Where,
} from "payload";
import type { PostgresAdapter } from "@payloadcms/db-postgres";

import { ROLES } from "../../access";
import { ADVISORY_LOCK_KEYS } from "../../lib/db/advisory-lock-keys";

/** Khoá advisory của Postgres dùng để tuần tự hoá mọi thay đổi làm giảm số admin (giá trị tuỳ ý, cố định). */
const ADMIN_ROSTER_LOCK_KEY = ADVISORY_LOCK_KEYS.adminRoster;

const LAST_ADMIN_MESSAGE = "Hệ thống phải còn ít nhất một quản trị viên đang hoạt động.";

interface StaffLike {
  role?: string | null;
  active?: boolean | null;
}

const isActiveAdmin = (staff: StaffLike | undefined): boolean =>
  staff?.role === ROLES.admin && staff.active === true;

/**
 * Chờ lấy khoá advisory theo transaction (tự nhả khi commit/rollback). Hai admin cùng lúc hạ quyền nhau sẽ
 * xếp hàng: bên sau đếm sau khi bên trước đã commit, nên không thể cùng thấy "còn người kia" rồi cùng thành
 * công (race làm hệ thống hết admin). Payload luôn mở transaction cho update/delete với Postgres; nhánh
 * không có transaction chỉ là phòng thủ.
 */
async function lockAdminRoster(req: PayloadRequest): Promise<void> {
  const transactionId = await req.transactionID;
  if (!transactionId) return;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = adapter.sessions[String(transactionId)];
  if (!session) return;
  await adapter.execute({ db: session.db, raw: `SELECT pg_advisory_xact_lock(${ADMIN_ROSTER_LOCK_KEY})` });
}

async function assertAnotherActiveAdminExists(
  req: PayloadRequest,
  staffId: string | number,
  errorPath: string,
): Promise<void> {
  await lockAdminRoster(req);
  const { totalDocs } = await req.payload.count({
    collection: "staff",
    where: {
      and: [
        { role: { equals: ROLES.admin } },
        { active: { equals: true } },
        { id: { not_equals: staffId } },
      ],
    },
    overrideAccess: true,
    req,
  });
  if (totalDocs === 0) {
    throw new ValidationError({ collection: "staff", errors: [{ path: errorPath, message: LAST_ADMIN_MESSAGE }] });
  }
}

/**
 * Chặn khoá / hạ quyền admin đang hoạt động cuối cùng. Chạy ở `beforeChange` (TRƯỚC khi ghi DB): ở thao tác
 * bulk của Payload lỗi từng doc chỉ bị gom vào `errors` rồi transaction vẫn commit, nên guard chạy sau khi ghi
 * (afterChange) không ngăn được việc ghi. Khoá advisory giữ tới hết transaction (tức tới sau khi ghi xong),
 * nên bên chờ khoá đếm lại admin sau khi bên kia đã commit.
 * `role`/`active` suy ra từ `data` đè lên `originalDoc` (field không gửi thì giữ giá trị cũ).
 */
export const guardLastAdminOnUpdate: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== "update" || !originalDoc || !isActiveAdmin(originalDoc)) return data;
  const next: StaffLike = {
    role: data.role !== undefined ? data.role : originalDoc.role,
    active: data.active !== undefined ? data.active : originalDoc.active,
  };
  if (!isActiveAdmin(next)) {
    await assertAnotherActiveAdminExists(req, originalDoc.id, next.role === ROLES.admin ? "active" : "role");
  }
  return data;
};

/** Chặn xoá admin đang hoạt động cuối cùng, kiểm tra trước khi xoá. */
export const guardLastAdminOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const target = await req.payload.findByID({ collection: "staff", id, depth: 0, overrideAccess: true, req });
  if (isActiveAdmin(target)) await assertAnotherActiveAdminExists(req, id, "id");
};

/**
 * Bulk (`where`, không `id`) mà chạm tới admin đang hoạt động bị từ chối hẳn: nhiều admin trong cùng một
 * lệnh có thể cùng "thấy" admin kia còn lại rồi cùng bị hạ quyền, nên chỉ cho đi từng người (theo id).
 * Bulk chỉ sửa hồ sơ (không đụng `role`/`active`) hoặc chỉ chạm sale vẫn chạy bình thường.
 */
export const rejectBulkChangeOfActiveAdmins: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "update" && operation !== "delete") return args;
  const bulkArgs = args as { id?: unknown; where?: Where; data?: Record<string, unknown> };
  if (bulkArgs.id !== undefined || !bulkArgs.where) return args;
  const touchesAccessFields =
    operation === "delete" || (bulkArgs.data !== undefined && ("role" in bulkArgs.data || "active" in bulkArgs.data));
  if (!touchesAccessFields) return args;
  const touched = await req.payload.count({
    collection: "staff",
    where: { and: [bulkArgs.where, { role: { equals: ROLES.admin } }, { active: { equals: true } }] },
    overrideAccess: true,
  });
  if (touched.totalDocs > 0) {
    throw new ValidationError({
      collection: "staff",
      errors: [{ path: "where", message: `${LAST_ADMIN_MESSAGE} Sửa/xoá quản trị viên phải làm từng người một.` }],
    });
  }
  return args;
};
