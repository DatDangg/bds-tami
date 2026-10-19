import { describe, expect, it } from "vitest";

import { buildFilteredListHref, COUNTED_CONTENT_SLUGS, CREATE_SHORTCUT_SLUGS, statCardSpecsFor } from "./dashboard-queries";

const ROUTE = "/admin";
const USER_ID = "user-1";

describe("buildFilteredListHref", () => {
  it("equals / exists / in -> query lồng where[and][i] mà list view Payload đọc được", () => {
    const href = buildFilteredListHref(ROUTE, "leads", [
      { field: "status", operator: "equals", value: "new" },
      { field: "assignedTo", operator: "exists", value: false },
      { field: "status", operator: "in", value: ["contacted", "consulting"] },
    ]);
    const params = new URL(`http://x${href}`).searchParams;
    expect(href.startsWith("/admin/collections/leads?")).toBe(true);
    expect(params.get("where[and][0][status][equals]")).toBe("new");
    expect(params.get("where[and][1][assignedTo][exists]")).toBe("false");
    expect(params.get("where[and][2][status][in][0]")).toBe("contacted");
    expect(params.get("where[and][2][status][in][1]")).toBe("consulting");
  });
});

describe("statCardSpecsFor", () => {
  const collectionsOf = (role: string) => statCardSpecsFor(role, USER_ID, ROUTE).flatMap((spec) => spec.queries.map((query) => query.collection));

  it("admin: lead mới, chưa phân công, hồ sơ ứng tuyển mới, nội dung đang hiển thị", () => {
    const specs = statCardSpecsFor("admin", USER_ID, ROUTE);
    expect(specs.map((spec) => spec.id)).toEqual(["leads-new", "leads-unassigned", "applications-new", "content-visible"]);
    expect(specs.find((spec) => spec.id === "leads-unassigned")?.queries[0]?.where).toEqual({
      and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }],
    });
    expect(collectionsOf("admin")).toContain("job-applications");
  });

  it("sale: không có thẻ hồ sơ ứng tuyển / chưa phân công, không đụng job-applications", () => {
    const specs = statCardSpecsFor("sale", USER_ID, ROUTE);
    expect(specs.map((spec) => spec.id)).toEqual(["leads-new", "leads-processing", "drafts-mine", "content-visible"]);
    expect(collectionsOf("sale")).not.toContain("job-applications");
  });

  it("vai trò lạ được coi như sale (không lộ thẻ admin)", () => {
    expect(statCardSpecsFor(undefined, USER_ID, ROUTE).map((spec) => spec.id)).not.toContain("applications-new");
  });

  it("sale: thẻ bài của mình luôn lọc author = id (sale đọc được mọi bài nội dung)", () => {
    const specs = statCardSpecsFor("sale", USER_ID, ROUTE).filter((spec) => spec.id === "drafts-mine" || spec.id === "content-visible");
    expect(specs).toHaveLength(2);
    for (const spec of specs) {
      expect(spec.queries.map((query) => query.collection)).toEqual([...COUNTED_CONTENT_SLUGS]);
      for (const query of spec.queries) expect(JSON.stringify(query.where)).toContain(`"author":{"equals":"${USER_ID}"}`);
    }
  });

  it("admin: thẻ nội dung đang hiển thị không lọc tác giả; cho thuê tính cả rented", () => {
    const visible = statCardSpecsFor("admin", USER_ID, ROUTE).find((spec) => spec.id === "content-visible")!;
    expect(JSON.stringify(visible.queries)).not.toContain("author");
    const rentals = visible.queries.find((query) => query.collection === "rentals")!;
    expect(JSON.stringify(rentals.where)).toContain('"in":["published","rented"]');
    const news = visible.queries.find((query) => query.collection === "news")!;
    expect(JSON.stringify(news.where)).toContain('"in":["published"]');
  });

  it("thẻ đếm một collection có href lọc sẵn; thẻ gộp nhiều loại không có href", () => {
    for (const role of ["admin", "sale"]) {
      for (const spec of statCardSpecsFor(role, USER_ID, ROUTE)) {
        if (spec.queries.length === 1) expect(spec.href).toMatch(/^\/admin\/collections\/(leads|job-applications)\?where/);
        else expect(spec.href).toBeUndefined();
      }
    }
  });
});

describe("CREATE_SHORTCUT_SLUGS", () => {
  it("danh sách cố định, không có collection hệ thống (lead-activities, staff...)", () => {
    const slugs: readonly string[] = CREATE_SHORTCUT_SLUGS;
    expect(slugs).not.toContain("lead-activities");
    expect(slugs).not.toContain("staff");
  });
});
