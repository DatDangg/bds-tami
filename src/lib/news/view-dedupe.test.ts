import { describe, expect, it, vi } from "vitest";

import {
  claimDailyView,
  isBotUserAgent,
  isPrefetchRequest,
  secondsUntilVietnamDayEnd,
  viewDedupeKey,
  ViewDedupeUnavailableError,
  vietnamDayStart,
} from "./view-dedupe";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const ZALO_IN_APP =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 Zalo android/12100727 ZaloTheme/light ZaloLanguage/vi";
const MESSENGER_IN_APP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/500.0.0.40.97;FBBV/700000000;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBCR/;FBID/phone;FBLC/vi_VN;FBOP/5]";
const CUBOT_PHONE =
  "Mozilla/5.0 (Linux; Android 13; CUBOT KINGKONG 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const SLACK_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Slack/4.41.105 Chrome/128.0.6613.186 Electron/32.2.5 Safari/537.36 Sonic Slack_SSB/4.41.105";

describe("isBotUserAgent", () => {
  it.each([
    ["UA rỗng", ""],
    ["UA chỉ khoảng trắng", "   "],
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
    ["Coc Coc bot", "Mozilla/5.0 (compatible; coccocbot-web/1.0; +http://help.coccoc.com/searchengine)"],
    ["AhrefsBot", "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)"],
    ["GPTBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)"],
    ["Bytespider", "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)"],
    ["Yahoo Slurp", "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)"],
    ["Chrome headless", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36"],
    ["Lighthouse", `${CHROME} Chrome-Lighthouse`],
    ["PageSpeed", "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Google Page Speed Insights"],
    ["xem trước link Facebook", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
    ["xem trước link Telegram", "TelegramBot (like TwitterBot)"],
    ["xem trước link Slack", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"],
    ["xem trước link Discord", "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"],
    ["Bing preview", `${CHROME} BingPreview/1.0b`],
    ["curl", "curl/8.9.1"],
    ["wget", "Wget/1.24.5"],
    ["python-requests", "python-requests/2.32.3"],
    ["Go", "Go-http-client/2.0"],
    ["axios", "axios/1.7.9"],
    ["node-fetch", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"],
  ])("%s -> bot", (_name, ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it("thiếu header UA (null/undefined) -> bot", () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
  });

  it.each([
    ["Chrome desktop", CHROME],
    ["Safari iPhone", SAFARI_IPHONE],
    ["trình duyệt trong Zalo", ZALO_IN_APP],
    ["trình duyệt trong Messenger", MESSENGER_IN_APP],
    ["máy Cubot (UA chứa CUBOT)", CUBOT_PHONE],
    ["Slack desktop (không phải Slackbot)", SLACK_DESKTOP],
    ["Firefox", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0"],
    ["Cốc Cốc trình duyệt", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/141.0.0 Chrome/135.0.0.0 Safari/537.36"],
  ])("%s -> người đọc", (_name, ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });
});

describe("isPrefetchRequest", () => {
  it.each([
    ["Sec-Purpose: prefetch", { "Sec-Purpose": "prefetch" }],
    ["Sec-Purpose: prefetch;prerender", { "Sec-Purpose": "prefetch;prerender" }],
    ["Purpose: prefetch", { Purpose: "prefetch" }],
    ["X-Moz: prefetch", { "X-Moz": "prefetch" }],
  ])("%s -> tải trước", (_name, headers) => {
    expect(isPrefetchRequest(new Headers(headers))).toBe(true);
  });

  it("request thường -> không phải tải trước", () => {
    expect(isPrefetchRequest(new Headers({ "User-Agent": CHROME }))).toBe(false);
  });
});

describe("ngày Việt Nam", () => {
  it("mốc 00:00 giờ VN = 17:00 UTC hôm trước; 17:00 UTC là ranh giới ngày", () => {
    expect(vietnamDayStart(new Date("2026-10-22T03:00:00Z")).toISOString()).toBe("2026-10-21T17:00:00.000Z");
    expect(vietnamDayStart(new Date("2026-10-22T16:59:59.999Z")).toISOString()).toBe("2026-10-21T17:00:00.000Z");
    expect(vietnamDayStart(new Date("2026-10-22T17:00:00Z")).toISOString()).toBe("2026-10-22T17:00:00.000Z");
  });

  it("TTL chống trùng kéo tới 24:00 giờ VN, ít nhất 1 giây", () => {
    expect(secondsUntilVietnamDayEnd(new Date("2026-10-22T17:00:00Z"))).toBe(24 * 60 * 60);
    expect(secondsUntilVietnamDayEnd(new Date("2026-10-22T16:00:00Z"))).toBe(60 * 60);
    expect(secondsUntilVietnamDayEnd(new Date("2026-10-22T16:59:59.999Z"))).toBe(1);
  });
});

describe("viewDedupeKey", () => {
  const secret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const base = {
    ipHash: "a".repeat(64),
    userAgent: CHROME,
    day: new Date("2026-10-21T17:00:00Z"),
    newsId: "5b1d7c1e-6d5f-4a43-9a5e-0c1b2a3d4e5f",
  };

  it("ổn định với cùng đầu vào, đổi khi đổi IP / UA / ngày / bài", () => {
    const key = viewDedupeKey(base, secret);
    expect(viewDedupeKey(base, secret)).toBe(key);
    expect(viewDedupeKey({ ...base, ipHash: "b".repeat(64) }, secret)).not.toBe(key);
    expect(viewDedupeKey({ ...base, userAgent: SAFARI_IPHONE }, secret)).not.toBe(key);
    expect(viewDedupeKey({ ...base, day: new Date("2026-10-22T17:00:00Z") }, secret)).not.toBe(key);
    expect(viewDedupeKey({ ...base, newsId: "6c2e8d2f-7e6a-4b54-8b6f-1d2c3b4e5f60" }, secret)).not.toBe(key);
    expect(viewDedupeKey(base, "secret-khac-bbbbbbbbbbbbbbbbbbbbbbbbbb")).not.toBe(key);
  });

  it("khoá chỉ là hex HMAC: không chứa id bài, UA hay ipHash thô", () => {
    const key = viewDedupeKey(base, secret);
    expect(key).toMatch(/^nv:[0-9a-f]{64}$/);
    expect(key).not.toContain(base.newsId);
    expect(key).not.toContain(base.ipHash);
  });

  it("thiếu secret -> ném lỗi", () => {
    expect(() => viewDedupeKey(base, "")).toThrow(/PAYLOAD_SECRET/);
  });
});

describe("claimDailyView", () => {
  it("SET NX EX trong một lệnh: OK -> lần đầu, null -> đã xem", async () => {
    const set = vi.fn().mockResolvedValueOnce("OK").mockResolvedValueOnce(null);
    expect(await claimDailyView("nv:k", 120, { set })).toBe(true);
    expect(await claimDailyView("nv:k", 120, { set })).toBe(false);
    expect(set).toHaveBeenCalledWith("nv:k", "1", "EX", 120, "NX");
  });

  it("Redis lỗi -> ViewDedupeUnavailableError", async () => {
    const set = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(claimDailyView("nv:k", 120, { set })).rejects.toBeInstanceOf(ViewDedupeUnavailableError);
  });
});
