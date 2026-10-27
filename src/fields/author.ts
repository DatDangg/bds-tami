import type { FieldHook, RelationshipField, TextField } from "payload";

import { denyAll, isAdmin, isStaff } from "../access";

/** Tự gán người tạo khi chưa có `author` (Local API không user, như seed, thì giữ nguyên và để `required` báo). */
const defaultToCreator: FieldHook = ({ value, operation, req }) => {
  if (operation === "create" && !value && req.user) return req.user.id;
  return value;
};

/**
 * Tên hiển thị của người tạo (`fullName`, thiếu thì email) cho cột danh sách + ô "Người tạo" ở form (BL-082).
 * Sale không đọc được hồ sơ staff khác (`Staff.read = selfOrAdmin`) nên cột/ô quan hệ mặc định chỉ hiện "Chưa đặt tên - ID";
 * trả sẵn tên trong dữ liệu dòng thì khỏi request client-side tới `/api/staff`. Chỉ lộ tên/email, và CHỈ khi người gọi là staff đang hoạt động:
 * Local API mặc định `overrideAccess: true` bỏ qua `access.read` của field nên hook tự chặn khách (không `req.user`) — trang công khai không bao giờ nhận tên staff.
 * Tra cứu `overrideAccess` + `select` tối thiểu; kết quả nhớ trong `req.context` để danh sách nhiều dòng cùng người tạo chỉ tốn 1 truy vấn.
 */
const computeAuthorName: FieldHook = async ({ siblingData, data, originalDoc, req }) => {
  if (req.user?.active !== true) return undefined;
  const author = (siblingData ?? data ?? originalDoc)?.author;
  if (!author) return null;
  if (typeof author === "object") return author.fullName || author.email || null;
  // Lưu Promise (không phải giá trị): Payload chạy afterRead của các dòng song song, cache giá trị đã resolve thì mọi dòng đều miss → N+1.
  const cache = (req.context.authorName ??= new Map<string, Promise<string | null>>()) as Map<string, Promise<string | null>>;
  let pending = cache.get(author);
  if (!pending) {
    pending = req.payload
      .findByID({ collection: "staff", id: author, depth: 0, overrideAccess: true, req, select: { fullName: true, email: true }, disableErrors: true })
      .then((staff) => staff?.fullName || staff?.email || null);
    // Lỗi tra cứu không được kẹt trong cache cả request: bỏ mục rồi để lỗi nổi lên như trước.
    pending.catch(() => cache.delete(author));
    cache.set(author, pending);
  }
  return pending;
};

/** `author` (PERMISSION §4): tự gán người tạo; chỉ admin đổi. Sale gửi giá trị khác bị bỏ qua. */
export function authorField(): RelationshipField {
  return {
    name: "author",
    type: "relationship",
    label: "Người tạo",
    relationTo: "staff",
    required: true,
    index: true,
    // Điền sẵn người đang đăng nhập khi mở form tạo mới (BL-042). Là hàm nên KHÔNG thành DEFAULT ở DB (drizzle bỏ qua defaultValue hàm).
    defaultValue: ({ user }) => user?.id,
    access: { create: isAdmin, update: isAdmin },
    hooks: { beforeChange: [defaultToCreator] },
    admin: {
      position: "sidebar",
      components: { Cell: "/components/admin/AuthorCell#AuthorCell", Field: "/components/admin/AuthorField#AuthorField" },
    },
  };
}

/** Field ảo đi kèm `author` (xem `computeAuthorName`): không lưu DB, chỉ staff đọc, không ai ghi; nằm trong form state nhưng không vẽ ra. */
export function authorNameField(): TextField {
  return {
    name: "authorName",
    type: "text",
    label: "Tên người tạo",
    virtual: true,
    hooks: { afterRead: [computeAuthorName] },
    access: { read: isStaff, create: denyAll, update: denyAll },
    admin: {
      readOnly: true,
      position: "sidebar",
      disableListColumn: true,
      disableListFilter: true,
      disableBulkEdit: true,
      components: { Field: "/components/admin/LeadFormDisplay#LeadHiddenField" },
    },
  };
}
