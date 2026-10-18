# WildFrame — UI/UX audit và hoàn thiện

Ngày: 17/10/2026. Phạm vi: khám phá khối cầu, thư viện, tìm kiếm/lọc, bộ sưu tập, chi tiết prompt và Studio. Chạy local; không xuất bản.

## Các vấn đề đã xử lý

| Vấn đề | Điều chỉnh và bằng chứng |
| --- | --- |
| Mở lại thư viện sau khi cuộn sâu khiến ô tìm kiếm nhận focus ngoài màn hình | Điều hướng Library/Saved đưa thư viện về đầu trang. Bài hồi quy đã tái hiện lỗi trước khi sửa và chạy thành công sau sửa. |
| Clear filters để focus trên nút vừa bị ẩn | Focus chuyển về ô tìm kiếm. |
| Saved dùng cùng tiêu đề với thư viện tổng | Tiêu đề riêng “Your saved prompts.”; tên điều khiển Saved có số lượng mục. |
| Nút lưu trên ảnh có vùng chạm 36px | Tăng lên 44×44px; ảnh, tiêu đề và viền focus có trạng thái rõ ràng. |
| Chữ phụ quá nhỏ và ô nhập khó phân biệt với nền | Tăng cỡ chữ mô tả, nhãn, nguồn và kết quả; tăng độ rõ viền ô nhập, thêm nền cho nhãn nguồn trên ảnh. |
| Thanh hành động cố định che ô đang chỉnh trên điện thoại | Tự giữ điều khiển có focus trong phần nhìn thấy, tính cả header, thanh nút và visual viewport; thêm khoảng cuộn dự phòng. Toast xuất hiện phía trên thanh nút. |
| Nút Back trong Studio bị cuộn khỏi màn hình | Đổi overflow của dialog shell sang clip để sticky header bám đúng scroll container. Bài hồi quy tái hiện lỗi trước sửa và đã pass sau sửa. |
| Chữ tiêu đề chính bị rasterize mờ do phóng trong phối cảnh 3D | Tách tiêu đề khỏi world 3D, giữ vị trí trung tâm và cỡ hiển thị tương đương; xác nhận qua ảnh chụp desktop/mobile. |
| Ảnh bị chặn để lại ảnh lỗi mặc định | Thay bằng vùng fallback có lời giải thích, giữ hình học thẻ và khả năng đọc prompt. |

## React Bits đã tích hợp

Checkout `references/react-bits`, commit `310fc737fadcaa149a4e06fb088fc95332dc8bfb`.

- **SpotlightCard:** ánh sáng theo vị trí chuột và viền masked gradient trên thẻ prompt. Chỉ xử lý khi tương tác, tắt theo reduced motion; focus bàn phím có trạng thái riêng.
- **FadeContent:** thẻ hiện dần một lần khi đi vào vùng nhìn thấy của thư viện, có độ trễ ngắn theo nhóm. Nội dung luôn tồn tại khi không có animation; tìm kiếm không liên tục phát lại hiệu ứng.

Đã đọc mã nguồn rồi chuyển phần phù hợp sang DOM/CSS và Web Animations API tại `source/visuals.js`; không thêm React, GSAP hay bundler. Giấy phép upstream được giữ trong `THIRD_PARTY_NOTICES.md` và nhúng vào HTML xuất ra.

## Kiểm chứng

17 nhóm kiểm tra browser trên Edge headless:

- `node tests/wildframe.cjs`: 7 nhóm chức năng và lỗi clipboard/storage/ảnh.
- `node tests/wildframe-motion.cjs`: 3 nhóm thao tác chạm, camera nghỉ và chọn ảnh.
- `node tests/wildframe-audit.cjs`: 3 nhóm hồi quy điều hướng, focus, bộ sưu tập và ô nhập không bị che.
- `node tests/wildframe-visuals.cjs`: 4 nhóm spotlight/reveal, reduced motion, responsive và fallback.

Không ghi nhận lỗi JavaScript trong các bài kiểm tra. Camera nghỉ có 0 callback animation trong khoảng đo 1 giây. Đã kiểm tra các chiều rộng 320, 360, 375, 390, 768, 1024 và 1440px cùng bố cục điện thoại ngang. Kiểm tra cú pháp của cả hai file JavaScript, bản HTML nhúng, 41 dữ liệu prompt và các đường dẫn ảnh local đều thành công.

Đã xem trực tiếp ảnh QA trong `qa/wildframe-*.png`, gồm thư viện, trang đầu, modal và Studio; `wildframe-studio-focused-mobile.png` thể hiện header vẫn hiện khi chỉnh ô bên dưới. Đây là kiểm tra trình duyệt mô phỏng, chưa thay thế thử nghiệm trên điện thoại vật lý hoặc audit WCAG đầy đủ.
