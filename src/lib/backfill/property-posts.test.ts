import { describe, expect, it } from "vitest";

import { planPropertyPost, type PropertyPostSource } from "./property-posts";

const post = (over: Partial<PropertyPostSource> = {}): PropertyPostSource => ({ id: "t1", title: "Tin mẫu", status: "published", excerpt: "", contentText: "", ...over });
const patchOf = (over: Partial<PropertyPostSource>) => planPropertyPost(post(over)).patch;
const reviewOf = (over: Partial<PropertyPostSource>, field: string) =>
  planPropertyPost(post(over))
    .review.filter((r) => r.field === field)
    .map((r) => r.note);

// Chuỗi lấy từ tin thật trong DB dev (tiêu đề + mục "Thông tin chính" của nội dung).
describe("planPropertyPost — mẫu tin thật", () => {
  it("căn hộ: 38m2/1PN/1WC, ban công không phải hướng nhà", () => {
    const plan = planPropertyPost(
      post({
        title: "Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu",
        contentText: "Diện tích: 38m². Thiết kế: 1 phòng ngủ, 1 phòng khách. Ban công hướng Đông Bắc.\nThông tin chính\nDiện tích: 38 m²\nPhòng ngủ: 1\nPhòng tắm: 1",
      }),
    );
    expect(plan.patch).toEqual({ propertyType: "apartment", areaM2: 38, bedrooms: 1, bathrooms: 1 });
    expect(plan.fieldStates.houseDirection).toBe("not-found");
    expect(plan.review.map((r) => r.note)).toContain("Hướng ban công Đông Bắc (NE) — không dùng làm hướng nhà");
    expect(plan.fieldStates.floors).toBe("not-found"); // căn hộ: không trích số tầng
    expect(plan.filled.find((f) => f.field === "areaM2")).toMatchObject({ source: "tiêu đề", confidence: "cao" });
  });

  it("2PN–1WC, 80m2 tiêu đề = 80 m² nội dung; \"cửa hướng\" là hướng nhà; mục \"Phòng ngủ: 2⏎Phòng tắm: 1\" không đọc lẫn", () => {
    expect(
      patchOf({
        title: "Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu",
        contentText: "Thông tin chính\nDiện tích: 77 m²\nPhòng ngủ: 2\nPhòng tắm: 1\nTầng: Tầng cao\nNội thất: Đầy đủ",
      }),
    ).toEqual({ propertyType: "apartment", areaM2: 77, bedrooms: 2, bathrooms: 1, houseDirection: "NW" });
    expect(patchOf({ title: "Bán căn Kosmo 3 ngủ căn góc siêu đẹp", contentText: "Phòng ngủ: 3\nPhòng tắm: 2" })).toMatchObject({ bedrooms: 3, bathrooms: 2 });
  });

  it("\"hướng Tây tứ trạch\" không phải hướng; \"Hướng: Tây Nam\" ở nội dung thì điền", () => {
    expect(patchOf({ title: "Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch", contentText: "Hướng: Tây Tứ Trạch" })).not.toHaveProperty("houseDirection");
    expect(patchOf({ title: "Bán chung cư Starlake 79 m² ban công hướng Tây Nam", contentText: "Hướng: Tây Nam" }).houseDirection).toBe("SW");
  });

  it("biệt thự / liền kề: hướng, mặt tiền \"MT: 11m\" / \"mặt tiền 5m\", số tầng \"3.5 tầng\" / \"3 tầng 1 tum\", \"chính Nam\"", () => {
    expect(patchOf({ title: "Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5 tầng nổi" })).toEqual({ propertyType: "villa", houseDirection: "NW", floors: 3.5 });
    expect(patchOf({ title: "Bán căn góc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên" })).toEqual({ propertyType: "villa", houseDirection: "S", frontageM: 11 });
    expect(patchOf({ title: "Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m" })).toEqual({ propertyType: "villa", houseDirection: "W", floors: 3, frontageM: 10 });
    expect(patchOf({ title: "Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên" })).toEqual({ propertyType: "townhouse", houseDirection: "E", frontageM: 5, floors: 4 });
  });

  it("hướng đứng trần trong tiêu đề → chỉ gợi ý, không điền; \"phía Nam Hà Nội\" / \"- Nam Từ Liêm\" không gợi ý", () => {
    const over = { title: "Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum" };
    expect(patchOf(over)).not.toHaveProperty("houseDirection");
    expect(reviewOf(over, "houseDirection")).toEqual(['Gợi ý: Tây Nam (SW) (không có chữ "hướng" đi trước, chưa điền)']);
    expect(reviewOf({ title: "Bán liền kề Đông Nam Elegant Park Thạch Bàn" }, "houseDirection")[0]).toContain("Đông Nam (SE)");
    expect(reviewOf({ title: "Biệt thự sinh thái phía Nam Hà Nội" }, "houseDirection")).toEqual([]);
    expect(reviewOf({ title: "Bán căn hộ 2PN - Nam Từ Liêm" }, "houseDirection")).toEqual([]);
  });

  it("chỉ có khoảng diện tích → cần soát; khoảng + số cụ thể → mơ hồ; hướng tiêu đề ≠ hướng nội dung → mơ hồ", () => {
    const range = { title: "Bán Vinhomes Olympic Ngọc Hồi - Nhà liền kề vị trí đẹp", contentText: "Loại hình: Nhà liền kề\nDiện tích dự kiến: 75 – 120m²" };
    expect(patchOf(range)).not.toHaveProperty("areaM2");
    expect(reviewOf(range, "areaM2")).toEqual(["Chỉ có khoảng diện tích 75–120 m² — chưa điền"]);
    const mixed = { title: "Bán Vinhomes Olympic Ngọc Hồi - Biệt thự sinh thái", contentText: "Diện tích dự kiến: 200 – 600m²\nThông tin chính\nDiện tích: 200 m²" };
    expect(patchOf(mixed)).not.toHaveProperty("areaM2");
    expect(reviewOf(mixed, "areaM2")).toEqual(["Nhiều giá trị khác nhau (200–600 m² · 200 m²) — chưa điền"]);
    const dir = { title: "Chính chủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam", contentText: "Diện tích: 96m² (tham khảo)\nHướng nhà: Tây Bắc" };
    expect(patchOf(dir)).toEqual({ propertyType: "townhouse", areaM2: 96 });
    expect(reviewOf(dir, "houseDirection")).toEqual(["Nhiều giá trị khác nhau (Đông Nam (SE) · Tây Bắc (NW)) — chưa điền"]);
  });

  it("loại hình: tiêu đề trước; \"nhà phố shophouse\" → shophouse; tiêu đề không có thì lấy nội dung (độ tin cậy trung bình)", () => {
    expect(patchOf({ title: "Bán nhà phố shophouse Elegant Park Thạch Bàn - Tây Tứ Trạch" }).propertyType).toBe("shophouse");
    const mixed = { title: "Bán căn hộ gần khu biệt thự", contentText: "Liền kề công viên" };
    expect(patchOf(mixed)).not.toHaveProperty("propertyType"); // tiêu đề có 2 loại → mơ hồ, không xuống nội dung
    expect(reviewOf(mixed, "propertyType")).toEqual(["Nhiều giá trị khác nhau (Căn hộ (apartment) · Biệt thự (villa)) — chưa điền"]);
    const plan = planPropertyPost(post({ title: "Bán căn Kosmo 3 ngủ căn góc", contentText: "Căn hộ thiết kế hiện đại." }));
    expect(plan.patch.propertyType).toBe("apartment");
    expect(plan.review.some((r) => r.field === "propertyType" && r.note.startsWith("Soát: Căn hộ"))).toBe(true);
  });
});

describe("planPropertyPost — cú pháp VN khác", () => {
  it("diện tích: \"85m2\", \"85 m²\", \"dt 85m\", \"85,5 mét vuông\"", () => {
    expect(patchOf({ title: "Bán nhà 85m2" }).areaM2).toBe(85);
    expect(patchOf({ title: "Bán nhà dt 85m hẻm xe hơi" }).areaM2).toBe(85);
    expect(patchOf({ title: "Bán đất 85,5 mét vuông" }).areaM2).toBe(85.5);
    expect(patchOf({ title: "Bán đất 1.200m2" }).areaM2).toBe(1200);
    expect(patchOf({ title: "Giá 50 triệu/m2, cách chợ 500m" })).not.toHaveProperty("areaM2");
  });

  it("phòng: \"3 phòng ngủ\", \"2 phòng vệ sinh\", \"2 WC\"", () => {
    expect(patchOf({ title: "Nhà 3 phòng ngủ 2 phòng vệ sinh" })).toMatchObject({ bedrooms: 3, bathrooms: 2 });
    expect(patchOf({ title: "Căn 2 PN 2 WC" })).toMatchObject({ bedrooms: 2, bathrooms: 2 });
  });

  it("số tầng: \"1 trệt 3 lầu\" → 4 (lửng không tính); \"2 tầng hầm\" bỏ; trên 10 tầng → gợi ý", () => {
    expect(patchOf({ title: "Nhà phố 1 trệt 3 lầu" }).floors).toBe(4);
    expect(patchOf({ title: "Nhà phố 1 trệt 1 lửng 2 lầu, 4 tầng" })).not.toHaveProperty("floors"); // 3 (trệt + lầu) ≠ 4 → mơ hồ
    expect(patchOf({ title: "Nhà phố 1 trệt, 2 lầu" }).floors).toBe(3);
    expect(patchOf({ title: "Văn phòng nhà phố 5 tầng, 2 tầng hầm" }).floors).toBe(5);
    expect(reviewOf({ title: "Nhà phố toà 25 tầng" }, "floors")[0]).toContain("Số tầng 25");
  });

  it("mặt tiền: \"mặt tiền rộng 5,5 m\", \"MT 4x18m\"; \"mặt tiền đường 20m\" không nhận", () => {
    expect(patchOf({ title: "Nhà phố mặt tiền rộng 5,5 m" }).frontageM).toBe(5.5);
    expect(patchOf({ title: "Nhà phố MT 4x18m" }).frontageM).toBe(4);
    expect(patchOf({ title: "Nhà phố mặt tiền đường 20m" })).not.toHaveProperty("frontageM");
  });

  it("mặt tiền: \"cách 50m mặt tiền\" / \"cách mặt tiền 30m\" là khoảng cách, không nhận (P3-T05 review r1)", () => {
    expect(patchOf({ title: "Nhà phố ngõ ô tô cách 50m mặt tiền phố" })).not.toHaveProperty("frontageM");
    expect(patchOf({ title: "Nhà phố cách mặt tiền 30m" })).not.toHaveProperty("frontageM");
    expect(patchOf({ title: "Nhà phố 5m mặt tiền" }).frontageM).toBe(5);
  });

  it("hướng chính: \"hướng Bắc Ninh\" / \"hướng Tây Hồ\" / \"chính Nam Từ Liêm\" là địa danh, không phải hướng nhà", () => {
    expect(patchOf({ title: "Bán nhà phố mặt đường hướng Bắc Ninh" })).not.toHaveProperty("houseDirection");
    expect(patchOf({ title: "Biệt thự view hồ hướng Tây Hồ" })).not.toHaveProperty("houseDirection");
    expect(patchOf({ title: "Nhà phố trung tâm chính Nam Từ Liêm" })).not.toHaveProperty("houseDirection");
    expect(patchOf({ title: "Liền kề hướng Đông Nam Bộ Hồ" })).not.toHaveProperty("houseDirection");
    expect(patchOf({ title: "Nhà phố hướng Nam rộng thoáng" }).houseDirection).toBe("S");
  });

  it("số tầng lẻ / có tum → vẫn điền nhưng ghi chú soát", () => {
    const half = { title: "Bán biệt thự song lập hướng Tây Bắc 3.5 tầng nổi" };
    expect(patchOf(half).floors).toBe(3.5);
    expect(reviewOf(half, "floors")).toEqual(["Số tầng lẻ 3.5 (thường là có lửng / tum) — soát lại"]);
    const tum = { title: "Bán biệt thự song lập hướng Tây xây thô 3 tầng 1 tum" };
    expect(patchOf(tum).floors).toBe(3);
    expect(reviewOf(tum, "floors")).toEqual(['Có "tum" — soát số tầng 3 có tính tum không']);
    expect(reviewOf({ title: "Nhà phố 4 tầng" }, "floors")).toEqual([]);
  });

  it("ban công cùng hướng với hướng nhà → vẫn giữ ghi chú ban công", () => {
    const over = { title: "Bán chung cư Starlake 79 m² ban công hướng Tây Nam", contentText: "Hướng: Tây Nam" };
    expect(patchOf(over).houseDirection).toBe("SW");
    expect(reviewOf(over, "houseDirection")).toContain("Hướng ban công Tây Nam (SW) — trùng hướng nhà đã trích, soát lại");
  });

  it("địa chỉ: dòng \"Địa chỉ: …\" (cắt ở hết câu), không nhận \"Địa chỉ văn phòng: …\"", () => {
    expect(patchOf({ title: "Nhà phố", contentText: "Thông tin\n- Địa chỉ: 12 Nguyễn Huệ, Phường Sài Gòn. Giá 5 tỷ\nLiên hệ" }).address).toBe("12 Nguyễn Huệ, Phường Sài Gòn");
    expect(patchOf({ title: "Nhà phố", contentText: "Địa chỉ văn phòng: 1 Lê Lợi" })).not.toHaveProperty("address");
    const plan = planPropertyPost(post({ title: "Nhà phố", contentText: "Địa chỉ: 12 Nguyễn Huệ\nĐịa chỉ: 5 Lê Lợi" }));
    expect(plan.patch).not.toHaveProperty("address");
    expect(plan.review.find((r) => r.field === "address")?.note).toBe("Nhiều giá trị khác nhau (12 Nguyễn Huệ · 5 Lê Lợi) — chưa điền");
  });

  it("nhiều số khác nhau → không điền, ghi cần soát", () => {
    const over = { title: "Bán nhà 60m2 4 tầng", contentText: "Diện tích đất 60m2, tổng diện tích sàn 240m2." };
    expect(patchOf(over)).not.toHaveProperty("areaM2");
    expect(reviewOf(over, "areaM2")).toEqual(["Nhiều giá trị khác nhau (60 m² · 240 m²) — chưa điền"]);
  });
});

describe("planPropertyPost — chỉ ô trống, bỏ qua voucher", () => {
  it("ô đã có giá trị (kể cả 0) giữ nguyên, không trích", () => {
    const plan = planPropertyPost(post({ title: "Bán biệt thự 200m2 3PN hướng Nam", areaM2: 180, bedrooms: 0, houseDirection: "E", address: "  " }));
    expect(plan.patch).toEqual({ propertyType: "villa" });
    expect(plan.fieldStates).toMatchObject({ areaM2: "has-value", bedrooms: "has-value", houseDirection: "has-value", address: "not-found" });
  });

  it("tin có offer.endAt hợp lệ hoặc voucherCode → bỏ qua cả tin (cùng phân loại hasPostOffer)", () => {
    const skipped = { skipped: "tin ưu đãi / voucher", patch: {}, fieldStates: {}, filled: [], review: [] };
    expect(planPropertyPost(post({ title: "Ưu đãi căn hộ 2PN 70m2", offer: { endAt: "2026-12-31T00:00:00.000Z" } }))).toMatchObject(skipped);
    expect(planPropertyPost(post({ title: "Voucher tri ân khách thuê căn hộ 2PN 70m2", offer: { voucherCode: "TAMI10" } }))).toMatchObject(skipped);
    expect(planPropertyPost(post({ title: "Bán căn hộ 2PN 70m2", offer: { endAt: null, voucherCode: " " } })).skipped).toBeUndefined();
  });

  it("offer.endAt không parse được thành ngày → không phải tin ưu đãi, vẫn trích (BL-055 C-8)", () => {
    const plan = planPropertyPost(post({ title: "Bán căn hộ 2PN 70m2", offer: { endAt: "không phải ngày", voucherCode: null } }));
    expect(plan.skipped).toBeUndefined();
    expect(plan.patch).toEqual({ propertyType: "apartment", areaM2: 70, bedrooms: 2 });
  });

  it("tin chưa xuất bản đánh dấu isPublic=false", () => {
    expect(planPropertyPost(post({ status: "draft" })).isPublic).toBe(false);
  });
});
