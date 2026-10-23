// Dữ liệu 3 dự án — chép từ docs/content-intake/projects/*.md (bản đã duyệt 2026-10-23).
// Rich text viết dạng markdown, script chuyển sang Lexical.

export const DEVELOPERS = {
  capitaland: { name: "CapitaLand Development", website: "https://www.capitaland.com" },
  pristie: { name: "Pristie" },
  ciputra: { name: "Ciputra Hanoi" },
};

export const PROJECTS = [
  {
    slug: "maison-privee",
    title: "Maison Privée",
    category: "Căn hộ chung cư",
    developer: "capitaland",
    summary:
      "Hai tòa căn hộ hạng sang của CapitaLand giữa khu đô thị Ciputra, 490 căn, 68 tiện ích, garage siêu xe riêng, mục tiêu chứng chỉ WELL, dự kiến bàn giao Q4/2029.",
    overview: `Maison Privée là dự án nhà ở cao tầng mới của CapitaLand Development tại Hà Nội, phát triển cùng hai đối tác Nhật Bản là Mitsubishi Estate và Nomura Real Estate. Dự án nằm tại ô đất CT07-CT1 trong khu đô thị Nam Thăng Long (Ciputra), phường Phú Thượng — một trong những khu đô thị quốc tế lâu đời và quy hoạch bài bản nhất phía Tây Hồ Tây.

Dự án gồm hai tòa tháp 35 tầng trên khu đất khoảng 8.087 m², mật độ xây dựng 35%. Tòa M có 308 căn, từ 2 phòng ngủ đến penthouse. Tòa P — mang tên riêng **Maison Privée Reserve** — có 182 căn từ 3 phòng ngủ trở lên, toàn bộ căn có sảnh thang máy riêng, cùng các căn Duplex "Sky Maison" trần cao và penthouse trên đỉnh tháp.

Hệ tiện ích 68 hạng mục được trải trên nhiều tầng: khu vườn và sảnh đón ở tầng 1, tầng Wellness Suite riêng ở tầng 2, khu sinh hoạt gia đình ở tầng 3, các vườn trên cao ở tầng 13 và 20, và hồ bơi vô cực The Crest ở tầng 35. Dự án có garage trưng bày xe dành cho cư dân và tỷ lệ chỗ đỗ ô tô 1:1.

Maison Privée đặt mục tiêu đạt chứng nhận WELL for Residential (tiền chứng nhận) — với hệ thống cấp khí tươi có lọc cho tòa P, lọc nước toàn tòa và vật liệu sơn ít VOC. Căn hộ bàn giao hoàn thiện với thiết bị từ các thương hiệu châu Âu như Franke, V-ZUG, Villeroy & Boch, Gessi, Geberit và Axor.

Thiết kế kiến trúc do P&T Group (Singapore), nội thất do Steve Leung Design và PTANG Studio (Hồng Kông), cảnh quan do Redland-Scape (Thái Lan) đảm nhận. Dự án dự kiến khởi công Q3/2026 và bàn giao Q4/2029.`,
    legalInfo: `- Quyết định số 1279/QĐ-UBND ngày 23/03/2026 của UBND TP Hà Nội chấp thuận điều chỉnh nhà đầu tư.
- Giấy chứng nhận đăng ký đầu tư cấp lần đầu ngày 27/03/2026, mã dự án 6207552581.
- Quyết định số 611/QĐ-UBND ngày 30/01/2024 phê duyệt điều chỉnh cục bộ quy hoạch chi tiết 1/500 Giai đoạn III KĐT Nam Thăng Long (bao gồm ô CT07).
- Thiết kế cơ sở được Sở Xây dựng Hà Nội chấp thuận tại văn bản số 12730/SXD-QLXD ngày 24/09/2025; công trình được miễn giấy phép xây dựng theo văn bản số 14648/SXD-CP ngày 29/10/2025.
- Giấy chứng nhận quyền sử dụng đất số AA06660158 cấp ngày 17/06/2026.
- Văn bản xác nhận nhà ở hình thành trong tương lai đủ điều kiện kinh doanh: đang chờ cập nhật.`,
    salesPolicy: `*Chính sách dự kiến của chủ đầu tư, có thể thay đổi.*

- Ký quỹ giữ chỗ có hoàn lại (dự kiến khoảng 200 triệu đồng).
- Lộ trình chung: ký thỏa thuận đặt cọc 5% (Q4/2026) → ký hợp đồng mua bán 5% (Q2/2027) → bàn giao Q4/2029 → 5% cuối khi nhận Giấy chứng nhận.
- **Thanh toán theo tiến độ:** các đợt 5%/quý theo tiến độ xây dựng, 45% khi nhận bàn giao.
- **Hỗ trợ vay:** chủ đầu tư hỗ trợ lãi suất phần vay ngân hàng (30% giá trị) đến khi bàn giao hoặc tối đa 24 tháng, tùy mốc nào đến trước, kèm ân hạn nợ gốc trong thời gian hỗ trợ.
- **Thanh toán linh hoạt:** chỉ thanh toán khoảng 35% trước bàn giao, 60% khi nhận nhà.
- Liên hệ Tami Homes để nhận bảng tính chi tiết theo từng căn.`,
    salesStatus: "upcoming",
    ward: "Phú Thượng",
    address: "Ô CT07-CT1, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội",
    areaFromM2: 97.6,
    areaToM2: 397.8,
    productTypes: ["apartment"],
    featuredAmenities: ["near_school", "near_hospital", "near_mall", "near_metro", "pool_gym_spa", "green_park"],
    scale: { totalUnits: 490, blocks: 2, floors: 35, landAreaM2: 8087, handoverTime: "Quý 4/2029" },
    products: [
      { type: "2PN+ Tòa M", areaFrom: 97.6, areaTo: 97.6 },
      { type: "3PN+ Tòa M", areaFrom: 122.6, areaTo: 132.2 },
      { type: "3PN+ Tòa P", areaFrom: 158.3, areaTo: 158.4 },
      { type: "4PN Tòa M", count: 2, areaFrom: 221.2, areaTo: 221.2 },
      { type: "4PN+ Tòa P", areaFrom: 197.4, areaTo: 198 },
      { type: "Duplex Tòa P", count: 14, areaFrom: 287.8, areaTo: 287.9 },
      { type: "Penthouse", count: 3, areaFrom: 272.8, areaTo: 397.8 },
    ],
    amenities: [
      ["Garage siêu xe riêng", "Khu trưng bày 7 xe dành cho cư dân sưu tầm xe."],
      ["Wellness Suite", "Trọn tầng 2 với 16 hạng mục chăm sóc sức khỏe."],
      ["Bể bơi bốn mùa & Jacuzzi", "Bơi quanh năm trong không gian kín."],
      ["Hồ bơi vô cực The Crest 35", "Trên đỉnh tháp, nhìn toàn cảnh Hồ Tây và Ciputra."],
      ["Gym, Yoga & Pilates", "Phòng tập chung và phòng tập riêng."],
      ["Spa, xông hơi & phòng trị liệu lạnh", "Chu trình phục hồi khép kín."],
      ["Golf 3D", "Tập golf mô phỏng trong nhà."],
      ["Phòng chiếu phim & sảnh tiệc", "Không gian giải trí và tiếp khách riêng."],
      ["Whisky Club & phòng Cigar", "Sảnh thư giãn dành cho cư dân."],
      ["Vườn Tĩnh Uyển & đường dạo thiền nước", "Khoảng xanh yên tĩnh ở tầng trệt."],
      ["Vườn trên cao & đài quan sát", "Vườn tầng 13, tầng 20 và đài ngắm sao."],
      ["Khu vui chơi trẻ em & vườn BBQ", "Tầng 3 dành cho gia đình."],
    ],
    highlights: [
      ["Chủ đầu tư quốc tế", "CapitaLand liên doanh Mitsubishi Estate & Nomura Real Estate."],
      ["Hai tòa, 490 căn", "Tòa P \"Reserve\" 100% căn có sảnh thang máy riêng."],
      ["68 tiện ích", "Wellness Suite trọn tầng, hồ bơi vô cực tầng 35."],
      ["Mục tiêu WELL Residential", "Khí tươi có lọc, nước lọc toàn tòa, sơn ít VOC."],
      ["Bàn giao hoàn thiện", "Thiết bị Franke, V-ZUG, Villeroy & Boch, Geberit, Axor."],
    ],
    nearby: [
      ["education", "Trường Quốc tế Liên Hợp Quốc Hà Nội (UNIS)"],
      ["education", "Trường Quốc tế Singapore (SIS) / Kinderworld"],
      ["education", "Hanoi Academy"],
      ["healthcare", "Bệnh viện Đa khoa Phương Đông"],
      ["healthcare", "Sun Healthcare"],
      ["shopping", "Lotte Mall West Lake Hanoi"],
      ["shopping", "Vincom Plaza, Thiso Mall"],
      ["park", "Ciputra Central Park, Công viên Hòa Bình"],
      ["transport", "Hồ Hoàn Kiếm", 15, "min"],
      ["transport", "Sân bay Nội Bài", 20, "min"],
      ["transport", "Vành đai 1, 2, 2.5, 3", 5, "min"],
      ["transport", "Metro tuyến 2", 5, "min"],
    ],
    priceTable: [],
    faqs: [
      ["Maison Privée do ai phát triển?", "CapitaLand Development, liên doanh cùng Mitsubishi Estate và Nomura Real Estate."],
      ["Khi nào bàn giao?", "Dự kiến Quý 4/2029."],
      ["Căn hộ bàn giao thế nào?", "Căn 2–4 phòng ngủ bàn giao hoàn thiện; căn Duplex bàn giao hoàn thiện cơ bản."],
      ["Dự án có chỗ đỗ ô tô cho từng căn không?", "Tỷ lệ chỗ đỗ ô tô 1:1 theo thông tin chủ đầu tư công bố."],
      ["Tòa M và tòa P khác nhau thế nào?", "Tòa M có căn từ 2PN+; tòa P (Reserve) từ 3PN+, 100% căn có sảnh thang máy riêng."],
    ],
  },
  {
    slug: "astor-1",
    title: "Astor 1",
    category: "Căn hộ chung cư",
    developer: "pristie",
    summary:
      "Tòa căn hộ Art Deco 40 tầng tại lô IA25 KĐT Nam Thăng Long (Ciputra), 350 căn từ Studio đến Penthouse, 25 tiện ích nội khu, CBRE quản lý vận hành.",
    overview: `Astor 1 là tòa căn hộ cao tầng tại lô IA25, khu đô thị Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội. Dự án do Pristie phát triển, Stellar thiết kế, Tập đoàn Xây dựng Delta làm tổng thầu và CBRE đảm nhận quản lý vận hành.

Tòa nhà cao 40 tầng nổi và 2 tầng hầm trên khu đất 0,36 ha, mật độ xây dựng khoảng 37%. Kiến trúc lấy cảm hứng Art Deco với sảnh chính cao 9 m. Toàn bộ 350 căn hộ được bố trí để căn và các phòng ngủ đều đón sáng, gió tự nhiên.

Sản phẩm đa dạng từ Studio, căn 2–3 phòng ngủ, căn Dual Key 5PN đến Duplex và Penthouse sân vườn trên các tầng cao. Hệ 25 tiện ích nội khu gồm bể bơi bốn mùa, khu wellness, gym – yoga, Kids Club, Golf 3D, thư viện, clubhouse và khuôn viên cây xanh khoảng 3.000 m².

Căn hộ bàn giao hoàn thiện liền tường, có sẵn máy rửa bát, hệ thông gió thu hồi nhiệt lọc HEPA, lọc nước RO và gói nhà thông minh. Cư dân đồng thời hưởng hệ tiện ích sẵn có của khu đô thị Ciputra như sân golf, trường quốc tế, bệnh viện và công viên. Dự án dự kiến bàn giao Quý I/2029.`,
    legalInfo: `- Dự án thuộc "Dự án xây dựng nhà ở cho lực lượng vũ trang Công an nhân dân tại ô đất IA25"; Astor 1 là tòa nhà ở thương mại trong dự án.
- Chủ đầu tư: Công ty CP Thái Nam Land; Pristie là đơn vị phát triển dự án.
- Quyết định số 6843/QĐ-BCA-H02 ngày 08/08/2025 của Bộ Công an chấp thuận chủ trương đầu tư.
- Quyết định số 345/QĐ-UBND ngày 09/10/2025 của UBND phường Phú Thượng điều chỉnh cục bộ quy hoạch chi tiết 1/500 ô I.A.25.
- Giấy phép xây dựng số 73/GPXD ngày 29/10/2025 và số 06/GPXD ngày 11/02/2026.
- Hình thức sở hữu: lâu dài. Dự án không bán cho người nước ngoài.`,
    salesPolicy: `*Chính sách dự kiến của chủ đầu tư, có thể thay đổi.*

- Đặt cọc 100 triệu đồng/căn.
- **Thanh toán theo tiến độ tiêu chuẩn:** chiết khấu 4%, thanh toán 14 đợt, 25% khi nhận bàn giao, 5% khi nhận Giấy chứng nhận.
- **Thanh toán theo tiến độ đặc biệt:** chiết khấu 4%, áp dụng cho 30 căn đầu tiên hoặc đến hết 30/10/2026.
- **Thanh toán sớm:** chiết khấu 14%.
- **Vay ngân hàng:** hỗ trợ vay tối đa 70% giá trị, hỗ trợ lãi suất 0% trong 24 tháng (không quá 31/03/2029), ân hạn nợ gốc 24 tháng. Ngân hàng đồng hành: BIDV, MB, VIB, VietinBank.
- **Ưu đãi:** chiết khấu 2% cho 50 khách hàng đầu tiên; miễn phí quản lý 36 tháng.
- Các khoản chiết khấu tính lần lượt, không cộng gộp; chưa gồm VAT và kinh phí bảo trì.`,
    salesStatus: "selling",
    ward: "Phú Thượng",
    address: "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội",
    priceFromVnd: 7_700_000_000,
    priceToVnd: 13_840_000_000,
    areaFromM2: 40,
    areaToM2: 240,
    productTypes: ["apartment"],
    featuredAmenities: ["near_school", "near_hospital", "near_mall", "near_metro", "pool_gym_spa", "green_park"],
    scale: { totalUnits: 350, blocks: 1, floors: 40, landAreaM2: 3600, handoverTime: "Quý 1/2029" },
    products: [
      { type: "Studio", count: 24, areaFrom: 40, areaTo: 40 },
      { type: "2 phòng ngủ", count: 175, areaFrom: 69, areaTo: 97 },
      { type: "3 phòng ngủ", count: 123, areaFrom: 101, areaTo: 117 },
      { type: "Dual Key 5PN", count: 4, areaFrom: 210, areaTo: 210 },
      { type: "Duplex", count: 20, areaFrom: 134, areaTo: 214 },
      { type: "Penthouse", count: 4, areaFrom: 240, areaTo: 240 },
    ],
    amenities: [
      ["Bể bơi bốn mùa", "Khoảng 330 m², bơi quanh năm."],
      ["Tổ hợp Fitness", "Gym và yoga."],
      ["Wellness Hub", "Spa, xông hơi ướt, jacuzzi."],
      ["Aquafitness & Healing Pavilion", "Tập luyện dưới nước, không gian thư giãn."],
      ["Kids Club", "Khu vui chơi trẻ em trong nhà."],
      ["Golf 3D", "Tập golf mô phỏng."],
      ["Clubhouse & Lounge", "Tiếp khách, sinh hoạt cộng đồng."],
      ["Thư viện & Art Gallery", "Đọc sách, trưng bày nghệ thuật."],
      ["Pool Bar & BBQ ngoài trời", null],
      ["Vườn nghệ thuật, vườn dã ngoại", "Khuôn viên cây xanh khoảng 3.000 m²."],
      ["Đỗ xe thông minh & Smart Locker", "Đỗ xe nâng, tủ nhận hàng tự động."],
      ["Sảnh Art Deco cao 9 m", null],
    ],
    highlights: [
      ["Kiến trúc Art Deco", "Tòa 40 tầng, sảnh cao 9 m."],
      ["350 căn đa dạng", "Studio đến Penthouse sân vườn, có căn Dual Key."],
      ["Vận hành bởi CBRE", "Tổng thầu Delta, thiết kế Stellar."],
      ["Sống khỏe", "Thông gió thu hồi nhiệt lọc HEPA, lọc nước RO, 25 tiện ích."],
      ["Trong lòng Ciputra", "Sân golf, trường quốc tế, công viên sẵn có."],
    ],
    nearby: [
      ["education", "UNIS Hà Nội"],
      ["education", "Trường Quốc tế Singapore (SIS)"],
      ["education", "Rugby School Hanoi"],
      ["education", "Sunshine Maple Bear"],
      ["healthcare", "Bệnh viện Ciputra"],
      ["healthcare", "Bệnh viện Đa khoa Phương Đông"],
      ["shopping", "Lotte Mall West Lake"],
      ["shopping", "MM Mega Market Thăng Long"],
      ["park", "Ciputra Central Park"],
      ["park", "Ciputra Golf Club"],
      ["park", "Hồ Tây"],
      ["transport", "Ga metro tuyến 2"],
      ["transport", "Cầu Thăng Long, cầu Nhật Tân"],
    ],
    priceTable: [
      { unitType: "Căn hộ 2 phòng ngủ", areaFrom: 69.38, areaTo: 69.38, priceFrom: 7_860_000_000, priceTo: 9_220_000_000, availability: "available", note: "Tùy phương án thanh toán, chưa trừ ưu đãi" },
      { unitType: "Căn hộ 3 phòng ngủ", areaFrom: 103.04, areaTo: 103.04, priceFrom: 11_810_000_000, priceTo: 13_840_000_000, availability: "available", note: "Tùy phương án thanh toán, chưa trừ ưu đãi" },
    ],
    priceUpdatedAt: "2026-10-23",
    faqs: [
      ["Astor 1 sở hữu bao lâu?", "Sở hữu lâu dài."],
      ["Khi nào bàn giao?", "Dự kiến Quý I/2029."],
      ["Căn hộ bàn giao thế nào?", "Căn thường bàn giao hoàn thiện liền tường; Duplex và Penthouse bàn giao thô."],
      ["Phí dịch vụ dự kiến?", "Khoảng 25.000 – 30.000 đ/m²/tháng; miễn phí quản lý 36 tháng theo chính sách hiện hành."],
      ["Có chỗ đỗ xe điện không?", "Có khu đỗ và điểm sạc riêng cho ô tô, xe máy điện ở tầng hầm B1."],
      ["Người nước ngoài có mua được không?", "Không, dự án không bán cho người nước ngoài."],
    ],
  },
  {
    slug: "the-windsor-collection",
    title: "The Windsor Collection",
    category: "Nhà phố, biệt thự",
    developer: "ciputra",
    summary:
      "Bộ sưu tập dinh thự đảo hồ phong cách Anh quốc giữa công viên 66 ha của Ciputra Hanoi, 140 căn biệt thự, liền kề thuộc hai dòng The Elton Series và Everbloom.",
    overview: `The Windsor Collection là quỹ đất thấp tầng thuộc vùng lõi khu đô thị Ciputra Hanoi (Nam Thăng Long), phường Phú Thượng — khu đô thị quốc tế rộng hơn 300 ha với cộng đồng cư dân đến từ nhiều quốc gia.

Dự án nằm trên hai bán đảo Bình Minh và Hoàng Hôn, bao quanh bởi hồ điều hòa khoảng 26 ha trong tổng thể công viên và mặt nước khoảng 66 ha. Mật độ xây dựng thấp, khoảng 14%, giúp phần lớn căn nhà có tầm nhìn ra hồ hoặc công viên.

Giai đoạn 1 gồm 140 căn thấp tầng chia thành ba phân khu: **The Royal** (CT07), **The Hyde** (BT8-9) và **The Regent** (Q2). Sản phẩm thuộc hai dòng: **The Elton Series** — nhà liền kề, song lập "compact luxury" với diện tích đất từ 144 m²; và **Everbloom Series** — dinh thự đơn lập đảo hồ với diện tích đất từ 300 m² đến hơn 1.000 m².

Kiến trúc mang cảm hứng Anh quốc cổ điển, do P&T Group và Kaze Studio thiết kế; nội thất nhà mẫu do 1508 London, cảnh quan do LJ Group thực hiện. Nhà liền kề cao 4 tầng nổi cùng tầng lửng hoặc tum và 1 tầng hầm; biệt thự cao 3 tầng nổi, tum và hầm. Nhà bàn giao xây thô, hoàn thiện mặt ngoài.

Cư dân sử dụng hệ tiện ích quanh hồ như Club Windsor House, khu thương mại – văn phòng The Raffles, quảng trường, vườn chủ đề, bể bơi bốn mùa, cùng tiện ích sẵn có của Ciputra như sân golf, trường quốc tế và Ciputra Club.`,
    legalInfo: null,
    salesPolicy: "Vui lòng liên hệ Tami Homes để nhận chính sách bán hàng và bảng giá mới nhất.",
    salesStatus: "selling",
    ward: "Phú Thượng",
    address: "Bán đảo Bình Minh – Hoàng Hôn, công viên trung tâm KĐT Ciputra, phường Phú Thượng, Hà Nội",
    areaFromM2: 144,
    areaToM2: 1033,
    productTypes: ["villa", "townhouse"],
    featuredAmenities: ["near_school", "near_mall", "near_metro", "water_view", "pool_gym_spa", "green_park"],
    scale: { totalUnits: 140, floors: 4, landAreaM2: 954500 },
    products: [
      { type: "Elton – The Royal", count: 43, areaFrom: 144, areaTo: 168 },
      { type: "Elton – The Hyde", count: 19, areaFrom: 200, areaTo: 293 },
      { type: "Elton – The Regent", count: 12, areaFrom: 180, areaTo: 254 },
      { type: "Everbloom – The Royal", count: 23, areaFrom: 300, areaTo: 300 },
      { type: "Everbloom – The Hyde", count: 30, areaFrom: 300, areaTo: 300 },
      { type: "Everbloom – The Regent", count: 13, areaFrom: 500, areaTo: 1033 },
    ],
    amenities: [
      ["Club Windsor House", "Câu lạc bộ cư dân bên quảng trường Windsor."],
      ["The Raffles", "Khu thương mại dịch vụ và văn phòng ngay vùng lõi."],
      ["Hồ điều hòa 26 ha", "Mặt nước bao quanh hai bán đảo."],
      ["Công viên trung tâm ~66 ha", "Ốc đảo The Island, vườn hoa, vườn phong cách châu Âu, Việt Nam, Indonesia."],
      ["Bể bơi bốn mùa", null],
      ["Floating Walk & nhà hàng nổi", null],
      ["Sân khấu trên mặt nước & nhạc nước", null],
      ["Đài quan sát", null],
      ["Vườn BBQ gia đình & khu vui chơi trẻ em", null],
      ["An ninh nhiều lớp 24/7", "Kiểm soát ra vào qua một cổng."],
    ],
    highlights: [
      ["Dinh thự đảo hồ", "Hai bán đảo bao quanh bởi hồ 26 ha."],
      ["Mật độ xây dựng ~14%", "Công viên và mặt nước khoảng 66 ha."],
      ["Ba phân khu", "The Royal, The Hyde, The Regent."],
      ["Hai dòng sản phẩm", "The Elton Series và Everbloom Series."],
      ["Kiến trúc Anh quốc", "P&T Group, Kaze Studio, nội thất 1508 London."],
    ],
    nearby: [
      ["transport", "Ga metro Nam Thăng Long (tuyến 2)", 1, "min"],
      ["shopping", "Lotte Mall Tây Hồ", 5, "min"],
      ["park", "Hồ Tây", 5, "min"],
      ["healthcare", "Bệnh viện Tim Hà Nội cơ sở 2", 5, "min"],
      ["shopping", "MM Mega Market", 10, "min"],
      ["park", "Công viên Hòa Bình", 10, "min"],
      ["transport", "Sân bay Nội Bài", 15, "min"],
      ["transport", "Hồ Hoàn Kiếm", 15, "min"],
      ["education", "UNIS, SIS, Hanoi Academy, Rugby School, Cranleigh"],
    ],
    priceTable: [],
    faqs: [
      ["The Windsor Collection nằm ở đâu?", "Trên hai bán đảo Bình Minh và Hoàng Hôn trong công viên trung tâm KĐT Ciputra Hanoi, phường Phú Thượng."],
      ["Dự án có bao nhiêu căn?", "Giai đoạn 1 gồm 140 căn thấp tầng thuộc ba phân khu."],
      ["Nhà bàn giao thế nào?", "Xây thô, hoàn thiện mặt ngoài."],
      ["Có những dòng sản phẩm nào?", "The Elton Series (liền kề, song lập) và Everbloom Series (biệt thự, dinh thự đơn lập)."],
    ],
  },
];
