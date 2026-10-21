import { viTranslations } from "@payloadcms/translations/languages/vi";
import { describe, expect, it } from "vitest";
import { PAYLOAD_VI_OVERRIDES } from "./payload-vi-overrides";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [subPath, subValue] of flatten(value, path)) out.set(subPath, subValue);
  }
  return out;
}

const overrides = flatten(PAYLOAD_VI_OVERRIDES as Tree);
const originals = flatten(viTranslations as unknown as Tree);

const markers = (text: string) => [...new Set([...text.matchAll(/\{\{\w+\}\}|<\/?\d+>/g)].map((m) => m[0]))].sort();

// Giá trị mong đợi của TỪNG khoá đã đổi (bảng T01 mục 1-8): chống bị ghi đè ngược khi nâng Payload.
const EXPECTED: Record<string, string> = {
  "general.trash": "Thùng rác",
  "general.deletedAt": "Ngày xoá",
  "general.noResults": "Chưa có {{label}} nào, hoặc không có mục nào khớp bộ lọc hiện tại.",
  "general.noResultsDescription": "Chưa có dữ liệu, hoặc không có mục nào khớp bộ lọc ở trên.",
  "general.searchBy": "Tìm theo {{label}}",
  "general.filters": "Lọc nâng cao",
  "general.filterWhere": "Lọc {{label}} theo điều kiện:",
  "general.descending": "Giảm dần",
  "general.and": "và",
  "general.true": "Có",
  "general.false": "Không",
  "operators.equals": "là",
  "operators.isNotEqualTo": "không phải",
  "operators.isIn": "là một trong",
  "operators.isNotIn": "không thuộc",
  "operators.exists": "có giá trị",
  "operators.isNotLike": "không giống",
  "general.aboutToTrash": "Chuyển {{label}} <1>{{title}}</1> vào thùng rác? Có thể khôi phục lại trong Thùng rác.",
  "general.aboutToTrashCount": "Chuyển {{count}} {{label}} vào thùng rác? Có thể khôi phục lại trong Thùng rác.",
  "general.aboutToDelete": "Bạn sắp xoá {{label}} <1>{{title}}</1>. Tiếp tục?",
  "general.documentIsTrashed": "{{label}} này đang ở thùng rác nên chỉ xem được. Khôi phục để sửa.",
  "general.titleDeleted": '{{label}} "{{title}}" đã được xoá.',
  "general.saveChanges": "Lưu thay đổi",
  "general.lastModified": "Sửa lần cuối",
  "general.duplicateWithoutSaving": "Bỏ thay đổi chưa lưu và tạo bản sao",
  "general.leaveAnyway": "Vẫn rời trang",
  "fields.collapseAll": "Thu gọn tất cả",
  "fields.showAll": "Mở rộng tất cả",
  "general.document": "Mục",
  "general.documents": "Mục",
  "general.documentLocked": "Mục đang có người sửa",
  "general.currentlyEditing": "đang sửa mục này. Nếu bạn giành quyền sửa, người đó sẽ không sửa tiếp được và có thể mất thay đổi chưa lưu.",
  "general.takeOver": "Giành quyền sửa",
  "general.anotherUserTakenOver": "Người khác đã giành quyền sửa mục này.",
  "general.editingTakenOver": "Bạn đã bị giành quyền sửa",
  "general.documentOutOfDate": "Mục này vừa được người khác cập nhật. Tải lại để xem bản mới nhất.",
  "general.reloadDocument": "Tải lại",
  "general.documentModified": "Mục đã được sửa",
  "localization.cannotCopySameLocale": "Không thể sao chép sang cùng một ngôn ngữ",
  "fields.customURL": "Địa chỉ web tự nhập",
  "fields.enterURL": "Nhập địa chỉ web",
  "fields.chooseBetweenCustomTextOrDocument": "Nhập địa chỉ web, hoặc chọn một trang/bài có sẵn để liên kết.",
  "fields.chooseDocumentToLink": "Chọn trang/bài để liên kết",
  "fields.textToDisplay": "Chữ hiển thị",
  "error.correctInvalidFields": "Vui lòng sửa các trường chưa hợp lệ.",
  "error.followingFieldsInvalid_one": "Trường sau chưa hợp lệ:",
  "error.followingFieldsInvalid_other": "Các trường sau chưa hợp lệ:",
  "error.unknown": "Đã có lỗi xảy ra. Vui lòng thử lại.",
  "error.unspecific": "Đã có lỗi xảy ra. Vui lòng thử lại.",
  "error.notAllowedToPerformAction": "Bạn không có quyền thực hiện thao tác này.",
  "error.notAllowedToAccessPage": "Bạn không có quyền vào trang này.",
  "error.unauthorized": "Bạn cần đăng nhập để thực hiện thao tác này.",
  "error.valueMustBeUnique": "Giá trị này đã được dùng, vui lòng nhập giá trị khác.",
  "error.documentNotFound": "Không tìm thấy mục có mã {{id}}. Mục có thể đã bị xoá, chưa từng tồn tại hoặc bạn không có quyền xem.",
  "error.loadingDocument": "Không tải được mục có mã {{id}}.",
  "error.noFilesUploaded": "Chưa có tệp nào được tải lên.",
  "error.problemUploadingFile": "Không tải lên được tệp.",
  "error.invalidFileType": "Định dạng tệp không hợp lệ.",
  "error.invalidFileTypeValue": "Định dạng tệp không hợp lệ: {{value}}.",
  "validation.invalidSelection": "Lựa chọn ở trường này không hợp lệ.",
  "validation.invalidSelections": "Trường này có lựa chọn không hợp lệ:",
  "validation.fieldHasNo": "Trường này chưa có: {{label}}",
  "validation.validUploadID": "Trường này chưa có tệp tải lên hợp lệ.",
  "validation.requiresTwoNumbers": "Cần nhập đủ kinh độ và vĩ độ.",
  "validation.notValidDate": '"{{value}}" không phải ngày hợp lệ.',
  "error.emailOrPasswordIncorrect": "Email hoặc mật khẩu không đúng.",
  "error.userLocked": "Tài khoản tạm bị khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
  "error.unauthorizedAdmin": "Tài khoản này không có quyền vào trang quản trị.",
  "error.tokenInvalidOrExpired": "Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.",
  "authentication.resetPassword": "Đặt lại mật khẩu",
  "authentication.resetYourPassword": "Đặt lại mật khẩu",
  "authentication.forgotPasswordEmailInstructions": "Nhập email để nhận hướng dẫn đặt lại mật khẩu.",
  "authentication.emailNotValid": "Email không hợp lệ",
  "authentication.loggedOutInactivity": "Bạn đã được tự động đăng xuất vì lâu không thao tác.",
  "authentication.youAreInactive": "Bạn đã không thao tác một lúc và sẽ được tự động đăng xuất để bảo mật. Bạn muốn tiếp tục làm việc?",
  "general.creatingNewLabel": "Thêm {{label}} mới",
  "general.untitled": "Chưa đặt tên",
  "general.dashboard": "Tổng quan",
  "general.backToDashboard": "Về trang Tổng quan",
  "general.adminTheme": "Giao diện trang quản trị",
  "version.versions": "Lịch sử chỉnh sửa",
  "version.versionID": "Mã phiên bản",
  "version.changedFieldsCount_one": "{{count}} trường đã thay đổi",
  "version.currentPublishedVersion": "Phiên bản hiện tại",
  "version.previousVersion": "Phiên bản trước",
  "version.noLabelGroup": "Nhóm chưa có tên",
  "version.modifiedOnly": "Chỉ trường đã đổi",
  "version.selectLocales": "Chọn ngôn ngữ để hiển thị",
  "upload.bulkUpload": "Tải lên nhiều tệp",
  "upload.addFile": "Thêm tệp",
  "upload.dragAndDrop": "Kéo thả tệp vào đây",
  "upload.dragAndDropHere": "hoặc kéo thả tệp vào đây",
  "upload.fileName": "Tên tệp",
  "upload.fileSize": "Dung lượng",
  "upload.selectFile": "Chọn tệp",
  "upload.fileToUpload": "Tệp sẽ tải lên",
  "upload.filesToUpload": "Tệp sẽ tải lên",
  "upload.pasteURL": "Dán địa chỉ tệp",
  "upload.selectCollectionToBrowse": "Chọn thư viện để tìm",
  "upload.setFocalPoint": "Đặt điểm trọng tâm",
  "upload.focalPointDescription": "Kéo điểm trọng tâm trực tiếp trên ảnh xem trước hoặc chỉnh giá trị bên dưới.",
  "upload.sizes": "Các cỡ ảnh",
  "upload.crop": "Cắt ảnh",
  "general.collections": "Mục quản lý",
  "general.globals": "Cài đặt website",
};

describe("PAYLOAD_VI_OVERRIDES", () => {
  it("mỗi khoá đã đổi có đúng giá trị mong đợi (không thiếu/thừa khoá)", () => {
    const { "general.noLabel": noLabel, ...changed } = Object.fromEntries(overrides);
    expect(noLabel).toBe("—");
    expect(changed).toEqual(EXPECTED);
  });

  it("mọi khoá override tồn tại trong bản dịch vi của gói (bắt khoá gõ sai/đổi tên khi nâng Payload)", () => {
    const missing = [...overrides.keys()].filter((key) => !originals.has(key));
    expect(missing).toEqual([]);
  });

  it("placeholder {{…}} và thẻ <n> của mỗi override khớp chuỗi gốc", () => {
    for (const [key, value] of overrides) {
      if (key === "general.noLabel") continue; // cố ý bỏ `{{label}}`: ô trống chỉ hiện `—`
      expect(markers(value), key).toEqual(markers(originals.get(key) ?? ""));
    }
  });

  it("không còn chữ Anh/kỹ thuật lọt vào các chuỗi đã override", () => {
    const banned = [/collections/i, /globals/i, /^Rác$/, /Đã Xóa Lúc/, /\bfields?\b/i, /\bToken\b/, /unknown error/i];
    for (const [key, value] of overrides) {
      for (const pattern of banned) expect(value, `${key} ~ ${pattern}`).not.toMatch(pattern);
    }
  });
});
