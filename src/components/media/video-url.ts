export type ParsedVideo = {
  provider: "youtube" | "tiktok";
  id: string;
  /** URL nhúng dựng từ ID đã kiểm, KHÔNG phải URL người dùng nhập: chỉ host YouTube/TikTok trong whitelist. */
  embedUrl: string;
  /** Tỉ lệ khung phát (CSS aspect-ratio). */
  aspectRatio: string;
};

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^\d{8,25}$/;

function youtubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") return url.pathname.split("/")[1] ?? null;
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const [, kind, id] = url.pathname.split("/");
  return kind === "embed" || kind === "shorts" || kind === "live" ? (id ?? null) : null;
}

function tiktokId(url: URL): string | null {
  if (!TIKTOK_HOSTS.has(url.hostname)) return null;
  const segments = url.pathname.split("/");
  // /@user/video/<id> hoặc /embed/v2/<id>. Link rút gọn (vm.tiktok.com) không giải được nếu không gọi mạng nên bị từ chối.
  if (segments[2] === "video") return segments[3] ?? null;
  if (segments[1] === "embed" && segments[2] === "v2") return segments[3] ?? null;
  return null;
}

/** Trả `null` cho mọi thứ ngoài whitelist hoặc ID sai định dạng. Dữ liệu vào là URL nhân viên nhập (không tin cậy). */
export function parseVideoUrl(input: string | null | undefined): ParsedVideo | null {
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const youtube = youtubeId(url);
  if (youtube && YOUTUBE_ID.test(youtube)) {
    return {
      provider: "youtube",
      id: youtube,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0&playsinline=1`,
      aspectRatio: "16/9",
    };
  }
  const tiktok = tiktokId(url);
  if (tiktok && TIKTOK_ID.test(tiktok)) {
    return { provider: "tiktok", id: tiktok, embedUrl: `https://www.tiktok.com/embed/v2/${tiktok}`, aspectRatio: "9/16" };
  }
  return null;
}
