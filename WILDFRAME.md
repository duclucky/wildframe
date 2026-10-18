# WildFrame — Prompt Atlas

Thư viện masterprompt do nền tảng tuyển chọn, dành cho ảnh động vật và phong cảnh nghệ thuật bằng AI.

## Chạy và cập nhật

- Xem bản local: http://127.0.0.1:4173
- Nếu chưa có server: `python -m http.server 4173 --bind 127.0.0.1`
- Sửa nội dung tại `assets/prompt-catalog.json`.
- Sửa giao diện tại `source/index.template.html`, hành vi tại `source/app.js`.
- Prompt DNA, Lab và lịch sử nằm tại `source/lab-ui.js`, `source/lab.css`, `source/panels/`; logic lắp prompt và lưu phiên bản nằm tại `source/lab-core.js`.
- Nội dung Lab nằm tại `assets/visual-experiments.json`; chú giải nằm tại `assets/prompt-annotations.json`. Chạy `python scripts/prepare-prompt-annotations.py` sau khi sửa dữ liệu nguồn hoặc các chú giải được quản lý trong script đó.
- Hiệu ứng chuyển từ React Bits nằm tại `source/visuals.js`. Nguồn và giấy phép được giữ trong `THIRD_PARTY_NOTICES.md`; bản HTML xuất ra cũng chứa giấy phép.
- Chạy `python scripts/assemble-wildframe.py` để tạo lại `index.html` với CSS và JavaScript inline. Không cần framework hoặc bundler.

## Nội dung và chức năng

41 mục: 21 ảnh AI kèm đúng prompt đã dùng và 20 ảnh tham khảo kèm prompt nghiên cứu viết lại. Hai nguồn được ghi nhãn riêng trên website. Bộ sưu tập có Wildlife, Landscapes, Macro và Underwater; phong cách Photography, Painterly, Ink wash và Dreamscape.

Tìm kiếm, lọc, sao chép masterprompt, lưu yêu thích, xuất bộ sưu tập JSON và chia sẻ liên kết trực tiếp đến từng prompt. Studio hỗ trợ thay chủ thể, bối cảnh, ánh sáng, bảng màu, bố cục, phong cách, tỷ lệ và exclusions; đặt tên, lưu tối đa 20 phiên bản cho từng prompt, phục hồi, so sánh A/B và tải TXT/JSON lịch sử. Studio chỉnh văn bản, không tự sinh ảnh.

Prompt DNA giải thích các đoạn trích đúng từ masterprompt gốc và dẫn đến ô chỉnh tương ứng trong Studio. Từ thư viện, nút “Explore visual experiments” mở hai bài so sánh ba phong cách, với 6 ảnh AI riêng cho Lab; cả 6 prompt này cũng hỗ trợ Saved, chia sẻ và xuất JSON. Thư viện chính vẫn giữ 41 mục ban đầu; tổng số công thức đọc được gồm cả Lab là 47.

Nút “Try your first remix” mở hướng dẫn tùy chọn qua chọn phong cách, hiểu prompt và sửa/lưu. Người dùng có thể bỏ qua; thông báo hoàn thành chỉ xuất hiện sau khi lưu thành công. `/try` là bài dùng thử tự báo cáo, xuất JSON tại máy và không tự gửi phản hồi. Chưa có kết quả thử nghiệm với người thật.

Lịch sử dùng khóa `wildframe:remixes:v2`, tự chuyển biến thể cũ ở `wildframe:variation:v1` một lần, giữ nguyên khóa cũ. Dữ liệu không đọc được không bị ghi đè; khi không thể lưu, người dùng vẫn có thể sao chép hoặc tải file.

Yêu thích và biến thể lưu trong trình duyệt. Chưa có tài khoản, backend cộng đồng hoặc đồng bộ giữa thiết bị. Liên kết chia sẻ dùng địa chỉ hiện tại; địa chỉ localhost cần được triển khai lên hosting trước khi chia sẻ cho người bên ngoài.

## Ảnh và nguồn prompt

27 ảnh tạo bằng công cụ ImageGen tích hợp. Prompt thực tế, đường dẫn ảnh gốc và WebP nằm tại `assets/generated/manifest.json` (15 ảnh động vật), `assets/landscapes/manifest.json` (6 phong cảnh) và `assets/experiments/manifest.json` (6 ảnh Lab). PNG gốc nằm trong thư mục `originals` tương ứng. Ảnh tham khảo cũ vẫn dùng URL từ bộ mẫu ban đầu.

## Kiểm tra

- `node --check source/app.js`
- `node tests/wildframe.cjs`: 7 nhóm kiểm tra chức năng, clipboard bị từ chối, storage/ảnh bị chặn.
- `node tests/wildframe-motion.cjs`: 3 nhóm kiểm tra chuyển động, thao tác chạm, responsive và chọn ảnh trên khối cầu.

- `node tests/wildframe-audit.cjs`: 3 nhóm hồi quy UI/UX.
- `node tests/wildframe-visuals.cjs`: 4 nhóm hiệu ứng, responsive và fallback.
- `node tests/wildframe-lab.cjs`: 7 nhóm Prompt DNA, Lab, lịch sử, chuyển dữ liệu, Saved/export/share và lỗi lưu trữ.
- `node tests/lab-core.cjs`: 6 nhóm logic lắp prompt, đối chiếu, dữ liệu lỗi, quota và bảo toàn dữ liệu cũ.
- `python scripts/validate-lab.py`: kiểm tra 41 prompt cũ không đổi, 47 bộ chú giải, nguồn/prompt của 6 ảnh Lab, file ảnh và HTML/giấy phép nhúng.

35 nhóm kiểm tra đã chạy thành công: 24 nhóm browser gốc, 4 nhóm hướng dẫn lần đầu, 1 nhóm biểu mẫu dùng thử và 6 nhóm logic. Browser dùng Playwright từ runtime cục bộ và Edge trên máy này; đường dẫn runtime được ghi trực tiếp trong file kiểm tra. Không có lỗi JavaScript trong các bài browser. Kiểm tra điện thoại bằng mô phỏng trình duyệt, chưa kiểm tra trên thiết bị vật lý. Ảnh chụp QA nằm trong `qa/wildframe-*.png`. Các bài kiểm tra portfolio cũ chỉ áp dụng cho các bản HTML sao lưu, giữ local và không thuộc bộ kiểm tra hiện tại.

Cấu hình GitHub/Vercel và bản public đã được người dùng cho phép. `scripts/build-static.cjs` chỉ đưa các tệp được chọn vào `dist`, không đưa source, bản sao lưu, ảnh QA hay credentials lên website. Kết quả triển khai được xác nhận sau khi deploy và kiểm tra truy cập ẩn danh.
