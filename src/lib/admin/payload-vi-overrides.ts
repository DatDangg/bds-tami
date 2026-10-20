import type { viTranslations } from "@payloadcms/translations/languages/vi";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/**
 * Chữ tiếng Việt của Payload admin được ghi đè — MỘT nơi duy nhất (BL-040).
 * Chỉ ghi đè chuỗi thật sự hiện trên màn dự án; giữ nguyên `{{…}}` và thẻ `<n>` của khoá gốc.
 * Test `payload-vi-overrides.test.ts` khoá giá trị, khoá tồn tại và placeholder khi nâng `@payloadcms/translations`.
 */
export const PAYLOAD_VI_OVERRIDES: DeepPartial<typeof viTranslations> = {
  authentication: {
    // Đăng nhập, quên mật khẩu, phiên làm việc.
    resetPassword: "Đặt lại mật khẩu",
    resetYourPassword: "Đặt lại mật khẩu",
    forgotPasswordEmailInstructions: "Nhập email để nhận hướng dẫn đặt lại mật khẩu.",
    emailNotValid: "Email không hợp lệ",
    loggedOutInactivity: "Bạn đã được tự động đăng xuất vì lâu không thao tác.",
    youAreInactive: "Bạn đã không thao tác một lúc và sẽ được tự động đăng xuất để bảo mật. Bạn muốn tiếp tục làm việc?",
  },
  error: {
    // Toast lỗi và lỗi đăng nhập: bỏ tiền tố "Lỗi -", bỏ chữ Anh lẫn trong câu.
    correctInvalidFields: "Vui lòng sửa các trường chưa hợp lệ.",
    followingFieldsInvalid_one: "Trường sau chưa hợp lệ:",
    followingFieldsInvalid_other: "Các trường sau chưa hợp lệ:",
    unknown: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    unspecific: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    notAllowedToPerformAction: "Bạn không có quyền thực hiện thao tác này.",
    notAllowedToAccessPage: "Bạn không có quyền vào trang này.",
    unauthorized: "Bạn cần đăng nhập để thực hiện thao tác này.",
    valueMustBeUnique: "Giá trị này đã được dùng, vui lòng nhập giá trị khác.",
    documentNotFound: "Không tìm thấy mục có mã {{id}}. Mục có thể đã bị xoá, chưa từng tồn tại hoặc bạn không có quyền xem.",
    loadingDocument: "Không tải được mục có mã {{id}}.",
    noFilesUploaded: "Chưa có tệp nào được tải lên.",
    problemUploadingFile: "Không tải lên được tệp.",
    invalidFileType: "Định dạng tệp không hợp lệ.",
    invalidFileTypeValue: "Định dạng tệp không hợp lệ: {{value}}.",
    emailOrPasswordIncorrect: "Email hoặc mật khẩu không đúng.",
    userLocked: "Tài khoản tạm bị khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
    unauthorizedAdmin: "Tài khoản này không có quyền vào trang quản trị.",
    tokenInvalidOrExpired: "Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.",
  },
  fields: {
    // Mảng (thu gọn/mở rộng) và hộp chèn liên kết trong ô soạn thảo.
    collapseAll: "Thu gọn tất cả",
    showAll: "Mở rộng tất cả",
    customURL: "Địa chỉ web tự nhập",
    enterURL: "Nhập địa chỉ web",
    chooseBetweenCustomTextOrDocument: "Nhập địa chỉ web, hoặc chọn một trang/bài có sẵn để liên kết.",
    chooseDocumentToLink: "Chọn trang/bài để liên kết",
    textToDisplay: "Chữ hiển thị",
  },
  general: {
    // Ô trống ở danh sách admin hiện `—` thay vì `<Không có …>`.
    noLabel: "—",
    // Danh sách, tìm kiếm, bộ lọc, sắp xếp.
    trash: "Thùng rác",
    deletedAt: "Ngày xoá",
    noResults: "Chưa có {{label}} nào, hoặc không có mục nào khớp bộ lọc hiện tại.",
    noResultsDescription: "Chưa có dữ liệu, hoặc không có mục nào khớp bộ lọc ở trên.",
    searchBy: "Tìm theo {{label}}",
    // Nút mở trình dựng bộ lọc (khoá này chỉ dùng ở ListControls của Payload).
    filters: "Lọc nâng cao",
    filterWhere: "Lọc {{label}} theo điều kiện:",
    descending: "Giảm dần",
    and: "và",
    true: "Có",
    false: "Không",
    // Thùng rác, xoá, khôi phục.
    aboutToTrash: "Chuyển {{label}} <1>{{title}}</1> vào thùng rác? Có thể khôi phục lại trong Thùng rác.",
    aboutToTrashCount: "Chuyển {{count}} {{label}} vào thùng rác? Có thể khôi phục lại trong Thùng rác.",
    aboutToDelete: "Bạn sắp xoá {{label}} <1>{{title}}</1>. Tiếp tục?",
    documentIsTrashed: "{{label}} này đang ở thùng rác nên chỉ xem được. Khôi phục để sửa.",
    titleDeleted: '{{label}} "{{title}}" đã được xoá.',
    // Form sửa, khoá sửa đồng thời, bản sao.
    saveChanges: "Lưu thay đổi",
    lastModified: "Sửa lần cuối",
    duplicateWithoutSaving: "Bỏ thay đổi chưa lưu và tạo bản sao",
    leaveAnyway: "Vẫn rời trang",
    document: "Mục",
    documents: "Mục",
    documentLocked: "Mục đang có người sửa",
    currentlyEditing: "đang sửa mục này. Nếu bạn giành quyền sửa, người đó sẽ không sửa tiếp được và có thể mất thay đổi chưa lưu.",
    takeOver: "Giành quyền sửa",
    anotherUserTakenOver: "Người khác đã giành quyền sửa mục này.",
    editingTakenOver: "Bạn đã bị giành quyền sửa",
    documentOutOfDate: "Mục này vừa được người khác cập nhật. Tải lại để xem bản mới nhất.",
    reloadDocument: "Tải lại",
    documentModified: "Mục đã được sửa",
    // Tên màn chính thống nhất "Tổng quan".
    dashboard: "Tổng quan",
    backToDashboard: "Về trang Tổng quan",
    adminTheme: "Giao diện trang quản trị",
    // Phòng hờ: chỉ hiện ở menu trái khi có mục không thuộc nhóm nào.
    collections: "Mục quản lý",
    globals: "Cài đặt website",
  },
  localization: {
    // Sao chép sang ngôn ngữ khác.
    cannotCopySameLocale: "Không thể sao chép sang cùng một ngôn ngữ",
  },
  operators: {
    // Toán tử bộ lọc; thông báo xuất Excel trong `export-filters.ts` trích đúng các chữ này.
    equals: "là",
    isNotEqualTo: "không phải",
    isIn: "là một trong",
    isNotIn: "không thuộc",
    exists: "có giá trị",
    isNotLike: "không giống",
  },
  upload: {
    // Thư viện media và tệp CV: thống nhất "tệp".
    bulkUpload: "Tải lên nhiều tệp",
    addFile: "Thêm tệp",
    dragAndDrop: "Kéo thả tệp vào đây",
    dragAndDropHere: "hoặc kéo thả tệp vào đây",
    fileName: "Tên tệp",
    fileSize: "Dung lượng",
    selectFile: "Chọn tệp",
    fileToUpload: "Tệp sẽ tải lên",
    filesToUpload: "Tệp sẽ tải lên",
    pasteURL: "Dán địa chỉ tệp",
    selectCollectionToBrowse: "Chọn thư viện để tìm",
    setFocalPoint: "Đặt điểm trọng tâm",
    focalPointDescription: "Kéo điểm trọng tâm trực tiếp trên ảnh xem trước hoặc chỉnh giá trị bên dưới.",
    sizes: "Các cỡ ảnh",
    crop: "Cắt ảnh",
  },
  validation: {
    // Kiểm tra dữ liệu nhập: "trường" thay "field".
    invalidSelection: "Lựa chọn ở trường này không hợp lệ.",
    invalidSelections: "Trường này có lựa chọn không hợp lệ:",
    fieldHasNo: "Trường này chưa có: {{label}}",
    validUploadID: "Trường này chưa có tệp tải lên hợp lệ.",
    requiresTwoNumbers: "Cần nhập đủ kinh độ và vĩ độ.",
    notValidDate: '"{{value}}" không phải ngày hợp lệ.',
  },
  version: {
    // Lịch sử chỉnh sửa (collection bật versions, không bản nháp).
    versions: "Lịch sử chỉnh sửa",
    versionID: "Mã phiên bản",
    changedFieldsCount_one: "{{count}} trường đã thay đổi",
    currentPublishedVersion: "Phiên bản hiện tại",
    previousVersion: "Phiên bản trước",
    noLabelGroup: "Nhóm chưa có tên",
    modifiedOnly: "Chỉ trường đã đổi",
    selectLocales: "Chọn ngôn ngữ để hiển thị",
  },
};
