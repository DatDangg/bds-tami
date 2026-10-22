import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../../payload-types";

const findPublicProjectCardsByIds = vi.fn();
vi.mock("../projects/project-queries", () => ({ findPublicProjectCardsByIds: (...args: unknown[]) => findPublicProjectCardsByIds(...args) }));

const { loadMentionedProjects } = await import("./mentioned-projects");

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const payload = {} as Payload;
const mention = (project: unknown) => ({ type: "block", version: 2, fields: { blockType: "projectMention", project } });
const content = { root: { type: "root", children: [mention(A), mention(B), { type: "paragraph", children: [] }] } };
const project = (id: string, overrides: Partial<Project> = {}) => ({ id, title: `Dự án ${id.slice(0, 1)}`, slug: `du-an-${id.slice(0, 1)}`, salesStatus: "selling", ...overrides }) as Project;

describe("loadMentionedProjects (BL-054)", () => {
  beforeEach(() => findPublicProjectCardsByIds.mockReset());

  it("không có khối Dự án nhắc đến → không truy vấn", async () => {
    expect((await loadMentionedProjects(payload, "vi", { root: { children: [] } })).size).toBe(0);
    expect(findPublicProjectCardsByIds).not.toHaveBeenCalled();
  });

  it("tải một lần qua truy vấn công khai theo locale; chỉ dự án trả về (công khai) mới có thẻ, href theo locale", async () => {
    findPublicProjectCardsByIds.mockResolvedValue(new Map([[B, project(B, { slug: "the-crown" })]]));
    const cards = await loadMentionedProjects(payload, "en", content);
    expect(findPublicProjectCardsByIds).toHaveBeenCalledWith(payload, "en", [A, B]);
    expect([...cards.keys()]).toEqual([B]);
    expect(cards.get(B)).toMatchObject({ title: "Dự án 2", href: "/en/projects/the-crown", salesStatus: "selling" });
  });

  it("dự án thiếu tiêu đề / slug (vd /en chưa dịch tên) không thành thẻ", async () => {
    findPublicProjectCardsByIds.mockResolvedValue(new Map([[A, project(A, { title: null as never })]]));
    expect((await loadMentionedProjects(payload, "vi", content)).size).toBe(0);
  });
});
