import { describe, expect, it } from "vitest";
import { joinAddress } from "./join-address";

const ASTOR = "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội";

describe("joinAddress", () => {
  it("không lặp phường/tỉnh đã có trong địa chỉ (ca Astor)", () => {
    expect(joinAddress(ASTOR, ["Phường Phú Thượng", "Hà Nội"])).toBe(ASTOR);
  });

  it("so không dấu, không phân biệt hoa thường", () => {
    expect(joinAddress("12 Nguyen Trai, PHUONG PHU THUONG, ha noi", ["Phường Phú Thượng", "Hà Nội"])).toBe("12 Nguyen Trai, PHUONG PHU THUONG, ha noi");
  });

  it("thiếu tỉnh thì thêm tỉnh, thiếu phường thì thêm phường", () => {
    expect(joinAddress("Lô IA25, phường Phú Thượng", ["Phường Phú Thượng", "Hà Nội"])).toBe("Lô IA25, phường Phú Thượng, Hà Nội");
    expect(joinAddress("Lô IA25, Hà Nội", ["Phường Phú Thượng", "Hà Nội"])).toBe("Lô IA25, Hà Nội, Phường Phú Thượng");
  });

  it("không có địa chỉ thì chỉ còn phần phường/tỉnh; thiếu hết thì rỗng", () => {
    expect(joinAddress(null, ["Phường Phú Thượng", "Hà Nội"])).toBe("Phường Phú Thượng, Hà Nội");
    expect(joinAddress("  ", [null, undefined, ""])).toBe("");
  });

  it("ranh giới từ: 'Hà' không bị coi là 'Hà Nội'; số 1 không khớp 'Phường 1'", () => {
    expect(joinAddress("Khu Hà", ["Hà Nội"])).toBe("Khu Hà, Hà Nội");
    expect(joinAddress("Số 1 Lê Lợi", ["Phường 1", "Đà Lạt"])).toBe("Số 1 Lê Lợi, Phường 1, Đà Lạt");
  });

  it("khớp khi địa chỉ viết tắt/bỏ tiền tố hành chính", () => {
    expect(joinAddress("Lô 5, P. Phú Thượng, Hà Nội", ["Phường Phú Thượng", "Hà Nội"])).toBe("Lô 5, P. Phú Thượng, Hà Nội");
    expect(joinAddress("Lô 5, Phú Thượng, Tây Hồ", ["Phường Phú Thượng"])).toBe("Lô 5, Phú Thượng, Tây Hồ");
  });

  it("phường trùng tên đường không bị bỏ sai; đoạn riêng thì vẫn bỏ", () => {
    expect(joinAddress("123 Lê Lợi", ["Phường Lê Lợi", "Bình Định"])).toBe("123 Lê Lợi, Phường Lê Lợi, Bình Định");
    expect(joinAddress("123 Lê Lợi, P. Lê Lợi", ["Phường Lê Lợi", "Bình Định"])).toBe("123 Lê Lợi, P. Lê Lợi, Bình Định");
  });

  it("nhận chuỗi areaLabel và tự tách", () => {
    expect(joinAddress(ASTOR, "Phường Phú Thượng, Hà Nội")).toBe(ASTOR);
    expect(joinAddress("Lô IA25", "Phường Phú Thượng, Hà Nội")).toBe("Lô IA25, Phường Phú Thượng, Hà Nội");
    expect(joinAddress("Lô IA25", null)).toBe("Lô IA25");
  });

  it("giới hạn đã biết: tên tỉnh khác dạng (TP.HCM vs Thành phố Hồ Chí Minh) vẫn ghép", () => {
    expect(joinAddress("1 Lê Lợi, Thành phố Hồ Chí Minh", ["TP.HCM"])).toBe("1 Lê Lợi, Thành phố Hồ Chí Minh, TP.HCM");
  });
});
