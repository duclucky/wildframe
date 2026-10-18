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

59 mục trong thư viện chính: 39 ảnh AI kèm đúng prompt đã dùng và 20 ảnh tham khảo kèm prompt nghiên cứu viết lại. Hai nguồn được ghi nhãn riêng trên website. Bộ sưu tập có Wildlife, Landscapes, Macro và Underwater; phong cách Photography, Painterly, Ink wash và Dreamscape.

Tìm kiếm, lọc, sao chép masterprompt, lưu yêu thích, xuất bộ sưu tập JSON và chia sẻ liên kết trực tiếp đến từng prompt. Studio hỗ trợ thay chủ thể, bối cảnh, ánh sáng, bảng màu, bố cục, phong cách, tỷ lệ và exclusions; đặt tên, lưu tối đa 20 phiên bản cho từng prompt, phục hồi, so sánh A/B và tải TXT/JSON lịch sử. Studio chỉnh văn bản, không tự sinh ảnh.

Prompt DNA giải thích các đoạn trích đúng từ masterprompt gốc và dẫn đến ô chỉnh tương ứng trong Studio. Từ thư viện, nút “Explore visual experiments” mở hai bài so sánh ba phong cách, với 6 ảnh AI riêng cho Lab; cả 6 prompt này cũng hỗ trợ Saved, chia sẻ và xuất JSON. Tổng cộng 65 ảnh và công thức đều xuất hiện trên quả cầu. 18 ảnh atlas mới được phân bố xen kẽ cùng ảnh cũ và Lab trên toàn bề mặt cầu.

Nút “Try your first remix” mở hướng dẫn tùy chọn qua chọn phong cách, hiểu prompt và sửa/lưu. Người dùng có thể bỏ qua; thông báo hoàn thành chỉ xuất hiện sau khi lưu thành công. `/try` là bài dùng thử tự báo cáo, xuất JSON tại máy và không tự gửi phản hồi. Chưa có kết quả thử nghiệm với người thật.

Khối cầu trên desktop xoay nhẹ theo hướng di chuột, không cần giữ nút. Chuyển động dừng dần khi chuột đứng yên, tạm dừng trong thư viện/modal và tắt theo reduced motion. Điện thoại vẫn kéo để xoay; nhấp ảnh vẫn mở đúng prompt. `tests/sphere-follow.cjs` kiểm tra bốn nhóm hành vi này.

Khi chuột dừng trên ảnh, một thẻ nhỏ hiện tên và phong cách; ảnh được viền sáng và những ảnh khác tối nhẹ. “Lock view” khóa góc nhìn nhưng vẫn cho mở ảnh, “Reset angle” khôi phục góc ban đầu và giữ trạng thái khóa. Có thể Tab đến khối cầu, dùng phím mũi tên để xoay và Enter để mở ảnh phía trước. Trên điện thoại, ảnh được xác định theo tọa độ chạm để tránh trình duyệt chọn nhầm ảnh chồng lấn ở mép cầu.

Thanh tìm kiếm và bộ lọc được ghim ngay dưới header trên desktop, tablet và điện thoại. Các thẻ lọc đang áp dụng có nút xóa riêng. Đóng prompt giữ vị trí cuộn, trả focus về ảnh đã mở và đánh dấu ảnh đó bằng viền nhẹ. Phần chữ trung tâm và mô tả trang chủ có nền tối mềm để đọc rõ hơn giữa 65 ảnh.

Lịch sử dùng khóa `wildframe:remixes:v2`, tự chuyển biến thể cũ ở `wildframe:variation:v1` một lần, giữ nguyên khóa cũ. Dữ liệu không đọc được không bị ghi đè; khi không thể lưu, người dùng vẫn có thể sao chép hoặc tải file.

Yêu thích và biến thể lưu trong trình duyệt. Chưa có tài khoản, backend cộng đồng hoặc đồng bộ giữa thiết bị. Liên kết chia sẻ dùng địa chỉ hiện tại; địa chỉ localhost cần được triển khai lên hosting trước khi chia sẻ cho người bên ngoài.

## Ảnh và nguồn prompt

45 ảnh tạo bằng công cụ ImageGen tích hợp. Prompt thực tế, đường dẫn ảnh gốc và WebP nằm tại `assets/generated/manifest.json` (15 ảnh động vật), `assets/landscapes/manifest.json` (6 phong cảnh), `assets/experiments/manifest.json` (6 ảnh Lab) và `assets/atlas/manifest.json` (18 ảnh mới). PNG gốc nằm trong thư mục `originals` tương ứng. Ảnh tham khảo cũ vẫn dùng URL từ bộ mẫu ban đầu.

## Kiểm tra

- `node --check source/app.js`
- `node tests/wildframe.cjs`: 7 nhóm kiểm tra chức năng, clipboard bị từ chối, storage/ảnh bị chặn.
- `node tests/wildframe-motion.cjs`: 3 nhóm kiểm tra chuyển động, thao tác chạm, responsive và chọn ảnh trên khối cầu.

- `node tests/wildframe-audit.cjs`: 3 nhóm hồi quy UI/UX.
- `node tests/wildframe-visuals.cjs`: 4 nhóm hiệu ứng, responsive và fallback.
- `node tests/wildframe-lab.cjs`: 7 nhóm Prompt DNA, Lab, lịch sử, chuyển dữ liệu, Saved/export/share và lỗi lưu trữ.
- `node tests/lab-core.cjs`: 6 nhóm logic lắp prompt, đối chiếu, dữ liệu lỗi, quota và bảo toàn dữ liệu cũ.
- `python scripts/validate-lab.py`: kiểm tra 41 prompt cũ không đổi, 65 bộ chú giải, nguồn/prompt của 6 ảnh Lab và 18 ảnh atlas mới, file ảnh và HTML/giấy phép nhúng.
- `node tests/sphere-density.cjs`: kiểm tra 65 ảnh duy nhất trên quả cầu, tải ảnh, số lượng thư viện và prompt/DNA của ảnh mới.
- `node tests/atlas-ux.cjs`: 6 nhóm kiểm tra khóa/khôi phục góc, preview ảnh, bàn phím, xóa bộ lọc riêng, vị trí quay lại, chọn ảnh bằng chạm và responsive.

35 nhóm kiểm tra đã chạy thành công: 24 nhóm browser gốc, 4 nhóm hướng dẫn lần đầu, 1 nhóm biểu mẫu dùng thử và 6 nhóm logic. Browser dùng Playwright từ runtime cục bộ và Edge trên máy này; đường dẫn runtime được ghi trực tiếp trong file kiểm tra. Không có lỗi JavaScript trong các bài browser. Kiểm tra điện thoại bằng mô phỏng trình duyệt, chưa kiểm tra trên thiết bị vật lý. Ảnh chụp QA nằm trong `qa/wildframe-*.png`. Các bài kiểm tra portfolio cũ chỉ áp dụng cho các bản HTML sao lưu, giữ local và không thuộc bộ kiểm tra hiện tại.

Cấu hình GitHub/Vercel và bản public đã được người dùng cho phép. `scripts/build-static.cjs` chỉ đưa các tệp được chọn vào `dist`, không đưa source, bản sao lưu, ảnh QA hay credentials lên website. Kết quả triển khai được xác nhận sau khi deploy và kiểm tra truy cập ẩn danh.

Đã xuất bản tại https://wildframe.vercel.app và trang bài dùng thử https://wildframe.vercel.app/try. Repo https://github.com/duclucky/wildframe được giữ private; website truy cập công khai không cần đăng nhập. Vercel đã kết nối repo để cập nhật từ nhánh `main`.
