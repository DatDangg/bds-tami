# Ảnh minh hoạ cho dữ liệu mẫu

Chỉ dùng cho `pnpm seed --sample` (dev/staging, không bao giờ vào production). Không cần mạng khi seed: ảnh nằm sẵn trong repo và được upload qua Payload Local API (S3/SeaweedFS).

| File | Nguồn | Giấy phép |
|---|---|---|
| `can-ho-song-sai-gon.webp` | Tự tạo bằng `scripts/generate-sample-images.mjs` (hình khối vẽ bằng SVG, raster hoá bằng sharp) | Tự tạo, không dùng ảnh bên thứ ba; dùng tự do (CC0) |
| `khu-do-thi-tay-ho.webp` | như trên | như trên |
| `biet-thu-ven-bien.webp` | như trên | như trên |
| `can-ho-trung-tam.webp` | như trên | như trên |
| `nha-pho-thuong-mai.webp` | như trên | như trên |
| `khu-do-thi-sinh-thai.webp` | như trên | như trên |

- Kích thước mỗi ảnh 1600×1000 WebP, tổng dưới 100 KB (giới hạn đã chốt: dưới 2 MB).
- Thay ảnh thật: sửa `scripts/generate-sample-images.mjs` rồi chạy `node scripts/generate-sample-images.mjs`, hoặc thay file (giữ tên, giữ định dạng ảnh được `MEDIA_POLICY` cho phép). Ảnh đến từ bên ngoài phải ghi nguồn và giấy phép vào bảng trên.
