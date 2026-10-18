// UTM của lead (BR-10): đọc từ URL, giữ ở sessionStorage để vẫn còn khi khách đi qua vài trang rồi mới gửi form. Chỉ chạy phía client.

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
const STORAGE_KEY = "tami.utm";
/** Cùng trần với server (leadUtmSchema cắt 200); cắt sớm để payload nhỏ. */
const MAX_VALUE_CHARS = 200;

export type LeadUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Lấy các tham số `utm_*` không rỗng từ query string; không có cái nào thì `undefined`. */
export function parseUtmFromSearch(search: string): LeadUtm | undefined {
  const params = new URLSearchParams(search);
  const utm: LeadUtm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) utm[key] = value.slice(0, MAX_VALUE_CHARS);
  }
  return Object.keys(utm).length > 0 ? utm : undefined;
}

function readStored(storage: Storage): LeadUtm | undefined {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const utm: LeadUtm = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value) utm[key] = value.slice(0, MAX_VALUE_CHARS);
    }
    return Object.keys(utm).length > 0 ? utm : undefined;
  } catch {
    return undefined;
  }
}

/** Gọi khi form hiện: URL có UTM thì ghi đè bản đã lưu (lượt vào mới nhất là nguồn quảng cáo thật). Storage bị chặn thì bỏ qua. */
export function captureUtm(search: string = window.location.search): void {
  const fromUrl = parseUtmFromSearch(search);
  if (!fromUrl) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    // sessionStorage bị chặn (chế độ riêng tư): vẫn đọc được từ URL lúc gửi.
  }
}

/** UTM tại thời điểm gửi: ưu tiên URL hiện tại, sau đó bản đã lưu. */
export function readUtm(search: string = window.location.search): LeadUtm | undefined {
  const fromUrl = parseUtmFromSearch(search);
  if (fromUrl) return fromUrl;
  try {
    return readStored(window.sessionStorage);
  } catch {
    return undefined;
  }
}
