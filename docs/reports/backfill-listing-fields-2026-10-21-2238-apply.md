# Báo cáo điền dữ liệu cũ — listing fields (BL-052)

- Thời điểm chạy: 2026-10-21 22:38 (giờ VN)
- Chế độ: **Ghi thật (`--apply`)**
- Collection: `projects`
- Quy tắc: chỉ điền ô đang trống (không ghi đè giá trị admin đã nhập), trích từ nội dung tiếng Việt; không xuất bản / đổi trạng thái tin; không xếp job dịch tự động.
- Độ tin cậy: **cao** = từ tên / danh mục / bảng giá / danh sách tiện ích; **trung bình** = từ mô tả ngắn / tổng quan (cần soát).
- Tin chưa xuất bản chỉ ghi id + trường + giá trị (không tên, không đoạn nội dung).

## Dự án (`projects`)

| Chỉ số | Số tin |
|---|---|
| Tin quét | 61 |
| Đã điền (ít nhất 1 ô) | 54 |
| Không điền — mọi ô đã có giá trị | 0 |
| Không điền — có ô trống nhưng không trích được | 7 |
| Lỗi khi ghi | 0 |

| Trường | Đã điền | Đã có giá trị (giữ nguyên) | Ô trống, không trích được |
|---|---|---|---|
| Loại sản phẩm (`productTypes`) | 52 | 0 | 9 |
| Tiện ích nổi bật (`featuredAmenities`) | 26 | 0 | 35 |
| Sản phẩm (`products`) | 2 | 0 | 59 |

### Chi tiết giá trị đã điền

| Tin | Trường | Giá trị | Đoạn nguồn | Nguồn | Độ tin cậy |
|---|---|---|---|---|---|
| Dự án mẫu Căn hộ Sông Sài Gòn | Loại sản phẩm | Căn hộ (apartment) | Dự án mẫu Căn hộ Sông Sài Gòn | tên | cao |
| Dự án mẫu Căn hộ Sông Sài Gòn | Tiện ích nổi bật | Gần trường học (near_school) | Hồ bơi tràn bờ Phòng gym Công viên ven sông Trường mầm non Khu BBQ Siêu thị | danh sách tiện ích | cao |
| Dự án mẫu Căn hộ Sông Sài Gòn | Tiện ích nổi bật | View sông/hồ (water_view) | Hồ bơi tràn bờ Phòng gym Công viên ven sông Trường mầm non Khu BBQ Siêu thị | danh sách tiện ích | cao |
| Dự án mẫu Căn hộ Sông Sài Gòn | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Hồ bơi tràn bờ Phòng gym Công viên ven sông Trường… | danh sách tiện ích | cao |
| Dự án mẫu Căn hộ Sông Sài Gòn | Tiện ích nổi bật | Công viên cây xanh (green_park) | Hồ bơi tràn bờ Phòng gym Công viên ven sông Trường mầm non Khu BBQ Siêu thị | danh sách tiện ích | cao |
| Dự án mẫu Biệt thự ven biển Đà Nẵng | Loại sản phẩm | Biệt thự (villa) | Dự án mẫu Biệt thự ven biển Đà Nẵng | tên | cao |
| Dự án mẫu Biệt thự ven biển Đà Nẵng | Loại sản phẩm | Nghỉ dưỡng (resort) | Biệt thự nghỉ dưỡng sát biển, thiết kế mở đón gió. | mô tả ngắn | trung bình |
| Dự án mẫu Căn hộ Trung Tâm Hà Nội | Loại sản phẩm | Căn hộ (apartment) | Dự án mẫu Căn hộ Trung Tâm Hà Nội | tên | cao |
| Dự án mẫu Nhà phố thương mại Thủ Đức | Loại sản phẩm | Shophouse (shophouse) | Dự án mẫu Nhà phố thương mại Thủ Đức | tên | cao |
| Q'Terra Quy Nhơn | Loại sản phẩm | Căn hộ (apartment) | Q'Terra là dự án chung cư cao cấp tọa lạc tại số 1 Ngô Mây, Quy Nhơn g… | mô tả ngắn | trung bình |
| Starlake The Prime Tây Hồ Tây | Loại sản phẩm | Căn hộ (apartment) | Cập nhật giá bán căn hộ Starlake The Prime Tây Hồ Tây mới nhất từ ch… | mô tả ngắn | trung bình |
| Times Square Hà Nội Phạm Hùng | Loại sản phẩm | Căn hộ (apartment) | …ển theo mô hình tổ hợp đa chức năng, kết hợp căn hộ cao cấp, văn phòng hạng A và trung tâm thươn… | mô tả ngắn | trung bình |
| Times Square Hà Nội Phạm Hùng | Loại sản phẩm | Văn phòng (office) | …tổ hợp đa chức năng, kết hợp căn hộ cao cấp, văn phòng hạng A và trung tâm thương mại hiện đại tại… | mô tả ngắn | trung bình |
| Times Square Hà Nội Phạm Hùng | Tiện ích nổi bật | Gần TTTM (near_mall) | Trung tâm thương mại Hầm để xe | danh sách tiện ích | cao |
| Avenue Alluvia Sunshine Marina Hưng Yên | Loại sản phẩm | Căn hộ (apartment) | …ương mại, dịch vụ và tiện ích cư dân 32 tầng căn hộ | tổng quan | trung bình |
| Avenue Alluvia Sunshine Marina Hưng Yên | Loại sản phẩm | Shophouse (shophouse) | …c trục giao thông nội khu, Avenue quy tụ dãy shophouse và sản phẩm thương mại cao cấp, mang đến khô… | tổng quan | trung bình |
| Avenue Alluvia Sunshine Marina Hưng Yên | Tiện ích nổi bật | View sông/hồ (water_view) | …đai 3.5, kề sát cầu Ngọc Hồi và trục Di sản ven sông Hồng. | mô tả ngắn | trung bình |
| The Sunrise Bay Vinhomes Global Gate Hạ Long | Loại sản phẩm | Căn hộ (apartment) | …ong – Cập nhật giá bán CĐT, thông tin dự án, căn hộ, tiện ích và chính sách mới nhất. | mô tả ngắn | trung bình |
| MIK Vũ Yên Hải Phòng - The Harbor Skyline | Loại sản phẩm | Căn hộ (apartment) | …ữu vị trí đắc địa tại Vinhomes Royal Island, căn hộ cao cấp, tiện ích đẳng cấp, tiềm năng đầu tư… | mô tả ngắn | trung bình |
| D’. Diamant Bleu Tân Hoàng Minh Việt Hưng | Loại sản phẩm | Căn hộ (apartment) | …mant Bleu Tân Hoàng Minh Việt Hưng là tổ hợp căn hộ cao cấp, văn phòng thương mại và shophouse t… | mô tả ngắn | trung bình |
| D’. Diamant Bleu Tân Hoàng Minh Việt Hưng | Loại sản phẩm | Shophouse (shophouse) | …hợp căn hộ cao cấp, văn phòng thương mại và shophouse tại khu đô thị Việt Hưng | mô tả ngắn | trung bình |
| D’. Diamant Bleu Tân Hoàng Minh Việt Hưng | Loại sản phẩm | Văn phòng (office) | …àng Minh Việt Hưng là tổ hợp căn hộ cao cấp, văn phòng thương mại và shophouse tại khu đô thị Việt… | mô tả ngắn | trung bình |
| D’. Diamant Bleu Tân Hoàng Minh Việt Hưng | Tiện ích nổi bật | Gần TTTM (near_mall) | Phòng gym Trung tâm thương mại Spa Hầm để xe | danh sách tiện ích | cao |
| D’. Diamant Bleu Tân Hoàng Minh Việt Hưng | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Phòng gym Trung tâm thương mại Spa Hầm để xe | danh sách tiện ích | cao |
| Sun Festo Town Hạ Long | Loại sản phẩm | Căn hộ (apartment) | …Số lượng: 3 tòa cao tầng F1, F2, F3 Số lượng căn hộ: 2.195 căn Số lượng shophouse: 156 căn Hình… | tổng quan | trung bình |
| Sun Festo Town Hạ Long | Loại sản phẩm | Shophouse (shophouse) | …, F2, F3 Số lượng căn hộ: 2.195 căn Số lượng shophouse: 156 căn Hình thức sở hữu: Thương mại dịch v… | tổng quan | trung bình |
| Sun Festo Town Hạ Long | Loại sản phẩm | Nghỉ dưỡng (resort) | …Thành viên Tập đoàn Sun Group Vị trí: Thuộc tổ hợp nghỉ dưỡng, giải trí Sun Elite City, Bãi Cháy, Hạ Long… | tổng quan | trung bình |
| Handico Sunshine Metropolis City Mê Linh | Loại sản phẩm | Căn hộ (apartment) | …. Tỷ lệ xây dựng: Khoảng 40%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse… | tổng quan | trung bình |
| Handico Sunshine Metropolis City Mê Linh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn cung: Hơn 10.… | tổng quan | trung bình |
| Handico Sunshine Metropolis City Mê Linh | Loại sản phẩm | Biệt thự (villa) | …Khoảng 40%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn… | tổng quan | trung bình |
| Handico Sunshine Metropolis City Mê Linh | Loại sản phẩm | Shophouse (shophouse) | …m: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn cung: Hơn 10.000 căn hộ cù… | tổng quan | trung bình |
| Handico Sunshine Metropolis City Mê Linh | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Công viên cây xanh Sân chơi trẻ em | danh sách tiện ích | cao |
| Handico Sunshine Metropolis City Mê Linh | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Công viên cây xanh Sân chơi trẻ em | danh sách tiện ích | cao |
| The Grand Riveria Tàm Xá, Đông Anh | Loại sản phẩm | Căn hộ (apartment) | …và tiện ích công cộng. Loại hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse… | tổng quan | trung bình |
| The Grand Riveria Tàm Xá, Đông Anh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô sản phẩm: Dự… | tổng quan | trung bình |
| The Grand Riveria Tàm Xá, Đông Anh | Loại sản phẩm | Biệt thự (villa) | …cộng. Loại hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô… | tổng quan | trung bình |
| The Grand Riveria Tàm Xá, Đông Anh | Loại sản phẩm | Shophouse (shophouse) | …n: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô sản phẩm: Dự kiến gồm 50… | tổng quan | trung bình |
| The Grand Riveria Tàm Xá, Đông Anh | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Công viên cây xanh Sân chơi trẻ em | danh sách tiện ích | cao |
| The Grand Riveria Tàm Xá, Đông Anh | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Công viên cây xanh Sân chơi trẻ em | danh sách tiện ích | cao |
| Masteri Era Landmark Ocean Park 3 Hưng Yên | Loại sản phẩm | Căn hộ (apartment) | …ri Era Landmark Ocean Park 3 Hưng Yên là khu căn hộ cao cấp do Masterise Homes phát triển tại tr… | mô tả ngắn | trung bình |
| Masteri Era Landmark Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Spa | danh sách tiện ích | cao |
| Pearl Rivera Hanoi Mê Linh | Loại sản phẩm | Căn hộ (apartment) | …sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu cầu ở và kinh doanh. S… | tổng quan | trung bình |
| Pearl Rivera Hanoi Mê Linh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …ô khoảng 40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu… | tổng quan | trung bình |
| Pearl Rivera Hanoi Mê Linh | Loại sản phẩm | Biệt thự (villa) | …n có quy mô khoảng 40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn… | tổng quan | trung bình |
| Pearl Rivera Hanoi Mê Linh | Loại sản phẩm | Shophouse (shophouse) | …40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu cầu ở và ki… | tổng quan | trung bình |
| The Metropolitan Bắc Giang | Loại sản phẩm | Căn hộ (apartment) | …nh: 5x19; 7x18 Diện tích điển hình: 95-126m2 Chung cư cao 15 tầng (~390 căn hộ) Hiện trạng: Dự án… | tổng quan | trung bình |
| The Metropolitan Bắc Giang | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …khu vực phát triển mạnh trong tương lai: 🔖 Liền kề khu dân cư hiện hữu và khu quy hoạch trung t… | tổng quan | trung bình |
| The Metropolitan Bắc Giang | Loại sản phẩm | Đất nền (land) | …Bắc Giang Quy mô: ~13.9ha. Trong đó: 226 lô đất nền Kích thước điển hình: 5x17; 5x18; 5x20; 5x21… | tổng quan | trung bình |
| The Metropolitan Bắc Giang | Tiện ích nổi bật | Gần trường học (near_school) | Công viên cây xanh Trường học Trung tâm thương mại | danh sách tiện ích | cao |
| The Metropolitan Bắc Giang | Tiện ích nổi bật | Gần TTTM (near_mall) | Công viên cây xanh Trường học Trung tâm thương mại | danh sách tiện ích | cao |
| The Metropolitan Bắc Giang | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh Trường học Trung tâm thương mại | danh sách tiện ích | cao |
| Alluvia City Văn Giang | Tiện ích nổi bật | View sông/hồ (water_view) | …g – Thành phố sinh thái khoáng nóng đầu tiên bên sông Hồng 🔹 Tên dự án: Alluvia City 🔹 Vị trí: V… | tổng quan | trung bình |
| Noble Palace Riverside Cẩm Đình Phúc Thọ | Loại sản phẩm | Biệt thự (villa) | …ô 250ha và 11km mặt sông Đáy, dự án cung cấp biệt thự sang trọng và shophouse hiện đại, tạo nên kh… | mô tả ngắn | trung bình |
| Noble Palace Riverside Cẩm Đình Phúc Thọ | Loại sản phẩm | Shophouse (shophouse) | …g Đáy, dự án cung cấp biệt thự sang trọng và shophouse hiện đại, tạo nên không gian sống đẳng cấp. | mô tả ngắn | trung bình |
| Noble Palace Riverside Cẩm Đình Phúc Thọ | Loại sản phẩm | Nghỉ dưỡng (resort) | Noble Palace Riverside Phúc Thọ là khu đô thị nghỉ dưỡng cao cấp tại Cẩm Đình, Phúc Thọ, Hà Nội. Với… | mô tả ngắn | trung bình |
| Noble Palace Riverside Cẩm Đình Phúc Thọ | Tiện ích nổi bật | View sông/hồ (water_view) | …Phúc Thọ - Với quy mô 250ha và trải dài 11km ven sông, đại đô thị sinh thái Noble Palace Riverside… | tổng quan | trung bình |
| The Diamond Park Mê Linh | Loại sản phẩm | Căn hộ (apartment) | …nh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ. | mô tả ngắn | trung bình |
| The Diamond Park Mê Linh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …tại huyện Mê Linh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ. | mô tả ngắn | trung bình |
| The Diamond Park Mê Linh | Loại sản phẩm | Biệt thự (villa) | …hát triển tại huyện Mê Linh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ. | mô tả ngắn | trung bình |
| The Diamond Park Mê Linh | Tiện ích nổi bật | Gần trường học (near_school) | Trường học | danh sách tiện ích | cao |
| Mê Linh New City | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …ân số: 2.500 người. Sản phẩm: 366 lô đất gồm liền kề, biệt thự và nhà vườn. Diện tích lô liền kề:… | tổng quan | trung bình |
| Mê Linh New City | Loại sản phẩm | Biệt thự (villa) | …500 người. Sản phẩm: 366 lô đất gồm liền kề, biệt thự và nhà vườn. Diện tích lô liền kề: 107m² - 1… | tổng quan | trung bình |
| Mê Linh New City | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh | danh sách tiện ích | cao |
| Mê Linh Vista City | Loại sản phẩm | Căn hộ (apartment) | …hân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thương mại, siêu thị, trư… | tổng quan | trung bình |
| Mê Linh Vista City | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …. Dự án bao gồm nhiều phân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thươn… | tổng quan | trung bình |
| Mê Linh Vista City | Loại sản phẩm | Biệt thự (villa) | …ồm nhiều phân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thương mại, siê… | tổng quan | trung bình |
| Mê Linh Vista City | Loại sản phẩm | Shophouse (shophouse) | …n kề, biệt thự đơn lập, biệt thự song lập và shophouse thương mại Tổng diện tích quy hoạch: 173.563… | tổng quan | trung bình |
| Mê Linh Vista City | Tiện ích nổi bật | Gần trường học (near_school) | Trường học Trung tâm thương mại | danh sách tiện ích | cao |
| Mê Linh Vista City | Tiện ích nổi bật | Gần TTTM (near_mall) | Trường học Trung tâm thương mại | danh sách tiện ích | cao |
| Khu đô thị Chi Đông Mê Linh | Tiện ích nổi bật | Gần trường học (near_school) | …g Tư vấn và Chuyển giao Công nghệ Xây dựng – Trường Đại học Kiến trúc Hà Nội. Đơn vị giám sát: (Đang cập… | tổng quan | trung bình |
| Noble Heritage Hanoi | Loại sản phẩm | Biệt thự (villa) | Noble Heritage Hanoi là khu biệt thự nghỉ dưỡng sinh thái, nằm trên địa bàn xã Cẩ… | mô tả ngắn | trung bình |
| Noble Heritage Hanoi | Loại sản phẩm | Nghỉ dưỡng (resort) | Noble Heritage Hanoi là khu biệt thự nghỉ dưỡng sinh thái, nằm trên địa bàn xã Cẩm Đình và k… | mô tả ngắn | trung bình |
| Noble Heritage Hanoi | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh | danh sách tiện ích | cao |
| Rose Valley Mê Linh | Loại sản phẩm | Căn hộ (apartment) | …đầu tư: 1.126,2 tỷ đồng Loại hình: Biệt thự, căn hộ Ngày khởi công: Năm 2012 Chủ đầu tư: Công ty… | tổng quan | trung bình |
| Rose Valley Mê Linh | Loại sản phẩm | Biệt thự (villa) | …ại tại Mê Linh, Hà Nội, nổi bật với hệ thống biệt thự cao cấp được thiết kế theo phong cách Tân Cổ… | tổng quan | trung bình |
| Louis City Hoàng Mai | Loại sản phẩm | Căn hộ (apartment) | …nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 266 đến 330m2 – (4 tầng + 1 tầ… | tổng quan | trung bình |
| Louis City Hoàng Mai | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …xanh: Khoảng ~2,4ha Quy mô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệ… | tổng quan | trung bình |
| Louis City Hoàng Mai | Loại sản phẩm | Biệt thự (villa) | …ô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 266 đến 330m2… | tổng quan | trung bình |
| Louis City Hoàng Mai | Loại sản phẩm | Shophouse (shophouse) | …~2,4ha Quy mô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 2… | tổng quan | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …Vĩnh Yên được phát triển quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi… | mô tả ngắn | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Loại sản phẩm | Biệt thự (villa) | …n quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi trường sống hiện đại… | mô tả ngắn | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Loại sản phẩm | Shophouse (shophouse) | …c phát triển quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi trường sốn… | mô tả ngắn | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Tiện ích nổi bật | Gần TTTM (near_mall) | Bể bơi Công viên cây xanh Trung tâm thương mại Spa Hầm để xe | danh sách tiện ích | cao |
| Park Hill Thành Công, Vĩnh Yên | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Công viên cây xanh Trung tâm thương mại Spa… | danh sách tiện ích | cao |
| Park Hill Thành Công, Vĩnh Yên | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Công viên cây xanh Trung tâm thương mại Spa Hầm để xe | danh sách tiện ích | cao |
| Park Hill Thành Công, Vĩnh Yên | Tiện ích nổi bật | Gần trường học (near_school) | …àn thiện mặt ngoài Hệ tiện ích: Nằm đối diện trường THPT Chuyên Vĩnh Phúc; liền kề trung tâm thương m… | tổng quan | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Sản phẩm | Biệt thự song lập · số lượng 22 · 150–230 m² | …chi tiết gồm: 22 căn biệt thự song lập, diện tích đất 150 – 230m² 06 căn biệt th… | tổng quan | trung bình |
| Park Hill Thành Công, Vĩnh Yên | Sản phẩm | Biệt thự đơn lập · số lượng 6 · 350–500 m² | …ất 150 – 230m² 06 căn biệt thự đơn lập, diện tích đất 350 – 500m² Diện tích sàn… | tổng quan | trung bình |
| Hanoi Oriental Gia Lâm | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …a Lâm, Hà Nội Loại hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện tích: 8,… | tổng quan | trung bình |
| Hanoi Oriental Gia Lâm | Loại sản phẩm | Biệt thự (villa) | …i hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện tích: 8,38 ha Tổng số căn:… | tổng quan | trung bình |
| Hanoi Oriental Gia Lâm | Loại sản phẩm | Shophouse (shophouse) | …Tài, xã Gia Lâm, Hà Nội Loại hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện… | tổng quan | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Loại sản phẩm | Biệt thự (villa) | …n thấp tầng 100% có sân vườn, gồm shophouse, biệt thự tứ lập, biệt thự vườn và đơn lập. | mô tả ngắn | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Loại sản phẩm | Shophouse (shophouse) | …với 692 căn thấp tầng 100% có sân vườn, gồm shophouse, biệt thự tứ lập, biệt thự vườn và đơn lập. | mô tả ngắn | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …tại khu Hải Đăng cũ, ven sông Bắc Hưng Hải, liền kề quốc lộ 5A. Thiết kế phong cách Singapore: b… | tổng quan | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Loại sản phẩm | Văn phòng (office) | …6–12m, sân đỗ xe riêng. Tích hợp trường học, văn phòng ngay trong khuôn viên. Clubhouse The Canopy:… | tổng quan | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Gần trường học (near_school) | Bể bơi Công viên cây xanh Trường học Hầm để xe | danh sách tiện ích | cao |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Công viên cây xanh Trường học Hầm để xe | danh sách tiện ích | cao |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Công viên cây xanh Trường học Hầm để xe | danh sách tiện ích | cao |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Gần bệnh viện (near_hospital) | …thuận tiện: quốc lộ 5A, cao tốc 5B, Vincom, Vinmec. Sổ đỏ lâu dài – pháp lý vững chắc. | tổng quan | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | Gần TTTM (near_mall) | …Kết nối thuận tiện: quốc lộ 5A, cao tốc 5B, Vincom, Vinmec. Sổ đỏ lâu dài – pháp lý vững chắc. | tổng quan | trung bình |
| The Fullton CapitaLand Ocean Park 3 Hưng Yên | Tiện ích nổi bật | View sông/hồ (water_view) | …Hưng Yên Vị trí đắc địa tại khu Hải Đăng cũ, ven sông Bắc Hưng Hải, liền kề quốc lộ 5A. Thiết kế p… | tổng quan | trung bình |
| Diamond Paragon Bắc Giang | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …ển: Gồm 958 lô đất với đa dạng sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại.… | tổng quan | trung bình |
| Diamond Paragon Bắc Giang | Loại sản phẩm | Biệt thự (villa) | …58 lô đất với đa dạng sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại. Tiện ích:… | tổng quan | trung bình |
| Diamond Paragon Bắc Giang | Loại sản phẩm | Shophouse (shophouse) | …sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại. Tiện ích: Đầy đủ và hiện đại, đá… | tổng quan | trung bình |
| Diamond Paragon Bắc Giang | Loại sản phẩm | Đất nền (land) | …đẹp nhất thuộc dòng sản phẩmDiamond – Các lô đất nền mặt đường lớn có giátrị thương mại và tiềm n… | tổng quan | trung bình |
| Noble Palace Long Biên | Loại sản phẩm | Biệt thự (villa) | …n Quy mô: 42.970 m² Dung lượng sản phẩm: 172 biệt thự song lập Diện tích đất giao thông, cây xanh:… | tổng quan | trung bình |
| Noble Palace Tây Hồ Ciputra | Loại sản phẩm | Biệt thự (villa) | …Palace Tây Hồ Được quy hoạch gồm 2 phân khu: Biệt thự thương mại nội khu phong cách Tây Âu. Biệt t… | tổng quan | trung bình |
| Masterise Homes Thủy Nguyên Hải Phòng | Loại sản phẩm | Căn hộ (apartment) | …h này hứa hẹn sẽ cung cấp cho thị trường 220 căn hộ thấp tầng. | mô tả ngắn | trung bình |
| Masterise Homes Thủy Nguyên Hải Phòng | Loại sản phẩm | Shophouse (shophouse) | …3[hotline TAMI]m Loại hình sản phẩm: Tổ hợp shophouse thương mại dịch vụ hỗn hợp Khối tháp thương… | tổng quan | trung bình |
| Masterise Homes Thủy Nguyên Hải Phòng | Tiện ích nổi bật | Gần TTTM (near_mall) | Trung tâm thương mại | danh sách tiện ích | cao |
| Hồng Hạc City Thuận Thành, Bắc Ninh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …000 tỷ đồng Sản phẩm: hơn 2000 căn biệt thự, nhà liền kề Đơn vị thiết kế: Công ty tư vấn quốc tế Surb… | tổng quan | trung bình |
| Hồng Hạc City Thuận Thành, Bắc Ninh | Loại sản phẩm | Biệt thự (villa) | …đầu tư: 3000 tỷ đồng Sản phẩm: hơn 2000 căn biệt thự, nhà liền kề Đơn vị thiết kế: Công ty tư vấn… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Loại sản phẩm | Căn hộ (apartment) | …đa 5 tầng. Khu tái định cư: Gồm 491 lô đất. Chung cư cao tầng: 5 ô quy hoạch chung cư cao 25 tầng… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …o phong cách Tân Cổ Điển, cao tối đa 5 tầng. Nhà phố: 4.510 căn bao gồm shophouse và nhà phố liền… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Loại sản phẩm | Biệt thự (villa) | …u Nghĩa, tỉnh Long An. 2️⃣ Sản phẩm dự kiến: Biệt thự: Gồm 517 căn biệt thự đơn lập và song lập, t… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Loại sản phẩm | Shophouse (shophouse) | …ao tối đa 5 tầng. Nhà phố: 4.510 căn bao gồm shophouse và nhà phố liền kề, với chiều cao tối đa 5 t… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Phòng gym Công viên cây xanh | danh sách tiện ích | cao |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Phòng gym Công viên cây xanh | danh sách tiện ích | cao |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | View sông/hồ (water_view) | …An Vinhomes Urban Lake Long An – khu đô thị ven hồ đẳng cấp với vị trí chiến lược, không gian s… | mô tả ngắn | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | Gần trường học (near_school) | …ới các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng với đó là các tiện… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | Gần bệnh viện (near_hospital) | …ngroup với các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng với đó… | tổng quan | trung bình |
| Vinhomes Urban Lake Hậu Nghĩa Long An | Tiện ích nổi bật | Gần TTTM (near_mall) | …thái Vingroup với các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng… | tổng quan | trung bình |
| Noble Marina Mũi Né | Loại sản phẩm | Căn hộ (apartment) | …iện tích rộng lớn, với hơn 1.000 biệt thự và căn hộ cao cấp, cùng nhiều công trình biểu tượng kh… | tổng quan | trung bình |
| Noble Marina Mũi Né | Loại sản phẩm | Biệt thự (villa) | …dựng trên diện tích rộng lớn, với hơn 1.000 biệt thự và căn hộ cao cấp, cùng nhiều công trình biể… | tổng quan | trung bình |
| Noble Marina Mũi Né | Loại sản phẩm | Nghỉ dưỡng (resort) | Noble Marina Mũi Né là dự án nghỉ dưỡng đẳng cấp, đánh dấu một bước tiến mới trong n… | tổng quan | trung bình |
| Apec Mandala Phú Yên | Loại sản phẩm | Nghỉ dưỡng (resort) | Apec Mandala Phú Yên là dự án khu nghỉ dưỡng sinh thái đầy ấn tượng của tỉnh Phú Yên. Đây… | mô tả ngắn | trung bình |
| Apec Mandala Phú Yên | Loại sản phẩm | Căn hộ (apartment) | …sản phẩm bất động sản chính là shophouse và căn hộ chung cư, dự án này gây ấn tượng và ngày càn… | tổng quan | trung bình |
| Apec Mandala Phú Yên | Loại sản phẩm | Shophouse (shophouse) | …ng cấp 2 dòng sản phẩm bất động sản chính là shophouse và căn hộ chung cư, dự án này gây ấn tượng v… | tổng quan | trung bình |
| Apec Mandala Phú Yên | Loại sản phẩm | Condotel (condotel) | …ện tích: 10.872 m2 Loại sản phẩm: Shophouse, căn hộ khách sạn Chiều cao tòa căn hộ: 27 tầng Số căn shophou… | tổng quan | trung bình |
| Vinhomes Global Gate Hạ Long | Loại sản phẩm | Nghỉ dưỡng (resort) | …hu phức hợp đa năng, đô thị ven biển gắn với khu nghỉ dưỡng sinh thái, sân golf và dịch vụ tiện ích tại… | tổng quan | trung bình |
| Thung Lũng Thanh Xuân Valley | Loại sản phẩm | Biệt thự (villa) | …y có quy hoạch bài bản, nổi bật với sản phẩm Biệt thự trong thung lũng đan xen những tiện ích sáng… | mô tả ngắn | trung bình |
| Vinpearl Mỹ Lâm Tuyên Quang | Loại sản phẩm | Biệt thự (villa) | …phân khu chính gồm: Khu 450ha: hơn 4,000 căn biệt thự Khu 100ha: sân Golf tiêu chuẩn Quốc tế. Khu… | tổng quan | trung bình |
| Vinpearl Mỹ Lâm Tuyên Quang | Loại sản phẩm | Shophouse (shophouse) | …00ha: sân Golf tiêu chuẩn Quốc tế. Khu 30ha: shophouse, Bệnh viện Vinmec, khu dưỡng lão, Onsen & sp… | tổng quan | trung bình |
| Vinpearl Mỹ Lâm Tuyên Quang | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Y tế Spa Sân golf | danh sách tiện ích | cao |
| Vinpearl Mỹ Lâm Tuyên Quang | Tiện ích nổi bật | Gần bệnh viện (near_hospital) | …olf tiêu chuẩn Quốc tế. Khu 30ha: shophouse, Bệnh viện Vinmec, khu dưỡng lão, Onsen & spa, khách sạ… | tổng quan | trung bình |
| MINH GIANG ĐẦM VÀ | Loại sản phẩm | Căn hộ (apartment) | …mua bán Loại hình được phát triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình… | tổng quan | trung bình |
| MINH GIANG ĐẦM VÀ | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ lâu dài | tổng quan | trung bình |
| MINH GIANG ĐẦM VÀ | Loại sản phẩm | Biệt thự (villa) | …được phát triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ… | tổng quan | trung bình |
| MINH GIANG ĐẦM VÀ | Loại sản phẩm | Shophouse (shophouse) | …triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ lâu dài | tổng quan | trung bình |
| Crystal Holidays Habour Hạ Long | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.000 m2. | mô tả ngắn | trung bình |
| Crystal Holidays Habour Hạ Long | Loại sản phẩm | Biệt thự (villa) | …ách sạn 5 sao, trung tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộ… | mô tả ngắn | trung bình |
| Crystal Holidays Habour Hạ Long | Loại sản phẩm | Shophouse (shophouse) | …tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.000 m2. | mô tả ngắn | trung bình |
| Crystal Holidays Habour Hạ Long | Loại sản phẩm | Nghỉ dưỡng (resort) | …ách sạn 5 sao, trung tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.0… | mô tả ngắn | trung bình |
| Crystal Holidays Habour Hạ Long | Tiện ích nổi bật | Gần TTTM (near_mall) | Bể bơi Công viên cây xanh Trung tâm thương mại | danh sách tiện ích | cao |
| Crystal Holidays Habour Hạ Long | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Công viên cây xanh Trung tâm thương mại | danh sách tiện ích | cao |
| Crystal Holidays Habour Hạ Long | Tiện ích nổi bật | Công viên cây xanh (green_park) | Bể bơi Công viên cây xanh Trung tâm thương mại | danh sách tiện ích | cao |
| Crystal Holidays Habour Hạ Long | Tiện ích nổi bật | Gần trường học (near_school) | …Khu Đô Thị OCean Park Vân Đồn – Quảng Ninh, Trường THPT Hải Đảo... Các điểm du lịch sinh thái "hot"… | tổng quan | trung bình |
| Wonder City Vân Phong | Loại sản phẩm | Biệt thự (villa) | …biển cả. Điều này tối ưu tầm nhìn từ các căn biệt thự biển, thêm gia vị cho kỳ nghỉ dưỡng với nhữn… | tổng quan | trung bình |
| Wonder City Vân Phong | Loại sản phẩm | Shophouse (shophouse) | …ạng mọi món ăn trên khắp thế giới Cửa hàng - Shophouse: mục đích sử dụng phong phú để ở và để kinh… | tổng quan | trung bình |
| Wonder City Vân Phong | Loại sản phẩm | Nghỉ dưỡng (resort) | …: Nhà thấp tầng, khách sạn, căn hộ khách sạn,resort Quy mô:5 phân khu với các đặc trưng riêng ma… | tổng quan | trung bình |
| Wonder City Vân Phong | Loại sản phẩm | Condotel (condotel) | …h: 500ha Sản phẩm: Nhà thấp tầng, khách sạn, căn hộ khách sạn,resort Quy mô:5 phân khu với các đặc trưng r… | tổng quan | trung bình |
| UDIC Riverside 2 Vĩnh Tuy | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …à ở tại khu vực phía Đông Nam Hà Nội. Vị trí liền kề giai đoạn 1 cùng khả năng kết nối qua cầu Vĩ… | tổng quan | trung bình |
| Mipeco Nha Trang | Loại sản phẩm | Căn hộ (apartment) | …16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịch vụ. | mô tả ngắn | trung bình |
| Mipeco Nha Trang | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …quy mô khoảng 16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịch vụ. | mô tả ngắn | trung bình |
| Mipeco Nha Trang | Loại sản phẩm | Biệt thự (villa) | …Tô Hiệu, quy mô khoảng 16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịc… | mô tả ngắn | trung bình |
| Forestia Lake Mê Linh | Loại sản phẩm | Căn hộ (apartment) | …đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không gian an cư chất lượng… | tổng quan | trung bình |
| Forestia Lake Mê Linh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …oảng 23,5% Tổng số sản phẩm: 24.682 sản phẩm Liền kề và shophouse: 3.811 căn Biệt thự: 398 căn Că… | tổng quan | trung bình |
| Forestia Lake Mê Linh | Loại sản phẩm | Biệt thự (villa) | …rọng tâm, dự án cung cấp đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không… | tổng quan | trung bình |
| Forestia Lake Mê Linh | Loại sản phẩm | Shophouse (shophouse) | …dự án cung cấp đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không gian an cư… | tổng quan | trung bình |
| Vinhomes Green City Long An | Loại sản phẩm | Căn hộ (apartment) | …ệt thự đơn lập Biệt thự song lập Nhà liền kề Chung cư cao tầng (25 tầng) Tiện ích nội khu: Trường… | tổng quan | trung bình |
| Vinhomes Green City Long An | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …át triển: Biệt thự đơn lập Biệt thự song lập Nhà liền kề Chung cư cao tầng (25 tầng) Tiện ích nội khu… | tổng quan | trung bình |
| Vinhomes Green City Long An | Loại sản phẩm | Biệt thự (villa) | …hành dự kiến: Năm 2028 Loại hình phát triển: Biệt thự đơn lập Biệt thự song lập Nhà liền kề Chung… | tổng quan | trung bình |
| Vinhomes Green City Long An | Tiện ích nổi bật | Gần trường học (near_school) | Công viên cây xanh Trường học Y tế | danh sách tiện ích | cao |
| Vinhomes Green City Long An | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh Trường học Y tế | danh sách tiện ích | cao |
| Vinhomes Green City Long An | Tiện ích nổi bật | Gần bệnh viện (near_hospital) | …tầng) Tiện ích nội khu: Trường học Vinschool Bệnh viện Vinmec Công viên cây xanh Hệ thống xe buýt đ… | tổng quan | trung bình |
| Vinhomes Green Paradise Cần Giờ | Loại sản phẩm | Biệt thự (villa) | …up Quy mô tổng thể: 600 ha Loại hình đầu tư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổ… | tổng quan | trung bình |
| Vinhomes Green Paradise Cần Giờ | Loại sản phẩm | Nghỉ dưỡng (resort) | …up Quy mô tổng thể: 600 ha Loại hình đầu tư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổng ngân sác… | tổng quan | trung bình |
| Vinhomes Green Paradise Cần Giờ | Loại sản phẩm | Condotel (condotel) | …ư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổng ngân sách triển khai: 10 tỷ USD Pháp lý… | tổng quan | trung bình |
| Elegant Park Thạch Bàn | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …triển, quy mô 9.456m², cung cấp shophouse và nhà phố sở hữu lâu dài. | mô tả ngắn | trung bình |
| Elegant Park Thạch Bàn | Loại sản phẩm | Shophouse (shophouse) | …K Group phát triển, quy mô 9.456m², cung cấp shophouse và nhà phố sở hữu lâu dài. | mô tả ngắn | trung bình |
| Elegant Park Thạch Bàn | Loại sản phẩm | Biệt thự (villa) | …à. Đan xen cùng cảnh quan xanh, Elegant Park Villa mang đến không gian sống vừa sang trọng vừa… | tổng quan | trung bình |
| The Legatus 22 Liễu Giai | Loại sản phẩm | Căn hộ (apartment) | …ội do NHS đầu tư, cao 25 tầng với khoảng 156 căn hộ cao cấp từ 2–4 phòng ngủ và penthouse, tích… | mô tả ngắn | trung bình |
| The Legatus 22 Liễu Giai | Loại sản phẩm | Condotel (condotel) | …hầm và 112 sản phẩm, kết hợp căn hộ để ở với căn hộ khách sạn. Các lựa chọn trải dài từ căn 1 phòng ngủ mở… | tổng quan | trung bình |
| Hà Nội Orchard Park 6-8 Chùa Bộc | Loại sản phẩm | Căn hộ (apartment) | …làm chủ đầu tư, quy mô 9.825,7 m² với 2 tòa căn hộ và 1 tòa thương mại dịch vụ. | mô tả ngắn | trung bình |
| Hà Nội Orchard Park 6-8 Chùa Bộc | Loại sản phẩm | Văn phòng (office) | …o 24 tầng, với 2 tòa căn hộ cao cấp và 1 tòa văn phòng. Loại hình phát triển: Căn hộ, không gian th… | tổng quan | trung bình |
| Hà Nội Orchard Park 6-8 Chùa Bộc | Tiện ích nổi bật | Hồ bơi, gym, spa (pool_gym_spa) | Bể bơi Phòng gym Y tế Spa | danh sách tiện ích | cao |
| Hà Nội Orchard Park 6-8 Chùa Bộc | Tiện ích nổi bật | Gần trường học (near_school) | …hê, khu mua sắm, khu vui chơi, phòng khám và nhà trẻ. Nhà thầu thi công: Thông tin đang được cập… | tổng quan | trung bình |
| Hà Nội Orchard Park 6-8 Chùa Bộc | Tiện ích nổi bật | Gần bệnh viện (near_hospital) | …àng, quán cà phê, khu mua sắm, khu vui chơi, phòng khám và nhà trẻ. Nhà thầu thi công: Thông tin đan… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Loại sản phẩm | Căn hộ (apartment) | …: Khoảng 240.000 người Loại hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse,… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mại, văn phòng… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Loại sản phẩm | Biệt thự (villa) | …người Loại hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mạ… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Loại sản phẩm | Shophouse (shophouse) | …iển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mại, văn phòng và công trì… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Loại sản phẩm | Văn phòng (office) | …hà liền kề, shophouse, trung tâm thương mại, văn phòng và công trình công cộng Định hướng quy hoạch… | tổng quan | trung bình |
| Bắc Thăng Long Urban City Đông Anh | Tiện ích nổi bật | Gần TTTM (near_mall) | Công viên cây xanh Trung tâm thương mại | danh sách tiện ích | cao |
| Bắc Thăng Long Urban City Đông Anh | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh Trung tâm thương mại | danh sách tiện ích | cao |
| Khu đô thị đa mục tiêu Lĩnh Nam | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …g trong cùng một quần thể Khu đô thị định cư liền kề: Quy mô khoảng 98 ha Công viên bán ngập và c… | tổng quan | trung bình |
| Khu đô thị đa mục tiêu Lĩnh Nam | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh | danh sách tiện ích | cao |
| Khu đô thị đa mục tiêu Lĩnh Nam | Tiện ích nổi bật | View sông/hồ (water_view) | …ịnh hướng hình thành một khu đô thị hiện đại ven sông Hồng, kết hợp đồng bộ giữa chức năng nhà ở,… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Loại sản phẩm | Nhà phố/Liền kề (townhouse) | …t thự đất nền, diện tích 300 – 350 m² 227 lô liền kề đất nền, diện tích 84 – 120 m² 22 căn biệt t… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Loại sản phẩm | Biệt thự (villa) | …1 ha Pháp lý: Sở hữu lâu dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Loại sản phẩm | Shophouse (shophouse) | …thự xây thô, diện tích 250 – 300 m² 154 căn shophouse xây thô, diện tích 96 – 126 m² Tiện ích: 7 k… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Loại sản phẩm | Đất nền (land) | …lý: Sở hữu lâu dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền kề đất n… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Tiện ích nổi bật | Công viên cây xanh (green_park) | Công viên cây xanh | danh sách tiện ích | cao |
| The Crown Đại Hoàng Sơn Bắc Ninh | Sản phẩm | Biệt thự đất nền · số lượng 96 · 300–350 m² | …dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền kề… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Sản phẩm | Liền kề đất nền · số lượng 227 · 84–120 m² | …h 300 – 350 m² 227 lô liền kề đất nền, diện tích 84 – 120 m² 22 căn biệt th… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Sản phẩm | Biệt thự xây thô · số lượng 22 · 250–300 m² | …ch 84 – 120 m² 22 căn biệt thự xây thô, diện tích 250 – 300 m² 154 căn shopho… | tổng quan | trung bình |
| The Crown Đại Hoàng Sơn Bắc Ninh | Sản phẩm | Shophouse xây thô · số lượng 154 · 96–126 m² | …h 250 – 300 m² 154 căn shophouse xây thô, diện tích 96 – 126 m² Tiện ích: 7 kh… | tổng quan | trung bình |

### Cần admin soát

- **Dự án mẫu Biệt thự ven biển Đà Nẵng** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ mô tả ngắn) — “Biệt thự nghỉ dưỡng sát biển, thiết kế mở đón gió.”
- **Q'Terra Quy Nhơn** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “Q'Terra là dự án chung cư cao cấp tọa lạc tại số 1 Ngô Mây, Quy Nhơn g…”
- **Starlake The Prime Tây Hồ Tây** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “Cập nhật giá bán căn hộ Starlake The Prime Tây Hồ Tây mới nhất từ ch…”
- **Times Square Hà Nội Phạm Hùng** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…ển theo mô hình tổ hợp đa chức năng, kết hợp căn hộ cao cấp, văn phòng hạng A và trung tâm thươn…”
- **Times Square Hà Nội Phạm Hùng** · Loại sản phẩm — Soát: Văn phòng (office) (trích từ mô tả ngắn) — “…tổ hợp đa chức năng, kết hợp căn hộ cao cấp, văn phòng hạng A và trung tâm thương mại hiện đại tại…”
- **Avenue Alluvia Sunshine Marina Hưng Yên** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…ương mại, dịch vụ và tiện ích cư dân 32 tầng căn hộ”
- **Avenue Alluvia Sunshine Marina Hưng Yên** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…c trục giao thông nội khu, Avenue quy tụ dãy shophouse và sản phẩm thương mại cao cấp, mang đến khô…”
- **Avenue Alluvia Sunshine Marina Hưng Yên** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ mô tả ngắn) — “…đai 3.5, kề sát cầu Ngọc Hồi và trục Di sản ven sông Hồng.”
- **The Sunrise Bay Vinhomes Global Gate Hạ Long** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…ong – Cập nhật giá bán CĐT, thông tin dự án, căn hộ, tiện ích và chính sách mới nhất.”
- **MIK Vũ Yên Hải Phòng - The Harbor Skyline** · Sản phẩm — Gợi ý: Căn hộ — 15796 (không thấy diện tích trong cùng câu, chưa điền) — “…g số sản phẩm: 15.796 căn hộ. Dòng sản phẩm…”
- **MIK Vũ Yên Hải Phòng - The Harbor Skyline** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…ữu vị trí đắc địa tại Vinhomes Royal Island, căn hộ cao cấp, tiện ích đẳng cấp, tiềm năng đầu tư…”
- **D’. Diamant Bleu Tân Hoàng Minh Việt Hưng** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…mant Bleu Tân Hoàng Minh Việt Hưng là tổ hợp căn hộ cao cấp, văn phòng thương mại và shophouse t…”
- **D’. Diamant Bleu Tân Hoàng Minh Việt Hưng** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…hợp căn hộ cao cấp, văn phòng thương mại và shophouse tại khu đô thị Việt Hưng”
- **D’. Diamant Bleu Tân Hoàng Minh Việt Hưng** · Loại sản phẩm — Soát: Văn phòng (office) (trích từ mô tả ngắn) — “…àng Minh Việt Hưng là tổ hợp căn hộ cao cấp, văn phòng thương mại và shophouse tại khu đô thị Việt…”
- **Sun Festo Town Hạ Long** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…Số lượng: 3 tòa cao tầng F1, F2, F3 Số lượng căn hộ: 2.195 căn Số lượng shophouse: 156 căn Hình…”
- **Sun Festo Town Hạ Long** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…, F2, F3 Số lượng căn hộ: 2.195 căn Số lượng shophouse: 156 căn Hình thức sở hữu: Thương mại dịch v…”
- **Sun Festo Town Hạ Long** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ tổng quan) — “…Thành viên Tập đoàn Sun Group Vị trí: Thuộc tổ hợp nghỉ dưỡng, giải trí Sun Elite City, Bãi Cháy, Hạ Long…”
- **Handico Sunshine Metropolis City Mê Linh** · Sản phẩm — Gợi ý: Căn hộ — 10000 (không thấy diện tích trong cùng câu, chưa điền) — “…guồn cung: Hơn 10.000 căn hộ cùng 643 sản p…”
- **Handico Sunshine Metropolis City Mê Linh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…. Tỷ lệ xây dựng: Khoảng 40%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse…”
- **Handico Sunshine Metropolis City Mê Linh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn cung: Hơn 10.…”
- **Handico Sunshine Metropolis City Mê Linh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…Khoảng 40%. Dòng sản phẩm: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn…”
- **Handico Sunshine Metropolis City Mê Linh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…m: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Nguồn cung: Hơn 10.000 căn hộ cù…”
- **The Grand Riveria Tàm Xá, Đông Anh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…và tiện ích công cộng. Loại hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse…”
- **The Grand Riveria Tàm Xá, Đông Anh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô sản phẩm: Dự…”
- **The Grand Riveria Tàm Xá, Đông Anh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…cộng. Loại hình phát triển: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô…”
- **The Grand Riveria Tàm Xá, Đông Anh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…n: căn hộ cao tầng, biệt thự, nhà liền kề và shophouse thương mại. Quy mô sản phẩm: Dự kiến gồm 50…”
- **Masteri Era Landmark Ocean Park 3 Hưng Yên** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…ri Era Landmark Ocean Park 3 Hưng Yên là khu căn hộ cao cấp do Masterise Homes phát triển tại tr…”
- **Pearl Rivera Hanoi Mê Linh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu cầu ở và kinh doanh. S…”
- **Pearl Rivera Hanoi Mê Linh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…ô khoảng 40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu…”
- **Pearl Rivera Hanoi Mê Linh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…n có quy mô khoảng 40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn…”
- **Pearl Rivera Hanoi Mê Linh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…40ha, đa dạng sản phẩm từ biệt thự, liền kề, shophouse đến căn hộ, đáp ứng trọn vẹn nhu cầu ở và ki…”
- **The Metropolitan Bắc Giang** · Sản phẩm — Gợi ý: Đất nền Kích thước — 226 (không thấy diện tích trong cùng câu, chưa điền) — “…9ha. Trong đó: 226 lô đất nền Kích thước điển hình: 5x1…”
- **The Metropolitan Bắc Giang** · Sản phẩm — Gợi ý: Căn hộ — 390 (không thấy diện tích trong cùng câu, chưa điền) — “…cao 15 tầng (~390 căn hộ) Hiện trạng: D…”
- **The Metropolitan Bắc Giang** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…nh: 5x19; 7x18 Diện tích điển hình: 95-126m2 Chung cư cao 15 tầng (~390 căn hộ) Hiện trạng: Dự án…”
- **The Metropolitan Bắc Giang** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…khu vực phát triển mạnh trong tương lai: 🔖 Liền kề khu dân cư hiện hữu và khu quy hoạch trung t…”
- **The Metropolitan Bắc Giang** · Loại sản phẩm — Soát: Đất nền (land) (trích từ tổng quan) — “…Bắc Giang Quy mô: ~13.9ha. Trong đó: 226 lô đất nền Kích thước điển hình: 5x17; 5x18; 5x20; 5x21…”
- **Alluvia City Văn Giang** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ tổng quan) — “…g – Thành phố sinh thái khoáng nóng đầu tiên bên sông Hồng 🔹 Tên dự án: Alluvia City 🔹 Vị trí: V…”
- **Noble Palace Riverside Cẩm Đình Phúc Thọ** · Sản phẩm — Gợi ý: Biệt thự đơn lập — 2000 (không thấy diện tích trong cùng câu, chưa điền) — “…ượng sản phẩm: 2.000 lô biệt thự đơn lập Phân khu Indoc…”
- **Noble Palace Riverside Cẩm Đình Phúc Thọ** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…ô 250ha và 11km mặt sông Đáy, dự án cung cấp biệt thự sang trọng và shophouse hiện đại, tạo nên kh…”
- **Noble Palace Riverside Cẩm Đình Phúc Thọ** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…g Đáy, dự án cung cấp biệt thự sang trọng và shophouse hiện đại, tạo nên không gian sống đẳng cấp.”
- **Noble Palace Riverside Cẩm Đình Phúc Thọ** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ mô tả ngắn) — “Noble Palace Riverside Phúc Thọ là khu đô thị nghỉ dưỡng cao cấp tại Cẩm Đình, Phúc Thọ, Hà Nội. Với…”
- **Noble Palace Riverside Cẩm Đình Phúc Thọ** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ tổng quan) — “…Phúc Thọ - Với quy mô 250ha và trải dài 11km ven sông, đại đô thị sinh thái Noble Palace Riverside…”
- **The Diamond Park Mê Linh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…nh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ.”
- **The Diamond Park Mê Linh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ mô tả ngắn) — “…tại huyện Mê Linh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ.”
- **The Diamond Park Mê Linh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…hát triển tại huyện Mê Linh, Hà Nội, bao gồm biệt thự, nhà liền kề và căn hộ.”
- **Mê Linh New City** · Sản phẩm — Gợi ý: Liền kề 107–110 m² (không có số lượng, chưa điền) — “…. Diện tích lô liền kề: 107m² - 110m² - 125m². Diện…”
- **Mê Linh New City** · Sản phẩm — Gợi ý: Biệt thự 157–182 m² (không có số lượng, chưa điền) — “…. Diện tích lô biệt thự: 157m² - 182m² - 250m² - 430m…”
- **Mê Linh New City** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…ân số: 2.500 người. Sản phẩm: 366 lô đất gồm liền kề, biệt thự và nhà vườn. Diện tích lô liền kề:…”
- **Mê Linh New City** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…500 người. Sản phẩm: 366 lô đất gồm liền kề, biệt thự và nhà vườn. Diện tích lô liền kề: 107m² - 1…”
- **Mê Linh Vista City** · Sản phẩm — Gợi ý: Liền kề — 203 (không thấy diện tích trong cùng câu, chưa điền) — “…cư cao 14 tầng 203 căn liền kề 44 biệt thự so…”
- **Mê Linh Vista City** · Sản phẩm — Gợi ý: Biệt thự song lập — 44 (không thấy diện tích trong cùng câu, chưa điền) — “…03 căn liền kề 44 biệt thự song lập và 145 biệt th…”
- **Mê Linh Vista City** · Sản phẩm — Gợi ý: Biệt thự đơn lập — 145 (không thấy diện tích trong cùng câu, chưa điền) — “…hự song lập và 145 biệt thự đơn lập Diện tích căn…”
- **Mê Linh Vista City** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…hân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thương mại, siêu thị, trư…”
- **Mê Linh Vista City** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…. Dự án bao gồm nhiều phân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thươn…”
- **Mê Linh Vista City** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…ồm nhiều phân khu chức năng như nhà liền kề, biệt thự, chung cư cao cấp, trung tâm thương mại, siê…”
- **Mê Linh Vista City** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…n kề, biệt thự đơn lập, biệt thự song lập và shophouse thương mại Tổng diện tích quy hoạch: 173.563…”
- **Khu đô thị Chi Đông Mê Linh** · Tiện ích nổi bật — Soát: Gần trường học (near_school) (trích từ tổng quan) — “…g Tư vấn và Chuyển giao Công nghệ Xây dựng – Trường Đại học Kiến trúc Hà Nội. Đơn vị giám sát: (Đang cập…”
- **Noble Heritage Hanoi** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “Noble Heritage Hanoi là khu biệt thự nghỉ dưỡng sinh thái, nằm trên địa bàn xã Cẩ…”
- **Noble Heritage Hanoi** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ mô tả ngắn) — “Noble Heritage Hanoi là khu biệt thự nghỉ dưỡng sinh thái, nằm trên địa bàn xã Cẩm Đình và k…”
- **Rose Valley Mê Linh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…đầu tư: 1.126,2 tỷ đồng Loại hình: Biệt thự, căn hộ Ngày khởi công: Năm 2012 Chủ đầu tư: Công ty…”
- **Rose Valley Mê Linh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…ại tại Mê Linh, Hà Nội, nổi bật với hệ thống biệt thự cao cấp được thiết kế theo phong cách Tân Cổ…”
- **Louis City Hoàng Mai** · Sản phẩm — Gợi ý: Nhà Liền kề — 854 (không thấy diện tích trong cùng câu, chưa điền) — “…uy mô: Bao gồm 854 căn nhà Liền kề, Shophouse và…”
- **Louis City Hoàng Mai** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 266 đến 330m2 – (4 tầng + 1 tầ…”
- **Louis City Hoàng Mai** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…xanh: Khoảng ~2,4ha Quy mô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệ…”
- **Louis City Hoàng Mai** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…ô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 266 đến 330m2…”
- **Louis City Hoàng Mai** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…~2,4ha Quy mô: Bao gồm 854 căn nhà Liền kề, Shophouse và Biệt thự Diện tích căn hộ: Biệt thự: Từ 2…”
- **Park Hill Thành Công, Vĩnh Yên** · Sản phẩm — Gợi ý: Nhà liền kề 100–140 m² (không có số lượng, chưa điền) — “…cấu diện tích: Nhà liền kề: 100 – 140m² Shophouse: Kho…”
- **Park Hill Thành Công, Vĩnh Yên** · Sản phẩm — Gợi ý: Biệt thự 150–400 m² (không có số lượng, chưa điền) — “…: Khoảng 100m² Biệt thự: 150 – 400m², chi tiết gồm:…”
- **Park Hill Thành Công, Vĩnh Yên** · Sản phẩm — Tên loại sản phẩm bản tiếng Anh để trống — nhập tay hoặc bấm "Dịch lại bằng AI" ở dự án.
- **Park Hill Thành Công, Vĩnh Yên** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ mô tả ngắn) — “…Vĩnh Yên được phát triển quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi…”
- **Park Hill Thành Công, Vĩnh Yên** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…n quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi trường sống hiện đại…”
- **Park Hill Thành Công, Vĩnh Yên** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…c phát triển quỹ căn thấp tầng: Nhà liền kề, shophouse, biệt thự sang trọng kiến tạo môi trường sốn…”
- **Park Hill Thành Công, Vĩnh Yên** · Tiện ích nổi bật — Soát: Gần trường học (near_school) (trích từ tổng quan) — “…àn thiện mặt ngoài Hệ tiện ích: Nằm đối diện trường THPT Chuyên Vĩnh Phúc; liền kề trung tâm thương m…”
- **Park Hill Thành Công, Vĩnh Yên** · Sản phẩm — Soát: Biệt thự song lập · số lượng 22 · 150–230 m² (trích từ tổng quan) — “…chi tiết gồm: 22 căn biệt thự song lập, diện tích đất 150 – 230m² 06 căn biệt th…”
- **Park Hill Thành Công, Vĩnh Yên** · Sản phẩm — Soát: Biệt thự đơn lập · số lượng 6 · 350–500 m² (trích từ tổng quan) — “…ất 150 – 230m² 06 căn biệt thự đơn lập, diện tích đất 350 – 500m² Diện tích sàn…”
- **Hanoi Oriental Gia Lâm** · Sản phẩm — Gợi ý: Shophouse 75–196 m² (không có số lượng, chưa điền) — “…ình: Liền kề / Shophouse: 75 – 196 m² Biệt thự: 192,…”
- **Hanoi Oriental Gia Lâm** · Sản phẩm — Gợi ý: Biệt thự 192,5–224 m² (không có số lượng, chưa điền) — “…e: 75 – 196 m² Biệt thự: 192,5 – 224 m² Pháp lý dự án:…”
- **Hanoi Oriental Gia Lâm** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…a Lâm, Hà Nội Loại hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện tích: 8,…”
- **Hanoi Oriental Gia Lâm** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…i hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện tích: 8,38 ha Tổng số căn:…”
- **Hanoi Oriental Gia Lâm** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…Tài, xã Gia Lâm, Hà Nội Loại hình sản phẩm: Shophouse, nhà phố liền kề, Biệt thự đơn lập Tổng diện…”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…n thấp tầng 100% có sân vườn, gồm shophouse, biệt thự tứ lập, biệt thự vườn và đơn lập.”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…với 692 căn thấp tầng 100% có sân vườn, gồm shophouse, biệt thự tứ lập, biệt thự vườn và đơn lập.”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…tại khu Hải Đăng cũ, ven sông Bắc Hưng Hải, liền kề quốc lộ 5A. Thiết kế phong cách Singapore: b…”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Loại sản phẩm — Soát: Văn phòng (office) (trích từ tổng quan) — “…6–12m, sân đỗ xe riêng. Tích hợp trường học, văn phòng ngay trong khuôn viên. Clubhouse The Canopy:…”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Tiện ích nổi bật — Soát: Gần bệnh viện (near_hospital) (trích từ tổng quan) — “…thuận tiện: quốc lộ 5A, cao tốc 5B, Vincom, Vinmec. Sổ đỏ lâu dài – pháp lý vững chắc.”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Tiện ích nổi bật — Soát: Gần TTTM (near_mall) (trích từ tổng quan) — “…Kết nối thuận tiện: quốc lộ 5A, cao tốc 5B, Vincom, Vinmec. Sổ đỏ lâu dài – pháp lý vững chắc.”
- **The Fullton CapitaLand Ocean Park 3 Hưng Yên** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ tổng quan) — “…Hưng Yên Vị trí đắc địa tại khu Hải Đăng cũ, ven sông Bắc Hưng Hải, liền kề quốc lộ 5A. Thiết kế p…”
- **Diamond Paragon Bắc Giang** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…ển: Gồm 958 lô đất với đa dạng sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại.…”
- **Diamond Paragon Bắc Giang** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…58 lô đất với đa dạng sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại. Tiện ích:…”
- **Diamond Paragon Bắc Giang** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…sản phẩm: Căn liền kề. Biệt thự sang trọng. Shophouse thương mại. Tiện ích: Đầy đủ và hiện đại, đá…”
- **Diamond Paragon Bắc Giang** · Loại sản phẩm — Soát: Đất nền (land) (trích từ tổng quan) — “…đẹp nhất thuộc dòng sản phẩmDiamond – Các lô đất nền mặt đường lớn có giátrị thương mại và tiềm n…”
- **Noble Palace Long Biên** · Sản phẩm — Gợi ý: Biệt thự song lập — 172 (không thấy diện tích trong cùng câu, chưa điền) — “…ượng sản phẩm: 172 biệt thự song lập Diện tích đất…”
- **Noble Palace Long Biên** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…n Quy mô: 42.970 m² Dung lượng sản phẩm: 172 biệt thự song lập Diện tích đất giao thông, cây xanh:…”
- **Noble Palace Tây Hồ Ciputra** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…Palace Tây Hồ Được quy hoạch gồm 2 phân khu: Biệt thự thương mại nội khu phong cách Tây Âu. Biệt t…”
- **Masterise Homes Thủy Nguyên Hải Phòng** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…h này hứa hẹn sẽ cung cấp cho thị trường 220 căn hộ thấp tầng.”
- **Masterise Homes Thủy Nguyên Hải Phòng** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…3[hotline TAMI]m Loại hình sản phẩm: Tổ hợp shophouse thương mại dịch vụ hỗn hợp Khối tháp thương…”
- **Hồng Hạc City Thuận Thành, Bắc Ninh** · Sản phẩm — Gợi ý: Biệt thự — 2000 (không thấy diện tích trong cùng câu, chưa điền) — “…Sản phẩm: hơn 2000 căn biệt thự, nhà liền kề Đ…”
- **Hồng Hạc City Thuận Thành, Bắc Ninh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…000 tỷ đồng Sản phẩm: hơn 2000 căn biệt thự, nhà liền kề Đơn vị thiết kế: Công ty tư vấn quốc tế Surb…”
- **Hồng Hạc City Thuận Thành, Bắc Ninh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…đầu tư: 3000 tỷ đồng Sản phẩm: hơn 2000 căn biệt thự, nhà liền kề Đơn vị thiết kế: Công ty tư vấn…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Sản phẩm — Gợi ý: Biệt thự đơn lập — 517 (không thấy diện tích trong cùng câu, chưa điền) — “…Biệt thự: Gồm 517 căn biệt thự đơn lập và song lập, t…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…đa 5 tầng. Khu tái định cư: Gồm 491 lô đất. Chung cư cao tầng: 5 ô quy hoạch chung cư cao 25 tầng…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…o phong cách Tân Cổ Điển, cao tối đa 5 tầng. Nhà phố: 4.510 căn bao gồm shophouse và nhà phố liền…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…u Nghĩa, tỉnh Long An. 2️⃣ Sản phẩm dự kiến: Biệt thự: Gồm 517 căn biệt thự đơn lập và song lập, t…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…ao tối đa 5 tầng. Nhà phố: 4.510 căn bao gồm shophouse và nhà phố liền kề, với chiều cao tối đa 5 t…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ mô tả ngắn) — “…An Vinhomes Urban Lake Long An – khu đô thị ven hồ đẳng cấp với vị trí chiến lược, không gian s…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Tiện ích nổi bật — Soát: Gần trường học (near_school) (trích từ tổng quan) — “…ới các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng với đó là các tiện…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Tiện ích nổi bật — Soát: Gần bệnh viện (near_hospital) (trích từ tổng quan) — “…ngroup với các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng với đó…”
- **Vinhomes Urban Lake Hậu Nghĩa Long An** · Tiện ích nổi bật — Soát: Gần TTTM (near_mall) (trích từ tổng quan) — “…thái Vingroup với các tiện ích đẳng cấp như Vincom, Vinmec, Vinschool, VinWonders, Vinbus… Cùng…”
- **Noble Marina Mũi Né** · Sản phẩm — Gợi ý: Biệt thự — 1000 (không thấy diện tích trong cùng câu, chưa điền) — “…g lớn, với hơn 1.000 biệt thự và căn hộ cao…”
- **Noble Marina Mũi Né** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…iện tích rộng lớn, với hơn 1.000 biệt thự và căn hộ cao cấp, cùng nhiều công trình biểu tượng kh…”
- **Noble Marina Mũi Né** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…dựng trên diện tích rộng lớn, với hơn 1.000 biệt thự và căn hộ cao cấp, cùng nhiều công trình biể…”
- **Noble Marina Mũi Né** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ tổng quan) — “Noble Marina Mũi Né là dự án nghỉ dưỡng đẳng cấp, đánh dấu một bước tiến mới trong n…”
- **Apec Mandala Phú Yên** · Sản phẩm — Gợi ý: Căn hộ Vị trí — 1089 (không thấy diện tích trong cùng câu, chưa điền) — “…n hộ chung cư: 1089 căn hộ Vị trí: Đại lộ Hùng V…”
- **Apec Mandala Phú Yên** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ mô tả ngắn) — “Apec Mandala Phú Yên là dự án khu nghỉ dưỡng sinh thái đầy ấn tượng của tỉnh Phú Yên. Đây…”
- **Apec Mandala Phú Yên** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…sản phẩm bất động sản chính là shophouse và căn hộ chung cư, dự án này gây ấn tượng và ngày càn…”
- **Apec Mandala Phú Yên** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…ng cấp 2 dòng sản phẩm bất động sản chính là shophouse và căn hộ chung cư, dự án này gây ấn tượng v…”
- **Apec Mandala Phú Yên** · Loại sản phẩm — Soát: Condotel (condotel) (trích từ tổng quan) — “…ện tích: 10.872 m2 Loại sản phẩm: Shophouse, căn hộ khách sạn Chiều cao tòa căn hộ: 27 tầng Số căn shophou…”
- **Vinhomes Global Gate Hạ Long** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ tổng quan) — “…hu phức hợp đa năng, đô thị ven biển gắn với khu nghỉ dưỡng sinh thái, sân golf và dịch vụ tiện ích tại…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt thự Luxury — 19 (không thấy diện tích trong cùng câu, chưa điền) — “…hữu bộ sưu tập 19 căn Biệt thự Luxury, 80 căn Biệt t…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt thự đơn lập — 80 (không thấy diện tích trong cùng câu, chưa điền) — “…ệt thự Luxury, 80 căn Biệt thự đơn lập và 74 Biệt thự…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt thự song lập — 74 (không thấy diện tích trong cùng câu, chưa điền) — “…thự đơn lập và 74 Biệt thự song lập - Biệt Thự Son…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt Thự 182–256 m² (không có số lượng, chưa điền) — “…thự song lập - Biệt Thự Song Lập : 182 - 256m2 - Biệt Thự Đơn…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt Thự 320–560 m² (không có số lượng, chưa điền) — “…182 - 256m2 - Biệt Thự Đơn Lập : 320 - 560m2 - Biệt Thự Lux…”
- **Thung Lũng Thanh Xuân Valley** · Sản phẩm — Gợi ý: Biệt Thự 507–748 m² (không có số lượng, chưa điền) — “…320 - 560m2 - Biệt Thự Luxury : 507 - 748m2 Thời gian khởi…”
- **Thung Lũng Thanh Xuân Valley** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…y có quy hoạch bài bản, nổi bật với sản phẩm Biệt thự trong thung lũng đan xen những tiện ích sáng…”
- **Vinpearl Mỹ Lâm Tuyên Quang** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…phân khu chính gồm: Khu 450ha: hơn 4,000 căn biệt thự Khu 100ha: sân Golf tiêu chuẩn Quốc tế. Khu…”
- **Vinpearl Mỹ Lâm Tuyên Quang** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…00ha: sân Golf tiêu chuẩn Quốc tế. Khu 30ha: shophouse, Bệnh viện Vinmec, khu dưỡng lão, Onsen & sp…”
- **Vinpearl Mỹ Lâm Tuyên Quang** · Tiện ích nổi bật — Soát: Gần bệnh viện (near_hospital) (trích từ tổng quan) — “…olf tiêu chuẩn Quốc tế. Khu 30ha: shophouse, Bệnh viện Vinmec, khu dưỡng lão, Onsen & spa, khách sạ…”
- **MINH GIANG ĐẦM VÀ** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…mua bán Loại hình được phát triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình…”
- **MINH GIANG ĐẦM VÀ** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ lâu dài”
- **MINH GIANG ĐẦM VÀ** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…được phát triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ…”
- **MINH GIANG ĐẦM VÀ** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…triển tại dự án: Căn hộ chung cư, biệt thự, shophouse, liền kề Hình thức sở hữu: Sổ đỏ lâu dài”
- **Crystal Holidays Habour Hạ Long** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ mô tả ngắn) — “…mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.000 m2.”
- **Crystal Holidays Habour Hạ Long** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…ách sạn 5 sao, trung tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộ…”
- **Crystal Holidays Habour Hạ Long** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.000 m2.”
- **Crystal Holidays Habour Hạ Long** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ mô tả ngắn) — “…ách sạn 5 sao, trung tâm thương mại sầm uất, biệt thự nghỉ dưỡng shophouse, nhà phố và Bến cảng rộng tới 26.0…”
- **Crystal Holidays Habour Hạ Long** · Tiện ích nổi bật — Soát: Gần trường học (near_school) (trích từ tổng quan) — “…Khu Đô Thị OCean Park Vân Đồn – Quảng Ninh, Trường THPT Hải Đảo... Các điểm du lịch sinh thái "hot"…”
- **Wonder City Vân Phong** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…biển cả. Điều này tối ưu tầm nhìn từ các căn biệt thự biển, thêm gia vị cho kỳ nghỉ dưỡng với nhữn…”
- **Wonder City Vân Phong** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…ạng mọi món ăn trên khắp thế giới Cửa hàng - Shophouse: mục đích sử dụng phong phú để ở và để kinh…”
- **Wonder City Vân Phong** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ tổng quan) — “…: Nhà thấp tầng, khách sạn, căn hộ khách sạn,resort Quy mô:5 phân khu với các đặc trưng riêng ma…”
- **Wonder City Vân Phong** · Loại sản phẩm — Soát: Condotel (condotel) (trích từ tổng quan) — “…h: 500ha Sản phẩm: Nhà thấp tầng, khách sạn, căn hộ khách sạn,resort Quy mô:5 phân khu với các đặc trưng r…”
- **UDIC Riverside 2 Vĩnh Tuy** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…à ở tại khu vực phía Đông Nam Hà Nội. Vị trí liền kề giai đoạn 1 cùng khả năng kết nối qua cầu Vĩ…”
- **Mipeco Nha Trang** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịch vụ.”
- **Mipeco Nha Trang** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ mô tả ngắn) — “…quy mô khoảng 16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịch vụ.”
- **Mipeco Nha Trang** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ mô tả ngắn) — “…Tô Hiệu, quy mô khoảng 16 ha, gần biển, gồm biệt thự, nhà liền kề, căn hộ và khu thương mại – dịc…”
- **Forestia Lake Mê Linh** · Sản phẩm — Gợi ý: Liền kề — 24682 (không thấy diện tích trong cùng câu, chưa điền) — “…g số sản phẩm: 24.682 sản phẩm Liền kề và shophouse:…”
- **Forestia Lake Mê Linh** · Sản phẩm — Gợi ý: Biệt thự — 3811 (không thấy diện tích trong cùng câu, chưa điền) — “…và shophouse: 3.811 căn Biệt thự: 398 căn Căn h…”
- **Forestia Lake Mê Linh** · Sản phẩm — Gợi ý: Căn hộ — 398 (không thấy diện tích trong cùng câu, chưa điền) — “…căn Biệt thự: 398 căn Căn hộ: 11.807 căn”
- **Forestia Lake Mê Linh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không gian an cư chất lượng…”
- **Forestia Lake Mê Linh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…oảng 23,5% Tổng số sản phẩm: 24.682 sản phẩm Liền kề và shophouse: 3.811 căn Biệt thự: 398 căn Că…”
- **Forestia Lake Mê Linh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…rọng tâm, dự án cung cấp đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không…”
- **Forestia Lake Mê Linh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…dự án cung cấp đa dạng sản phẩm từ biệt thự, shophouse đến căn hộ cao tầng, mở ra không gian an cư…”
- **Vinhomes Green City Long An** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…ệt thự đơn lập Biệt thự song lập Nhà liền kề Chung cư cao tầng (25 tầng) Tiện ích nội khu: Trường…”
- **Vinhomes Green City Long An** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…át triển: Biệt thự đơn lập Biệt thự song lập Nhà liền kề Chung cư cao tầng (25 tầng) Tiện ích nội khu…”
- **Vinhomes Green City Long An** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…hành dự kiến: Năm 2028 Loại hình phát triển: Biệt thự đơn lập Biệt thự song lập Nhà liền kề Chung…”
- **Vinhomes Green City Long An** · Tiện ích nổi bật — Soát: Gần bệnh viện (near_hospital) (trích từ tổng quan) — “…tầng) Tiện ích nội khu: Trường học Vinschool Bệnh viện Vinmec Công viên cây xanh Hệ thống xe buýt đ…”
- **Vinhomes Green Paradise Cần Giờ** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…up Quy mô tổng thể: 600 ha Loại hình đầu tư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổ…”
- **Vinhomes Green Paradise Cần Giờ** · Loại sản phẩm — Soát: Nghỉ dưỡng (resort) (trích từ tổng quan) — “…up Quy mô tổng thể: 600 ha Loại hình đầu tư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổng ngân sác…”
- **Vinhomes Green Paradise Cần Giờ** · Loại sản phẩm — Soát: Condotel (condotel) (trích từ tổng quan) — “…ư: Biệt thự nghỉ dưỡng, khách sạn hạng sang, condotel Tổng ngân sách triển khai: 10 tỷ USD Pháp lý…”
- **Elegant Park Thạch Bàn** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ mô tả ngắn) — “…triển, quy mô 9.456m², cung cấp shophouse và nhà phố sở hữu lâu dài.”
- **Elegant Park Thạch Bàn** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ mô tả ngắn) — “…K Group phát triển, quy mô 9.456m², cung cấp shophouse và nhà phố sở hữu lâu dài.”
- **Elegant Park Thạch Bàn** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…à. Đan xen cùng cảnh quan xanh, Elegant Park Villa mang đến không gian sống vừa sang trọng vừa…”
- **The Legatus 22 Liễu Giai** · Sản phẩm — Gợi ý: Căn hộ để ở — 70 (không thấy diện tích trong cùng câu, chưa điền) — “…cấu công năng: 70 căn hộ để ở và 42 căn hộ k…”
- **The Legatus 22 Liễu Giai** · Sản phẩm — Gợi ý: Căn hộ khách sạn — 42 (không thấy diện tích trong cùng câu, chưa điền) — “…căn hộ để ở và 42 căn hộ khách sạn. Loại hình căn…”
- **The Legatus 22 Liễu Giai** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…ội do NHS đầu tư, cao 25 tầng với khoảng 156 căn hộ cao cấp từ 2–4 phòng ngủ và penthouse, tích…”
- **The Legatus 22 Liễu Giai** · Loại sản phẩm — Soát: Condotel (condotel) (trích từ tổng quan) — “…hầm và 112 sản phẩm, kết hợp căn hộ để ở với căn hộ khách sạn. Các lựa chọn trải dài từ căn 1 phòng ngủ mở…”
- **Hà Nội Orchard Park 6-8 Chùa Bộc** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ mô tả ngắn) — “…làm chủ đầu tư, quy mô 9.825,7 m² với 2 tòa căn hộ và 1 tòa thương mại dịch vụ.”
- **Hà Nội Orchard Park 6-8 Chùa Bộc** · Loại sản phẩm — Soát: Văn phòng (office) (trích từ tổng quan) — “…o 24 tầng, với 2 tòa căn hộ cao cấp và 1 tòa văn phòng. Loại hình phát triển: Căn hộ, không gian th…”
- **Hà Nội Orchard Park 6-8 Chùa Bộc** · Tiện ích nổi bật — Soát: Gần trường học (near_school) (trích từ tổng quan) — “…hê, khu mua sắm, khu vui chơi, phòng khám và nhà trẻ. Nhà thầu thi công: Thông tin đang được cập…”
- **Hà Nội Orchard Park 6-8 Chùa Bộc** · Tiện ích nổi bật — Soát: Gần bệnh viện (near_hospital) (trích từ tổng quan) — “…àng, quán cà phê, khu mua sắm, khu vui chơi, phòng khám và nhà trẻ. Nhà thầu thi công: Thông tin đan…”
- **Bắc Thăng Long Urban City Đông Anh** · Loại sản phẩm — Soát: Căn hộ (apartment) (trích từ tổng quan) — “…: Khoảng 240.000 người Loại hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse,…”
- **Bắc Thăng Long Urban City Đông Anh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mại, văn phòng…”
- **Bắc Thăng Long Urban City Đông Anh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…người Loại hình phát triển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mạ…”
- **Bắc Thăng Long Urban City Đông Anh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…iển: Căn hộ cao tầng, biệt thự, nhà liền kề, shophouse, trung tâm thương mại, văn phòng và công trì…”
- **Bắc Thăng Long Urban City Đông Anh** · Loại sản phẩm — Soát: Văn phòng (office) (trích từ tổng quan) — “…hà liền kề, shophouse, trung tâm thương mại, văn phòng và công trình công cộng Định hướng quy hoạch…”
- **Khu đô thị đa mục tiêu Lĩnh Nam** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…g trong cùng một quần thể Khu đô thị định cư liền kề: Quy mô khoảng 98 ha Công viên bán ngập và c…”
- **Khu đô thị đa mục tiêu Lĩnh Nam** · Tiện ích nổi bật — Soát: View sông/hồ (water_view) (trích từ tổng quan) — “…ịnh hướng hình thành một khu đô thị hiện đại ven sông Hồng, kết hợp đồng bộ giữa chức năng nhà ở,…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Sản phẩm — Tên loại sản phẩm bản tiếng Anh để trống — nhập tay hoặc bấm "Dịch lại bằng AI" ở dự án.
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Loại sản phẩm — Soát: Nhà phố/Liền kề (townhouse) (trích từ tổng quan) — “…t thự đất nền, diện tích 300 – 350 m² 227 lô liền kề đất nền, diện tích 84 – 120 m² 22 căn biệt t…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Loại sản phẩm — Soát: Biệt thự (villa) (trích từ tổng quan) — “…1 ha Pháp lý: Sở hữu lâu dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Loại sản phẩm — Soát: Shophouse (shophouse) (trích từ tổng quan) — “…thự xây thô, diện tích 250 – 300 m² 154 căn shophouse xây thô, diện tích 96 – 126 m² Tiện ích: 7 k…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Loại sản phẩm — Soát: Đất nền (land) (trích từ tổng quan) — “…lý: Sở hữu lâu dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền kề đất n…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Sản phẩm — Soát: Biệt thự đất nền · số lượng 96 · 300–350 m² (trích từ tổng quan) — “…dài Sản phẩm: 96 lô biệt thự đất nền, diện tích 300 – 350 m² 227 lô liền kề…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Sản phẩm — Soát: Liền kề đất nền · số lượng 227 · 84–120 m² (trích từ tổng quan) — “…h 300 – 350 m² 227 lô liền kề đất nền, diện tích 84 – 120 m² 22 căn biệt th…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Sản phẩm — Soát: Biệt thự xây thô · số lượng 22 · 250–300 m² (trích từ tổng quan) — “…ch 84 – 120 m² 22 căn biệt thự xây thô, diện tích 250 – 300 m² 154 căn shopho…”
- **The Crown Đại Hoàng Sơn Bắc Ninh** · Sản phẩm — Soát: Shophouse xây thô · số lượng 154 · 96–126 m² (trích từ tổng quan) — “…h 250 – 300 m² 154 căn shophouse xây thô, diện tích 96 – 126 m² Tiện ích: 7 kh…”
