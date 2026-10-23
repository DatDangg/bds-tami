# builder · BL-020 phase-5-task-02 (UI khối market chi tiết dự án)
Done: view model (highlights/nearby/priceRows/faqs), ProjectHighlights, NearbyTabs (+ProjectLocation, LazyMap markers), PriceTable, ProjectFaq (+buildFaqPageJsonLd), Pháp lý gộp tài liệu (Documents -> h3 trong LegalPolicy, anchorIds), thứ tự mục con mới, i18n vi/en, docs S03 + DESIGN.md, carry-over (RentalCard imageSizes, bỏ vndRange, test areaTo/priceTo âm), tests.
Verify: lint 0 error, typecheck OK, test 289 files/3050 passed, build OK. migrate:create --skip-empty: không sinh migration.
Chưa làm: kiểm tra trực quan trình duyệt (DB chưa có dữ liệu khối mới); spec delta F2 cho khối mới (session chính).
