import type { PayloadRequest } from "payload";

/**
 * Local API ghi đè `req.locale` / `req.fallbackLocale` của request được truyền vào (`createLocalReq`), nên một
 * hook gọi `payload.find*({ locale, req })` sẽ làm đổi ngôn ngữ của phần còn lại của thao tác đang chạy.
 * Bọc lời gọi đó bằng hàm này để khôi phục sau khi đọc xong (vẫn dùng chung `req` để nằm trong transaction).
 */
export async function preserveRequestLocale<T>(req: PayloadRequest, read: () => Promise<T>): Promise<T> {
  const { locale, fallbackLocale } = req;
  try {
    return await read();
  } finally {
    req.locale = locale;
    req.fallbackLocale = fallbackLocale;
  }
}
