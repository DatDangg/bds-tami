import { revalidatePath } from "next/cache";

import { getEnv } from "@/lib/env";
import { handleInternalRevalidate } from "@/lib/revalidate/internal-revalidate";

// Route tĩnh `/api/internal/revalidate` được Next ưu tiên hơn catch-all `/api/[...slug]` của Payload.
export const dynamic = "force-dynamic";

/**
 * Cho job (process `jobs`, ngoài Next) làm mới cache trang công khai. Chỉ nhận Bearer token dẫn xuất từ `PAYLOAD_SECRET` và chỉ đường dẫn
 * `/{vi|en}...`; Nginx không proxy `/api/internal/` ra Internet (xem `lib/revalidate/internal-revalidate.ts`).
 */
export async function POST(request: Request): Promise<Response> {
  return handleInternalRevalidate(request, { secret: getEnv().PAYLOAD_SECRET, revalidate: (path) => revalidatePath(path) });
}
