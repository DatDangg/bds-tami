import type { PayloadRequest } from "payload";

/** Đối số tối thiểu mà các hàm access cần: chỉ `req.user`. Khớp cả Access collection lẫn FieldAccess. */
export interface UserArgs {
  req: Pick<PayloadRequest, "user">;
}
