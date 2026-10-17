import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listSourceMaps, readUploadConfig } from "../../scripts/upload-sourcemaps.mjs";
import { shouldEmitBrowserSourceMaps } from "@/lib/monitoring/browser-sourcemaps";

const fullEnv = {
  GLITCHTIP_AUTH_TOKEN: "token-test",
  GLITCHTIP_URL: "https://glitchtip.example.com",
  GLITCHTIP_ORG: "tami",
  GLITCHTIP_PROJECT: "web",
};

describe("upload source map GlitchTip", () => {
  it("không có token thì bỏ qua (build bình thường, không sinh source map)", () => {
    expect(readUploadConfig({})).toBeNull();
    expect(readUploadConfig({ GLITCHTIP_AUTH_TOKEN: "  " })).toBeNull();
    expect(shouldEmitBrowserSourceMaps({})).toBe(false);
    expect(shouldEmitBrowserSourceMaps({ GLITCHTIP_AUTH_TOKEN: "" })).toBe(false);
  });

  it("có token thì sinh source map và đọc đủ cấu hình", () => {
    expect(shouldEmitBrowserSourceMaps(fullEnv)).toBe(true);
    expect(readUploadConfig(fullEnv)).toEqual({
      authToken: "token-test",
      url: "https://glitchtip.example.com",
      org: "tami",
      project: "web",
    });
  });

  it("có token mà thiếu url/org/project là lỗi cấu hình (không âm thầm bỏ qua)", () => {
    expect(() => readUploadConfig({ GLITCHTIP_AUTH_TOKEN: "t", GLITCHTIP_ORG: "tami" })).toThrow(/GLITCHTIP_URL, GLITCHTIP_PROJECT/);
  });

  describe("listSourceMaps", () => {
    const dirs: string[] = [];
    afterEach(() => {
      for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
    });

    it("liệt kê đệ quy mọi file .map", () => {
      const root = mkdtempSync(join(tmpdir(), "maps-"));
      dirs.push(root);
      mkdirSync(join(root, "chunks", "nested"), { recursive: true });
      writeFileSync(join(root, "chunks", "a.js"), "");
      writeFileSync(join(root, "chunks", "a.js.map"), "");
      writeFileSync(join(root, "chunks", "nested", "b.js.map"), "");
      expect(listSourceMaps(root).map((file) => file.replace(root, "").replaceAll("\\", "/")).sort()).toEqual([
        "/chunks/a.js.map",
        "/chunks/nested/b.js.map",
      ]);
    });
  });
});
