# Báo cáo điền dữ liệu cũ — listing fields (BL-052)

- Thời điểm chạy: 2026-10-22 01:34 (giờ VN)
- Chế độ: **Ghi thật (`--apply`)**
- Collection: `property-posts`
- Quy tắc: chỉ điền ô đang trống (không ghi đè giá trị admin đã nhập), trích từ nội dung tiếng Việt; không xuất bản / đổi trạng thái tin; không xếp job dịch tự động.
- Độ tin cậy: **cao** = từ tên / tiêu đề / danh mục / bảng giá / danh sách tiện ích; **trung bình** = từ mô tả ngắn / tóm tắt / tổng quan / nội dung (cần soát).
- Giá trị mơ hồ (nhiều giá trị khác nhau, chỉ có khoảng, hướng ban công…) không điền — ghi ở "Cần admin soát". Tin BĐS ưu đãi / voucher bỏ qua cả tin.
- Tin chưa xuất bản chỉ ghi id + trường + giá trị (không tên, không đoạn nội dung).

## Tin BĐS (`property-posts`)

| Chỉ số | Số tin |
|---|---|
| Tin quét | 38 |
| Đã điền (ít nhất 1 ô) | 37 |
| Không điền — mọi ô đã có giá trị | 0 |
| Không điền — có ô trống nhưng không trích được | 0 |
| Bỏ qua (tin ưu đãi / voucher) | 1 |
| Lỗi khi ghi | 0 |

| Trường | Đã điền | Đã có giá trị (giữ nguyên) | Ô trống, không trích được |
|---|---|---|---|
| Loại hình (`propertyType`) | 36 | 0 | 1 |
| Diện tích (m²) (`areaM2`) | 14 | 0 | 23 |
| Số phòng ngủ (`bedrooms`) | 12 | 0 | 25 |
| Số phòng tắm (`bathrooms`) | 12 | 0 | 25 |
| Hướng nhà (`houseDirection`) | 20 | 0 | 17 |
| Mặt tiền (m) (`frontageM`) | 6 | 0 | 31 |
| Số tầng (`floors`) | 9 | 0 | 28 |
| Địa chỉ (`address`) | 0 | 0 | 37 |

### Chi tiết giá trị đã điền

| Tin | Trường | Giá trị | Đoạn nguồn | Nguồn | Độ tin cậy |
|---|---|---|---|---|---|
| (chưa xuất bản) id `a1486628-c170-44ce-adc5-ff0323327034` | Loại hình | Căn hộ (apartment) | (ẩn — tin chưa xuất bản) | tiêu đề | cao |
| Bán căn Kosmo 3 ngủ căn góc siêu đẹp | Diện tích (m²) | 126 m² | …căn Kosmo 3 ngủ căn góc siêu đẹp, diện tích 126 m². | tóm tắt | trung bình |
| Bán căn Kosmo 3 ngủ căn góc siêu đẹp | Số phòng ngủ | 3 | Bán căn Kosmo 3 ngủ căn góc siêu đẹp | tiêu đề | cao |
| Bán căn Kosmo 3 ngủ căn góc siêu đẹp | Số phòng tắm | 2 | …ông tin chính Diện tích: 126 m² Phòng ngủ: 3 Phòng tắm: 2 Tầng: Tầng cao Nội thất: Đầy đủ Liên hệ TAMI… | nội dung | trung bình |
| Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | Loại hình | Căn hộ (apartment) | Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1… | tiêu đề | cao |
| Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | Diện tích (m²) | 38 m² | …ung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | tiêu đề | cao |
| Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | Số phòng ngủ | 1 | …ư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | tiêu đề | cao |
| Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | Số phòng tắm | 1 | …Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | Loại hình | Căn hộ (apartment) | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tần… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | Diện tích (m²) | 85 m² | …án căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | Số phòng ngủ | 2 | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | Số phòng tắm | 1 | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 85 m² tầng thấp hướng Tây tứ trạch | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn hồ | Loại hình | Căn hộ (apartment) | Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cử… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn hồ | Diện tích (m²) | 83 m² | Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn hồ | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn hồ | Số phòng ngủ | 2 | Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch n… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn hồ | Số phòng tắm | 1 | Bán căn hộ Starlake The Prime 2PN–1WC 83 m² tầng cao cửa hướng Đông tứ trạch nhìn… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | Loại hình | Căn hộ (apartment) | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tần… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | Diện tích (m²) | 79 m² | …chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | Số phòng ngủ | 2 | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | Số phòng tắm | 1 | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam | Hướng nhà | Tây Nam (SW) | …h Diện tích: 79 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Tây Nam View: Công viên Nội thất: Đầy đủ Liên hệ TAM… | nội dung | trung bình |
| Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | Loại hình | Căn hộ (apartment) | Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp c… | tiêu đề | cao |
| Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | Diện tích (m²) | 77 m² | Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | tiêu đề | cao |
| Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | Số phòng ngủ | 2 | Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa h… | tiêu đề | cao |
| Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | Số phòng tắm | 1 | Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng… | tiêu đề | cao |
| Bán căn hộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | Hướng nhà | Tây Bắc (NW) | …ộ 2PN–1WC Starlake The Prime 77 m² tầng thấp cửa hướng Tây Bắc view nội khu | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | Loại hình | Căn hộ (apartment) | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tần… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | Diện tích (m²) | 86 m² | …án căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | Số phòng ngủ | 2 | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam n… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | Số phòng tắm | 1 | Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ | Hướng nhà | Đông Nam (SE) | …h Diện tích: 86 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông Nam View: Hồ Nội thất: Đầy đủ Liên hệ TAMI để nh… | nội dung | trung bình |
| Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên | Loại hình | Căn hộ (apartment) | Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên | Diện tích (m²) | 84 m² | Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên | Số phòng ngủ | 2 | Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên | Số phòng tắm | 1 | Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhì… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên | Hướng nhà | Đông Bắc (NE) | …h Diện tích: 84 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông Bắc View: Công viên Nội thất: Đầy đủ Liên hệ TAM… | nội dung | trung bình |
| Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | Loại hình | Căn hộ (apartment) | Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tần… | tiêu đề | cao |
| Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | Diện tích (m²) | 82 m² | …án căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | tiêu đề | cao |
| Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | Số phòng ngủ | 2 | Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hư… | tiêu đề | cao |
| Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | Số phòng tắm | 1 | Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng… | tiêu đề | cao |
| Bán căn hộ 2 phòng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | Hướng nhà | Nam (S) | …ng ngủ 1WC Starlake The Prime 82 m² tầng cao cửa hướng Nam view nội khu | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | Loại hình | Căn hộ (apartment) | Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ba… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | Diện tích (m²) | 80 m² | Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | Số phòng ngủ | 2 | Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn h… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | Số phòng tắm | 1 | Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ | Hướng nhà | Tây (W) | …m² Phòng ngủ: 2 Phòng tắm: 1 Tầng: Tầng cao Hướng: Tây View: Hồ Nội thất: Đầy đủ Liên hệ TAMI để nh… | nội dung | trung bình |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | Loại hình | Căn hộ (apartment) | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tần… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | Diện tích (m²) | 78 m² | …chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | Số phòng ngủ | 2 | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | Số phòng tắm | 1 | Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viê… | tiêu đề | cao |
| Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | Hướng nhà | Bắc (N) | …e The Prime 2 phòng ngủ 1WC 78 m² tầng trung cửa hướng Bắc nhìn công viên | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | Loại hình | Căn hộ (apartment) | Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ba… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | Diện tích (m²) | 76 m² | Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | Số phòng ngủ | 2 | Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | Số phòng tắm | 1 | Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội… | tiêu đề | cao |
| Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu | Hướng nhà | Đông (E) | …h Diện tích: 76 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông View: Công viên Nội thất: Đầy đủ Liên hệ TAM… | nội dung | trung bình |
| Bán biệt thự đơn lập Tây Tứ Trạch Elegant Park Thạch Bàn sân vườn rộng - Xây thô 3.5 tầng có hầm | Loại hình | Biệt thự (villa) | Bán biệt thự đơn lập Tây Tứ Trạch Elegant Park Thạch Bàn… | tiêu đề | cao |
| Bán biệt thự đơn lập Tây Tứ Trạch Elegant Park Thạch Bàn sân vườn rộng - Xây thô 3.5 tầng có hầm | Số tầng | 3.5 tầng | …egant Park Thạch Bàn sân vườn rộng - Xây thô 3.5 tầng có hầm | tiêu đề | cao |
| Cần bán biệt thự song lập Đông Tứ Trạch Elegant Park Thạch Bàn kế vườn hoa - Hoàn thiện ngoài | Loại hình | Biệt thự (villa) | Cần bán biệt thự song lập Đông Tứ Trạch Elegant Park Thạch Bà… | tiêu đề | cao |
| Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum | Loại hình | Biệt thự (villa) | Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt… | tiêu đề | cao |
| Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum | Mặt tiền (m) | 11 m | …thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum | tiêu đề | cao |
| Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum | Số tầng | 3 tầng | …ark Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum | tiêu đề | cao |
| Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5 tầng nổi | Loại hình | Biệt thự (villa) | Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bà… | tiêu đề | cao |
| Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5 tầng nổi | Hướng nhà | Tây Bắc (NW) | Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5… | tiêu đề | cao |
| Bán biệt thự song lập hướng Tây Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5 tầng nổi | Số tầng | 3.5 tầng | …Bắc Elegant Park Thạch Bàn nhìn ra công viên 3.5 tầng nổi | tiêu đề | cao |
| Bán biệt thự căn góc Elegant Park Thạch Bàn - Đông Nam bàn giao mặt ngoài 3.5 tầng nổi có hầm riêng | Loại hình | Biệt thự (villa) | Bán biệt thự căn góc Elegant Park Thạch Bàn - Đông Nam bà… | tiêu đề | cao |
| Bán biệt thự căn góc Elegant Park Thạch Bàn - Đông Nam bàn giao mặt ngoài 3.5 tầng nổi có hầm riêng | Số tầng | 3.5 tầng | …Park Thạch Bàn - Đông Nam bàn giao mặt ngoài 3.5 tầng nổi có hầm riêng | tiêu đề | cao |
| Bán biệt thự đơn lập Elegant Park Thạch Bàn - Đông Bắc xây thô mặt trong x 3.5 tầng nổi có sân rộng | Loại hình | Biệt thự (villa) | Bán biệt thự đơn lập Elegant Park Thạch Bàn - Đông Bắc xâ… | tiêu đề | cao |
| Bán biệt thự đơn lập Elegant Park Thạch Bàn - Đông Bắc xây thô mặt trong x 3.5 tầng nổi có sân rộng | Số tầng | 3.5 tầng | …ark Thạch Bàn - Đông Bắc xây thô mặt trong x 3.5 tầng nổi có sân rộng | tiêu đề | cao |
| Bán căn góc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên | Loại hình | Biệt thự (villa) | Bán căn góc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam M… | tiêu đề | cao |
| Bán căn góc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên | Hướng nhà | Nam (S) | …óc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên | tiêu đề | cao |
| Bán căn góc biệt thự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên | Mặt tiền (m) | 11 m | …ự Elegant Park Thạch Bàn - Đơn lập chính Nam MT: 11m đối diện công viên | tiêu đề | cao |
| Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | Loại hình | Biệt thự (villa) | Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây… | tiêu đề | cao |
| Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | Hướng nhà | Tây (W) | …n biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | tiêu đề | cao |
| Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | Mặt tiền (m) | 10 m | …- Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | tiêu đề | cao |
| Bán biệt thự Elegant Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | Số tầng | 3 tầng | …Park Thạch Bàn - Song lập hướng Tây xây thô 3 tầng 1 tum - MT: 10m | tiêu đề | cao |
| Bán biệt thự hướng Bắc bàn giao mặt ngoài Elegant Park Thạch Bàn sân vườn rộng | Loại hình | Biệt thự (villa) | Bán biệt thự hướng Bắc bàn giao mặt ngoài Elegant Park Th… | tiêu đề | cao |
| Bán biệt thự hướng Bắc bàn giao mặt ngoài Elegant Park Thạch Bàn sân vườn rộng | Hướng nhà | Bắc (N) | Bán biệt thự hướng Bắc bàn giao mặt ngoài Elegant Park Thạch Bàn sâ… | tiêu đề | cao |
| Bán biệt thự song lập hướng Đông Elegant Park Thạch Bàn bàn giao mặt ngoài kế công viên | Loại hình | Biệt thự (villa) | Bán biệt thự song lập hướng Đông Elegant Park Thạch Bàn b… | tiêu đề | cao |
| Bán biệt thự song lập hướng Đông Elegant Park Thạch Bàn bàn giao mặt ngoài kế công viên | Hướng nhà | Đông (E) | Bán biệt thự song lập hướng Đông Elegant Park Thạch Bàn bàn giao mặt ngoài kế… | tiêu đề | cao |
| Bán Vinhomes Olympic Ngọc Hồi - Biệt thự sinh thái đẳng cấp, không gian sống xanh phía Nam Hà Nội | Loại hình | Biệt thự (villa) | Bán Vinhomes Olympic Ngọc Hồi - Biệt thự sinh thái đẳng cấp, không gian sống xanh phí… | tiêu đề | cao |
| Chính chủ bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông Nam, gần công viên thể thao | Loại hình | Biệt thự (villa) | Chính chủ bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông N… | tiêu đề | cao |
| Chính chủ bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông Nam, gần công viên thể thao | Diện tích (m²) | 250 m² | …h chủ bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông Nam, gần công viên thể thao | tiêu đề | cao |
| Chính chủ bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông Nam, gần công viên thể thao | Hướng nhà | Đông Nam (SE) | …bán biệt thự Vinhomes Olympic Ngọc Hồi 250m2 hướng Đông Nam, gần công viên thể thao | tiêu đề | cao |
| Bán căn góc liền kề Elegant Thạch Bàn - Đông Tứ Trạch vừa ở, vừa kinh doanh hoàn thiện bên ngoài | Loại hình | Nhà phố/Liền kề (townhouse) | Bán căn góc liền kề Elegant Thạch Bàn - Đông Tứ Trạch vừa ở, vừa… | tiêu đề | cao |
| Bán liền kề Elegant Park Thạch Bàn - Hướng Tây Nam bàn giao nguyên bản - Kinh doanh thuận lợi | Loại hình | Nhà phố/Liền kề (townhouse) | Bán liền kề Elegant Park Thạch Bàn - Hướng Tây Nam bàn g… | tiêu đề | cao |
| Bán liền kề Elegant Park Thạch Bàn - Hướng Tây Nam bàn giao nguyên bản - Kinh doanh thuận lợi | Hướng nhà | Tây Nam (SW) | Bán liền kề Elegant Park Thạch Bàn - Hướng Tây Nam bàn giao nguyên bản - Kinh doanh thuận lợi | tiêu đề | cao |
| Bán nhà liền kề Tây Bắc vị trí đẹp kinh doanh Elegant Park Thạc Bàn xây thô mặt trong 4 tầng | Loại hình | Nhà phố/Liền kề (townhouse) | Bán nhà liền kề Tây Bắc vị trí đẹp kinh doanh Elegant Park T… | tiêu đề | cao |
| Bán nhà liền kề Tây Bắc vị trí đẹp kinh doanh Elegant Park Thạc Bàn xây thô mặt trong 4 tầng | Số tầng | 4 tầng | …oanh Elegant Park Thạc Bàn xây thô mặt trong 4 tầng | tiêu đề | cao |
| Bán liền kề Đông Nam Elegant Park Thạch Bàn hoàn thiện bên ngoài MT: 5m kinh doanh thuận lợi | Loại hình | Nhà phố/Liền kề (townhouse) | Bán liền kề Đông Nam Elegant Park Thạch Bàn hoàn thiện b… | tiêu đề | cao |
| Bán liền kề Đông Nam Elegant Park Thạch Bàn hoàn thiện bên ngoài MT: 5m kinh doanh thuận lợi | Mặt tiền (m) | 5 m | …Elegant Park Thạch Bàn hoàn thiện bên ngoài MT: 5m kinh doanh thuận lợi | tiêu đề | cao |
| Bán nhà liền kề hướng Đông Bắc bàn giao nguyên bản - VT đẹp kinh doanh Elegant Park Thạch Bàn | Loại hình | Nhà phố/Liền kề (townhouse) | Bán nhà liền kề hướng Đông Bắc bàn giao nguyên bản - VT đẹp… | tiêu đề | cao |
| Bán nhà liền kề hướng Đông Bắc bàn giao nguyên bản - VT đẹp kinh doanh Elegant Park Thạch Bàn | Hướng nhà | Đông Bắc (NE) | Bán nhà liền kề hướng Đông Bắc bàn giao nguyên bản - VT đẹp kinh doanh Eleg… | tiêu đề | cao |
| Bán căn góc liền kề chính Nam Elegant Park Thạch Bàn - Vị trí đẹp kinh doanh đối diện công viên | Loại hình | Nhà phố/Liền kề (townhouse) | Bán căn góc liền kề chính Nam Elegant Park Thạch Bàn - Vị trí đẹ… | tiêu đề | cao |
| Bán căn góc liền kề chính Nam Elegant Park Thạch Bàn - Vị trí đẹp kinh doanh đối diện công viên | Hướng nhà | Nam (S) | Bán căn góc liền kề chính Nam Elegant Park Thạch Bàn - Vị trí đẹp kinh doa… | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn - Hướng Tây hoàn thiện bên ngoài - Vừa ở, vừa kinh doanh | Loại hình | Nhà phố/Liền kề (townhouse) | Bán nhà liền kề Elegant Park Thạch Bàn - Hướng Tây hoàn thiệ… | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn - Hướng Tây hoàn thiện bên ngoài - Vừa ở, vừa kinh doanh | Hướng nhà | Tây (W) | Bán nhà liền kề Elegant Park Thạch Bàn - Hướng Tây hoàn thiện bên ngoài - Vừa ở, vừa kinh doanh | tiêu đề | cao |
| Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | Loại hình | Nhà phố/Liền kề (townhouse) | Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4… | tiêu đề | cao |
| Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | Hướng nhà | Bắc (N) | Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt… | tiêu đề | cao |
| Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | Mặt tiền (m) | 5 m | …Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | tiêu đề | cao |
| Bán liền kề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | Số tầng | 4 tầng | …ề hướng Bắc - Elegant Park Thạch Bàn xây thô 4 tầng mặt tiền 5m vừa ở, vừa kinh doanh | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | Loại hình | Nhà phố/Liền kề (townhouse) | Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5… | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | Hướng nhà | Đông (E) | Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | Mặt tiền (m) | 5 m | …hà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | tiêu đề | cao |
| Bán nhà liền kề Elegant Park Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | Số tầng | 4 tầng | …ark Thạch Bàn hướng Đông mặt tiền 5m xây thô 4 tầng gần công viên | tiêu đề | cao |
| Bán Vinhomes Olympic Ngọc Hồi - Nhà liền kề vị trí đẹp, quy hoạch đồng bộ, tiềm năng tăng giá | Loại hình | Nhà phố/Liền kề (townhouse) | Bán Vinhomes Olympic Ngọc Hồi - Nhà liền kề vị trí đẹp, quy hoạch đồng bộ, tiềm năng tăn… | tiêu đề | cao |
| Chính chủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam, vị trí đẹp, giá tốt | Loại hình | Nhà phố/Liền kề (townhouse) | Chính chủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Na… | tiêu đề | cao |
| Chính chủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam, vị trí đẹp, giá tốt | Diện tích (m²) | 96 m² | …hủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam, vị trí đẹp, giá tốt | tiêu đề | cao |
| Bán nhà phố shophouse Elegant Park Thạch Bàn - Tây Tứ Trạch hoàn thiện bên ngoài KD thuận lợi | Loại hình | Shophouse (shophouse) | Bán nhà phố shophouse Elegant Park Thạch Bàn - Tây Tứ Trạch hoàn t… | tiêu đề | cao |

### Cần admin soát

- **Bán căn Kosmo 3 ngủ căn góc siêu đẹp** · Diện tích (m²) — Soát: 126 m² (trích từ tóm tắt) — “…căn Kosmo 3 ngủ căn góc siêu đẹp, diện tích 126 m².”
- **Bán căn Kosmo 3 ngủ căn góc siêu đẹp** · Số phòng tắm — Soát: 2 (trích từ nội dung) — “…ông tin chính Diện tích: 126 m² Phòng ngủ: 3 Phòng tắm: 2 Tầng: Tầng cao Nội thất: Đầy đủ Liên hệ TAMI…”
- **Bán chung cư D'Eldorado Nguyễn Hoàng Tôn diện tích 38m2/1PN/1WC ban công Đông Bắc view nội khu** · Hướng nhà — Hướng ban công Đông Bắc (NE) — không dùng làm hướng nhà — “…38m². Thiết kế: 1 phòng ngủ, 1 phòng khách. Ban công hướng Đông Bắc. Giá bán: 5,4 tỷ đồng. Thông tin chính Diện…”
- **Bán chung cư Starlake The Prime 2 phòng ngủ 1WC 79 m² tầng trung ban công hướng Tây Nam** · Hướng nhà — Soát: Tây Nam (SW) (trích từ nội dung) — “…h Diện tích: 79 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Tây Nam View: Công viên Nội thất: Đầy đủ Liên hệ TAM…”
- **Bán căn hộ Starlake The Prime 2 phòng ngủ 1WC 86 m² tầng cao ban công hướng Đông Nam nhìn hồ** · Hướng nhà — Soát: Đông Nam (SE) (trích từ nội dung) — “…h Diện tích: 86 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông Nam View: Hồ Nội thất: Đầy đủ Liên hệ TAMI để nh…”
- **Bán chung cư Starlake The Prime 2PN–1WC 84 m² tầng trung ban công hướng Đông Bắc nhìn công viên** · Hướng nhà — Soát: Đông Bắc (NE) (trích từ nội dung) — “…h Diện tích: 84 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông Bắc View: Công viên Nội thất: Đầy đủ Liên hệ TAM…”
- **Bán căn hộ Starlake The Prime 2PN–1WC 80m2 tầng thấp ban công hướng Tây nhìn hồ** · Hướng nhà — Soát: Tây (W) (trích từ nội dung) — “…m² Phòng ngủ: 2 Phòng tắm: 1 Tầng: Tầng cao Hướng: Tây View: Hồ Nội thất: Đầy đủ Liên hệ TAMI để nh…”
- **Bán căn hộ Starlake The Prime 2PN–1WC 76 m² tầng cao ban công hướng Đông view nội khu** · Hướng nhà — Soát: Đông (E) (trích từ nội dung) — “…h Diện tích: 76 m² Phòng ngủ: 2 Phòng tắm: 1 Hướng: Đông View: Công viên Nội thất: Đầy đủ Liên hệ TAM…”
- **Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum** · Hướng nhà — Gợi ý: Tây Nam (SW) (không có chữ "hướng" đi trước, chưa điền) — “Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum”
- **Bán biệt thự căn góc Elegant Park Thạch Bàn - Đông Nam bàn giao mặt ngoài 3.5 tầng nổi có hầm riêng** · Hướng nhà — Gợi ý: Đông Nam (SE) (không có chữ "hướng" đi trước, chưa điền) — “Bán biệt thự căn góc Elegant Park Thạch Bàn - Đông Nam bàn giao mặt ngoài 3.5 tầng nổi có hầm riêng”
- **Bán biệt thự đơn lập Elegant Park Thạch Bàn - Đông Bắc xây thô mặt trong x 3.5 tầng nổi có sân rộng** · Hướng nhà — Gợi ý: Đông Bắc (NE) (không có chữ "hướng" đi trước, chưa điền) — “Bán biệt thự đơn lập Elegant Park Thạch Bàn - Đông Bắc xây thô mặt trong x 3.5 tầng nổi có sân rộng”
- **Bán Vinhomes Olympic Ngọc Hồi - Biệt thự sinh thái đẳng cấp, không gian sống xanh phía Nam Hà Nội** · Diện tích (m²) — Nhiều giá trị khác nhau (200–600 m² · 200 m²) — chưa điền — “…t thự đơn lập và song lập Diện tích dự kiến: 200 – 600m² Vị trí: Các phân khu sinh thái thuộc Vinhome…”
- **Bán nhà liền kề Tây Bắc vị trí đẹp kinh doanh Elegant Park Thạc Bàn xây thô mặt trong 4 tầng** · Hướng nhà — Gợi ý: Tây Bắc (NW) (không có chữ "hướng" đi trước, chưa điền) — “Bán nhà liền kề Tây Bắc vị trí đẹp kinh doanh Elegant Park Thạc Bàn…”
- **Bán liền kề Đông Nam Elegant Park Thạch Bàn hoàn thiện bên ngoài MT: 5m kinh doanh thuận lợi** · Hướng nhà — Gợi ý: Đông Nam (SE) (không có chữ "hướng" đi trước, chưa điền) — “Bán liền kề Đông Nam Elegant Park Thạch Bàn hoàn thiện bên ngoài…”
- **Bán Vinhomes Olympic Ngọc Hồi - Nhà liền kề vị trí đẹp, quy hoạch đồng bộ, tiềm năng tăng giá** · Diện tích (m²) — Chỉ có khoảng diện tích 75–120 m² — chưa điền — “…ư. Loại hình: Nhà liền kề Diện tích dự kiến: 75 – 120m² Vị trí: Các phân khu thấp tầng thuộc Vinhome…”
- **Chính chủ bán nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam, vị trí đẹp, giá tốt** · Hướng nhà — Nhiều giá trị khác nhau (Đông Nam (SE) · Tây Bắc (NW)) — chưa điền — “…n nhà liền kề Vinhomes Olympic Ngọc Hồi 96m2 hướng Đông Nam, vị trí đẹp, giá tốt”
