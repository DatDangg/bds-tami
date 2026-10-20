# feature-admin-vietnamese-wording · phase-1-task-01 — Ghi đè chữ tiếng Việt mặc định của Payload trong admin (BL-040)

- Change doc: `spec/changes/2026-10-20-admin-vietnamese-wording.md` (BACKLOG BL-040).
- Thứ tự đợt (user chốt): **BL-040** → BL-039 → BL-041.
- Task anh em: `phase-1-task-02.md` (nhãn của dự án). Hai task sửa file khác nhau → chạy song song được; riêng thông báo bộ lọc
  `src/lib/leads/export-filters.ts:143-145` phải đổi cùng T01 vì nó trích nguyên văn chữ toán tử/giá trị của Payload.
- Trạng thái: `done` — Reviewer NORMAL PASS r1+r2 (`.context/review-reports/feature-admin-vietnamese-wording-phase-1-task-01-round-{1,2}-review.md`); user duyệt checkpoint 2026-10-20 "ok theo đề xuất": **Q1–Q10 đều theo khuyến nghị** (Q1 A giữ "Lead", bỏ lặp "Lead khách hàng"; Q2 "Tin bất động sản" trong admin; Q3 "Sale phụ trách" mọi chỗ; Q4 "Tệp CV ứng viên" + "tệp"; Q5 "Ngày X"; Q6 đổi toán tử lọc + sửa export-filters.ts + test; Q7 "tài liệu" → "mục"; Q8 "Dữ liệu nền" / "Mục quản lý" / "Cài đặt website"; Q9 giữ từ mượn; Q10 chấp nhận lệch xoá/xóa). Cột slug thô → BL-043 (ngoài phạm vi). BL-039 sau này dùng "Tiếng Việt / Tiếng Anh".

## Classification / Risk
- Type: **MODIFY** (chỉ đổi chữ hiển thị; không đổi slug/schema/URL/access/dữ liệu).
- Risk: **LOW–MEDIUM** — `i18n.translations.vi` ảnh hưởng mọi màn admin (shared). Chữ toán tử bộ lọc dính với thông báo lỗi xuất Excel
  (`export-filters.ts` + test `export-filters.test.ts:159,246`).
- Expected review level: **NORMAL** (shared UI copy; STRICT nếu chọn đổi toán tử bộ lọc Q6 vì đụng thông báo xuất lead).
- Blast radius: toàn bộ admin (danh sách, form, thùng rác, phiên bản, đăng nhập/tài khoản, toast lỗi, tải lên).
- Doc impact: FR-ADM-19 (nhãn admin) → spec delta + spec-publisher sau khi duyệt.

## Phạm vi đã rà
- Gói `@payloadcms/translations@3.91.0` `dist/languages/vi.js`: **586 khoá** đọc hết; chỉ giữ khoá thực sự hiện trên màn dự án dùng
  (đối chiếu `@payloadcms/ui` / `@payloadcms/next` dùng khoá ở đâu + cấu hình dự án).
- Không hiện → **không đổi**: `dashboard.*` (dùng view Tổng quan riêng), `folder.*` (không bật thư mục), `general.clear/clearAll`
  (chỉ GroupBy/Folder — không bật), API Key (`useAPIKey` tắt), bản nháp/xuất bản/lên lịch (`drafts: false` → `version.unpublish` "Ẩn tài liệu",
  `publish*`, `schedule*` không hiện), phiên bản global (global không bật versions), `emailOrUsername`/`username` (đăng nhập bằng email),
  `livePreview`, `import`, `groupBy`, email mời/đặt lại mật khẩu (nội dung email, không phải màn admin).
- `general.collections` / `general.globals` chỉ hiện ở menu trái khi có mục **không thuộc nhóm** — hiện mọi mục đều có nhóm
  (`admin-groups.ts` throw nếu thiếu) → không thấy trên màn; đề xuất ghi đè **phòng hờ** (mục 8, Q8).

## Bảng đề xuất (chỉ chuỗi cần đổi)

Ký hiệu: **[Qn]** = cần user chốt (xem cuối file). Cột nguồn là khoá i18n trong `vi.js`.

### 1. Danh sách, tìm kiếm, bộ lọc (mọi collection)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `general.trash` (nút góc phải danh sách) | Rác | Thùng rác | User chốt; "Rác" cụt, khó hiểu |
| `general.deletedAt` (cột thùng rác) | Đã Xóa Lúc | Ngày xoá | User chốt; viết hoa lẫn; khớp "Ngày tạo"/"Ngày cập nhật" |
| `general.noResults` (danh sách rỗng) | Danh sách rỗng: {{label}}. Có thể {{label}} chưa tồn tại hoặc không có dữ kiện trùng với bộ lọc hiện tại. | Chưa có {{label}} nào, hoặc không có mục nào khớp bộ lọc hiện tại. | Câu dịch máy, "dữ kiện", lặp nhãn |
| `general.noResultsDescription` | Hoặc là không có hoặc không có gì phù hợp với các bộ lọc bạn đã chỉ định ở trên. | Chưa có dữ liệu, hoặc không có mục nào khớp bộ lọc ở trên. | Câu lủng củng |
| `general.searchBy` (ô tìm) | Tìm với {{label}} | Tìm theo {{label}} | Sai giới từ |
| `general.filterWhere` | Lọc {{label}} với điều kiện: | Lọc {{label}} theo điều kiện: | Giới từ tự nhiên hơn |
| `general.descending` (menu sắp xếp) | Xếp theo thứ tự giảm dần | Giảm dần | Không cân với "Tăng dần" |
| `general.and` (giữa các điều kiện lọc) | Và | và | Viết hoa giữa câu (đối xứng "hoặc") |
| `general.true` (giá trị lọc ô tích / "có giá trị") **[Q6]** | Đúng | Có | "Sale phụ trách tồn tại = Sai" khó hiểu |
| `general.false` **[Q6]** | Sai | Không | như trên |
| `operators.equals` **[Q6]** | bằng | là | "Trạng thái bằng Mới" → "Trạng thái là Mới" |
| `operators.isNotEqualTo` **[Q6]** | không bằng | không phải | như trên |
| `operators.isIn` **[Q6]** | có trong | là một trong | Nghĩa rõ hơn khi chọn nhiều giá trị |
| `operators.isNotIn` **[Q6]** | không có trong | không thuộc | như trên |
| `operators.exists` **[Q6]** | tồn tại | có giá trị | "tồn tại" là thuật ngữ kỹ thuật (exists) |
| `operators.isNotLike` | không giống như | không giống | Đối xứng "gần giống" |
| `src/lib/leads/export-filters.ts:143-145` (thông báo xuất Excel lỗi bộ lọc) **[Q6]** | …với "bằng"; … "có trong"; … "tồn tại" = Sai … | đổi theo chữ toán tử mới ("là", "là một trong", "có giá trị" = Không) | Thông báo trích nguyên văn chữ trên màn lọc — phải khớp |

### 2. Thùng rác, xoá, khôi phục
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `general.aboutToTrash` (hộp xác nhận) | Bạn đang chuẩn bị di chuyển {{label}} <1>{{title}}</1> vào thùng rác. Bạn có chắc không? | Chuyển {{label}} <1>{{title}}</1> vào thùng rác? Có thể khôi phục lại trong Thùng rác. | Ngắn, nói rõ khôi phục được |
| `general.aboutToTrashCount` | Bạn đang chuẩn bị chuyển {{count}} {{label}} vào thùng rác | Chuyển {{count}} {{label}} vào thùng rác? Có thể khôi phục lại trong Thùng rác. | như trên |
| `general.aboutToDelete` (xoá nhân viên — collection không có thùng rác) | Chuẩn bị xóa {{label}} <1>{{title}}</1>. Bạn có muốn tiếp tục không? | Bạn sắp xoá {{label}} <1>{{title}}</1>. Tiếp tục? | Câu dịch máy |
| `general.documentIsTrashed` (mở mục trong thùng rác) | {{label}} này đã bị xóa và chỉ có thể xem. | {{label}} này đang ở thùng rác nên chỉ xem được. Khôi phục để sửa. | "đã bị xoá" gây hiểu nhầm mất hẳn |
| `general.titleDeleted` (toast) | {{label}} {{title}} đã được xóa thành công. | {{label}} "{{title}}" đã được xoá. | Thiếu ngoặc, lệch với `titleTrashed` |

### 3. Form sửa, khoá sửa đồng thời, bản sao
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `general.saveChanges` | Lưu Thay Đổi | Lưu thay đổi | Viết hoa mọi chữ |
| `general.lastModified` (thanh trên form) | Chỉnh sửa lần cuối vào lúc | Sửa lần cuối | Dài, dịch máy |
| `general.duplicateWithoutSaving` | Không lưu dữ liệu và tạo bản sao | Bỏ thay đổi chưa lưu và tạo bản sao | Nghĩa gốc: bỏ thay đổi chưa lưu |
| `general.leaveAnyway` (hộp rời trang chưa lưu) | Tiếp tục thoát | Vẫn rời trang | Rõ hành động |
| `fields.collapseAll` (mảng: điểm nổi bật, bảng giá, FAQ, menu…) | Ẩn toàn bộ | Thu gọn tất cả | "Ẩn" dễ hiểu nhầm là ẩn khỏi website |
| `fields.showAll` | Hiển thị toàn bộ | Mở rộng tất cả | Cặp với "Thu gọn tất cả" |
| `general.document` / `general.documents` (bảng "Lịch sử chăm sóc" trong Lead) **[Q7]** | Tài liệu | Mục | Trong BĐS "tài liệu" = brochure/hồ sơ; ở đây là bản ghi |
| `general.documentLocked` **[Q7]** | Tài liệu bị khóa | Mục đang có người sửa | Nghĩa thật: người khác đang mở sửa |
| `general.currentlyEditing` **[Q7]** | hiện đang chỉnh sửa tài liệu này. Nếu bạn tiếp quản, họ sẽ bị chặn tiếp tục chỉnh sửa và cũng có thể mất các thay đổi chưa lưu. | đang sửa mục này. Nếu bạn giành quyền sửa, người đó sẽ không sửa tiếp được và có thể mất thay đổi chưa lưu. | "tiếp quản" khó hiểu |
| `general.takeOver` | Tiếp quản | Giành quyền sửa | như trên |
| `general.anotherUserTakenOver` **[Q7]** | Người dùng khác đã tiếp quản việc chỉnh sửa tài liệu này. | Người khác đã giành quyền sửa mục này. | như trên |
| `general.editingTakenOver` | Chỉnh sửa đã được tiếp quản | Bạn đã bị giành quyền sửa | như trên |
| `general.documentOutOfDate` **[Q7]** | Tài liệu này đã được cập nhật gần đây bởi một người dùng khác. Chế độ xem của bạn đã lỗi thời. | Mục này vừa được người khác cập nhật. Tải lại để xem bản mới nhất. | "Chế độ xem lỗi thời" dịch máy |
| `general.reloadDocument` **[Q7]** | Tải lại tài liệu | Tải lại | |
| `general.documentModified` **[Q7]** | Tài liệu đã được sửa đổi | Mục đã được sửa | |
| `localization.cannotCopySameLocale` (Sao chép sang ngôn ngữ) | Không thể sao chép vào cùng một vị trí | Không thể sao chép sang cùng một ngôn ngữ | Sai nghĩa ("locale" ≠ vị trí) |
| `fields.customURL` (hộp chèn liên kết trong ô soạn thảo) | URL tùy chỉnh | Địa chỉ web tự nhập | Bỏ "URL" |
| `fields.enterURL` | Nhập một URL | Nhập địa chỉ web | |
| `fields.chooseBetweenCustomTextOrDocument` | Chọn giữa nhập URL văn bản tùy chỉnh hoặc liên kết đến tài liệu khác. | Nhập địa chỉ web, hoặc chọn một trang/bài có sẵn để liên kết. | Dịch máy |
| `fields.chooseDocumentToLink` | Chọn một tài liệu để liên kết đến | Chọn trang/bài để liên kết | |
| `fields.textToDisplay` | Văn bản để hiển thị | Chữ hiển thị | |

### 4. Thông báo lỗi & kiểm tra dữ liệu nhập (toast)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `error.correctInvalidFields` | Lỗi - Xin hãy sửa lại những fields không hợp lệ. | Vui lòng sửa các trường chưa hợp lệ. | Lẫn "fields" |
| `error.followingFieldsInvalid_one` | Lỗi - Field sau không hợp lệ: | Trường sau chưa hợp lệ: | Lẫn "Field" |
| `error.followingFieldsInvalid_other` | Lỗi - Những fields sau không hợp lệ: | Các trường sau chưa hợp lệ: | |
| `error.unknown` | Lỗi - Không xác định (unknown error). | Đã có lỗi xảy ra. Vui lòng thử lại. | Lẫn tiếng Anh |
| `error.unspecific` | Lỗi - Đã xảy ra (unspecific error). | Đã có lỗi xảy ra. Vui lòng thử lại. | Câu cụt + tiếng Anh |
| `error.notAllowedToPerformAction` | Lỗi - Bạn không có quyền thực hiện lệnh này. | Bạn không có quyền thực hiện thao tác này. | "lệnh" |
| `error.notAllowedToAccessPage` | Lỗi - Bạn không có quyền truy cập trang này. | Bạn không có quyền vào trang này. | Bỏ tiền tố "Lỗi -" |
| `error.unauthorized` | Lỗi - Bạn cần phải đăng nhập trước khi thực hiện thao tác này. | Bạn cần đăng nhập để thực hiện thao tác này. | |
| `error.valueMustBeUnique` (trùng mã/đường dẫn/email) | Lỗi - Giá trị không được trùng lặp. | Giá trị này đã được dùng, vui lòng nhập giá trị khác. | Nói rõ cách sửa |
| `error.documentNotFound` **[Q7]** | Tài liệu có ID {{id}} không thể tìm thấy. Nó có thể đã bị xóa hoặc chưa từng tồn tại, hoặc bạn có thể không có quyền truy cập vào nó. | Không tìm thấy mục có mã {{id}}. Mục có thể đã bị xoá, chưa từng tồn tại hoặc bạn không có quyền xem. | "ID", dịch máy |
| `error.loadingDocument` | Lỗi - Đã xảy ra vấn để khi tải bản tài liệu với ID {{id}}. | Không tải được mục có mã {{id}}. | Lỗi chính tả "vấn để" |
| `error.noFilesUploaded` | Lỗi - File chưa được tải lên. | Chưa có tệp nào được tải lên. | "File" |
| `error.problemUploadingFile` | Lỗi - Đã xảy ra vấn để khi tải lên file sau. | Không tải lên được tệp. | Lỗi chính tả + "file" |
| `error.invalidFileType` | Lỗi - Định dạng tệp không hợp lệ. | Định dạng tệp không hợp lệ. | Bỏ tiền tố |
| `error.invalidFileTypeValue` | Lỗi - Định dạng tệp không hợp lệ: {{value}}. | Định dạng tệp không hợp lệ: {{value}}. | |
| `validation.invalidSelection` | Lựa chọn ở field này không hợp lệ. | Lựa chọn ở trường này không hợp lệ. | "field" |
| `validation.invalidSelections` | 'Field này có những lựa chọn không hợp lệ sau:' (dính dấu nháy) | Trường này có lựa chọn không hợp lệ: | Lỗi gói (nháy thừa) + "Field" |
| `validation.fieldHasNo` | Field này không có: {{label}} | Trường này chưa có: {{label}} | "Field" |
| `validation.validUploadID` | 'Field này không chứa ID tải lên hợp lệ.' (dính dấu nháy) | Trường này chưa có tệp tải lên hợp lệ. | Lỗi gói + "Field", "ID" |
| `validation.requiresTwoNumbers` (Toạ độ bản đồ) | Trường này cần tối thiểu 2 chữ số. | Cần nhập đủ kinh độ và vĩ độ. | Sai nghĩa ("2 số" ≠ "2 chữ số") |
| `validation.notValidDate` | "{{value}}" không phải là một ngày (date) hợp lệ. | "{{value}}" không phải ngày hợp lệ. | Lẫn "(date)" |

### 5. Đăng nhập, tài khoản, phiên làm việc
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `error.emailOrPasswordIncorrect` (đăng nhập) | Lỗi - Email hoặc mật khẩu không chính xác. | Email hoặc mật khẩu không đúng. | Bỏ tiền tố |
| `error.userLocked` | Lỗi- Tài khoản đã bị khóa do đăng nhập thất bại nhiều lần. | Tài khoản tạm bị khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau. | Khoá có thời hạn (`lockTime`) → nói "tạm", hướng dẫn |
| `error.unauthorizedAdmin` | Lỗi - Người dùng không có quyền truy cập vào bảng điều khiển. | Tài khoản này không có quyền vào trang quản trị. | |
| `error.tokenInvalidOrExpired` (link đặt lại mật khẩu) | Lỗi - Token không hợp lệ hoặc đã hết hạn. | Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại. | "Token" |
| `authentication.resetPassword` / `resetYourPassword` | Tạo lại mật khẩu | Đặt lại mật khẩu | Thống nhất với "Đặt lại mật khẩu thành công", nhật ký "Đặt lại mật khẩu" |
| `authentication.forgotPasswordEmailInstructions` | Nhập email của bạn để nhận hướng dẫn tạo lại mật khẩu. | Nhập email để nhận hướng dẫn đặt lại mật khẩu. | như trên |
| `authentication.emailNotValid` | Email không chính xác | Email không hợp lệ | Sai nghĩa (định dạng) |
| `authentication.loggedOutInactivity` | Bạn đã tự động đăng xuất sau một khoản thời gian dài không thao tác. | Bạn đã được tự động đăng xuất vì lâu không thao tác. | Lỗi chính tả "khoản" |
| `authentication.youAreInactive` | Bạn đã không thao tác trong một khoảng thời gian, và sẽ bị tự động đăng xuất vì lý do bảo mật. Bạn có muốn tiếp tục phiên đăng nhập. | Bạn đã không thao tác một lúc và sẽ được tự động đăng xuất để bảo mật. Bạn muốn tiếp tục làm việc? | Câu hỏi thiếu "?" |
| `general.dashboard` (breadcrumb đầu mọi màn) | Bảng điều khiển | Tổng quan | Thống nhất tên màn chính (BL-015 T04, BL-041) |
| `general.backToDashboard` | Quay lại bảng điều khiển | Về trang Tổng quan | như trên |
| `general.adminTheme` (Tài khoản) | Giao diện bảng điều khiển | Giao diện trang quản trị | như trên |

### 6. Lịch sử phiên bản (collection nội dung, `versions` bật, không bản nháp)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `version.versions` (tab + tiêu đề trang) | Danh sách phiên bản | Lịch sử chỉnh sửa | Người dùng hiểu "lịch sử sửa" hơn "phiên bản" |
| `version.versionID` (cột) | ID của phiên bản | Mã phiên bản | "ID" |
| `version.changedFieldsCount_one` | {{count}} đã thay đổi trường | {{count}} trường đã thay đổi | Sai trật tự từ |
| `version.currentPublishedVersion` | Phiên bản Đã Xuất bản Hiện tại | Phiên bản hiện tại | Viết hoa lẫn |
| `version.previousVersion` | Phiên bản Trước | Phiên bản trước | Viết hoa |
| `version.noLabelGroup` | Nhóm Chưa có tên | Nhóm chưa có tên | Viết hoa |
| `version.modifiedOnly` (công tắc so sánh) | Chỉ được sửa đổi | Chỉ trường đã đổi | Sai nghĩa |
| `version.selectLocales` | Chọn ngôn ngữ để hiện thị | Chọn ngôn ngữ để hiển thị | Lỗi chính tả |

### 7. Tải lên (Thư viện media, CV)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `upload.bulkUpload` (nút danh sách media) | Tải lên số lượng lớn | Tải lên nhiều tệp | Dịch máy |
| `upload.addFile` | Thêm tập tin | Thêm tệp | Thống nhất "tệp" (cạnh `addFiles` = "Thêm tệp") **[Q4]** |
| `upload.dragAndDrop` | Kéo và thả một tập tin | Kéo thả tệp vào đây | |
| `upload.dragAndDropHere` | hoặc kéo và thả file vào đây | hoặc kéo thả tệp vào đây | "file" |
| `upload.fileName` (cột/ô) | Tên file | Tên tệp | "file" |
| `upload.fileSize` | Dung lượng file | Dung lượng | "file" |
| `upload.selectFile` | Chọn một file | Chọn tệp | "file" |
| `upload.fileToUpload` / `filesToUpload` | Tệp để Tải lên | Tệp sẽ tải lên | Viết hoa giữa câu |
| `upload.pasteURL` | Dán URL | Dán địa chỉ tệp | "URL" |
| `upload.selectCollectionToBrowse` | Chọn một Collection để tìm | Chọn thư viện để tìm | "Collection" |
| `upload.setFocalPoint` | Đặt điểm tiêu điểm | Đặt điểm trọng tâm | Lặp từ; thống nhất với "Điểm trọng tâm" |
| `upload.focalPointDescription` | Kéo điểm tiêu điểm trực tiếp… | Kéo điểm trọng tâm trực tiếp trên ảnh xem trước hoặc chỉnh giá trị bên dưới. | như trên |
| `upload.sizes` | Các độ phân giải | Các cỡ ảnh | Sai nghĩa (là các kích thước ảnh sinh ra) |
| `upload.crop` | Cắt xén | Cắt ảnh | Tự nhiên hơn |

### 8. Phòng hờ (hiện tại KHÔNG thấy trên màn — ghi đè để không bao giờ lộ) **[Q8]**
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `general.collections` (tiêu đề nhóm menu cho mục không có nhóm) | Collections | Mục quản lý | Tiếng Anh; user gợi ý "Danh mục quản lý" nhưng trùng tên nhóm "Danh mục" |
| `general.globals` | Cấu hình chung (globals) | Cài đặt website | Lẫn "globals"; trùng tên global "Cấu hình chung" |

**Tổng: 586 khoá rà → 102 khoá Payload đề xuất ghi đè** (1: 16 · 2: 5 · 3: 22 · 4: 21 · 5: 13 · 6: 8 · 7: 15 · 8: 2; dòng ghép `/` tính theo số khoá)
**+ 1 chuỗi dự án dính kèm** (`export-filters.ts:143-145`, chỉ khi chọn Q6).
Ghi chú: "xóa"/"hủy"/"khóa" (kiểu bỏ dấu cũ) của Payload để nguyên ở các chuỗi không đổi; chuỗi đã ghi đè viết "xoá/khoá" theo dự án **[Q10]**.

## Kế hoạch code (sau khi duyệt)
1. Tạo `src/lib/admin/payload-vi-overrides.ts` — một object duy nhất `PAYLOAD_VI_OVERRIDES` (kiểu `DeepPartial` của `viTranslations`,
   nhóm theo namespace, comment 1 dòng/nhóm). `src/payload.config.ts:96` đổi thành `translations: { vi: PAYLOAD_VI_OVERRIDES }`
   (giữ `general.noLabel: "—"` đã có, chuyển vào object này).
2. Test `src/lib/admin/payload-vi-overrides.test.ts`:
   - khoá chuỗi: snapshot/assert từng khoá đã đổi (chống bị ghi đè ngược khi nâng Payload);
   - mọi khoá override **tồn tại** trong `viTranslations` của gói (bắt khoá gõ sai/khoá bị đổi tên khi nâng Payload);
   - placeholder `{{…}}` và thẻ `<0>/<1>` của từng chuỗi override khớp chuỗi gốc (không làm vỡ nội suy);
   - không còn "Collections", "globals", "Rác", "Đã Xóa Lúc", "field", "URL", "Token", "ID " trong các khoá đã override.
3. Nếu chọn Q6: sửa `src/lib/leads/export-filters.ts:143-145` + `export-filters.test.ts:159,246` theo chữ mới.
4. Verify: `pnpm vitest run src/lib/admin src/lib/leads`, `pnpm typecheck`, `pnpm lint`; xem nhanh admin thật (danh sách Lead/Dự án,
   Thùng rác, bộ lọc, phiên bản, đăng nhập sai) nếu dev server sẵn.
- KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, `src/components/projects/*`, `.claude/launch.json`, `template-feedback.md`.
- Không cần migration (`importMap`/types không đổi).

## Acceptance
- [ ] Mọi chuỗi trong bảng (theo lựa chọn Q) hiện đúng trên admin; không còn "Rác", "Đã Xóa Lúc", "fields", "unknown error".
- [ ] Ghi đè ở MỘT nơi (`PAYLOAD_VI_OVERRIDES`) + test khoá chuỗi + test khoá tồn tại + placeholder khớp.
- [ ] Không đổi slug/schema/URL/access.
- [ ] Verify commands PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Câu hỏi cần user chốt
Dùng chung T01/T02 — danh sách Q1–Q10 ở cuối `phase-1-task-02.md`. T01 phụ thuộc: Q4 (tệp/file), Q6 (toán tử bộ lọc), Q7 ("tài liệu" → "mục"),
Q8 (Collections/globals), Q10 (xóa/xoá).

## Verification summary (builder)
- Code: `src/lib/admin/payload-vi-overrides.ts` (PAYLOAD_VI_OVERRIDES, 102 khoá Payload + noLabel), test `payload-vi-overrides.test.ts` (giá trị từng khoá, khoá tồn tại, placeholder khớp, không còn chữ Anh), `src/payload.config.ts` i18n -> `translations: { vi: PAYLOAD_VI_OVERRIDES }`, `export-filters.ts` + test đổi sang "là" / "là một trong" / "có giá trị" = Không.
- `pnpm vitest run src/lib/admin src/lib/leads`: PASS (12 files, 130 tests; một lần chạy giữa chừng có `admin-label-scan.test.ts` fail do file T02 đang sửa dở, lần sau hết).
- `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope).
- `pnpm typecheck`: PASS (lúc chạy lại; lần đầu có lỗi `nav-link.ts NAV_LINK_DESCRIPTION` của file T02 đang sửa dở).
- Chưa xem admin thật trên trình duyệt.

Round 2 fixes (BL-040 T01):
- tests/integration/access.test.ts: regex khoá/khóa chấp nhận cả hai dạng (override không đổi).
- export-filters.ts: comment trỏ về payload-vi-overrides.ts; export-filters.test.ts thêm test dựng chữ từ PAYLOAD_VI_OVERRIDES (equals/isIn/exists/general.false).
- Verify: vitest nhóm unit 550 pass; access + admin-dashboard integration 33 pass; typecheck OK; lint 0 error.
