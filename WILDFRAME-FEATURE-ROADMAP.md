# WildFrame — hướng phát triển tính năng

Nghiên cứu ngày 17/10/2026. Người dùng đã duyệt triển khai P0. **Đã hoàn thành Prompt DNA, Visual Experiments và Remix History**, gồm 6 ảnh tạo mới và chuyển dữ liệu cũ. Các mục P1/P2 bên dưới vẫn là đề xuất. Trạng thái hiện tại và kiểm tra được ghi trong `WILDFRAME.md`; phần nghiên cứu dưới đây lưu bối cảnh quyết định ban đầu.

## Cơ sở quyết định

Đọc mã hiện tại và catalog: 41 prompt, gồm 21 generated examples và 20 reference studies. Có 25 Wildlife, 6 Landscapes, 6 Macro và 4 Underwater. Phong cách phân bố 38 Photography, còn Painterly, Ink wash và Dreamscape chỉ có 1 mục mỗi loại. Studio hiện lưu một biến thể cuối cùng cho toàn website bằng khóa `wildframe:variation:v1`.

Khoảng trống có thể xử lý: người mới chưa hiểu cách từng phần của prompt tạo hiệu ứng; khó học sự khác biệt giữa phong cách; chỉnh nhiều ý tưởng thì mất bản lưu trước. Đây là giả thuyết sản phẩm dựa trên desk research và code review, chưa phải kết luận từ phỏng vấn người dùng.

[PromptBase](https://promptbase.com/marketplace) đã có tìm kiếm/lọc theo model và chủ đề. [Lexica](https://lexica.art/) bắt đầu bằng tìm ảnh. [Midjourney](https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web) đặt prompt, tham số và ảnh tham chiếu cạnh ảnh, cho phép sử dụng lại và tạo biến thể. Những quan sát này gợi ý WildFrame nên đào sâu việc học và tái sử dụng công thức tạo ảnh.

[Hyperbloom](https://hyperbloom-october.devpost.com/) nhấn mạnh UX, UI, accessibility, tương tác sáng tạo và trải nghiệm hoàn thiện; frontend/prototype được chấp nhận. Trang Judging Criteria hiện chưa có thang điểm cụ thể; không gán trọng số giả định. [Rules](https://hyperbloom-october.devpost.com/rules) cho phép AI và thư viện sẵn có, đồng thời yêu cầu tôn trọng giấy phép.

## Đề xuất ưu tiên

| Mức | Tính năng | Người dùng làm được gì | Phụ thuộc |
| --- | --- | --- | --- |
| P0 | Prompt DNA | Chọn một đoạn prompt để hiểu vai trò chủ thể, môi trường, ánh sáng, chất liệu và bố cục; đưa phần đó vào Studio | Chú giải do biên tập viên kiểm tra |
| P0 | Visual Experiments | Xem một ý tưởng qua 3 phong cách hoặc điều kiện ánh sáng, so sánh ảnh và phần prompt thay đổi | Ảnh ví dụ thật cùng prompt đã dùng |
| P0 | Remix History | Đặt tên, lưu nhiều biến thể theo từng prompt, phục hồi và so sánh văn bản A/B | Lược đồ lưu mới và chuyển dữ liệu cũ |
| P1 | Creative Trails | Chọn cảm xúc, thế giới và phong cách trong 3 bước để nhận bộ prompt phù hợp | Metadata mood, palette, atmosphere tuyển chọn |
| P1 | Collections | Tạo các bộ “Rừng trong sương”, “Động vật tranh mực”; thêm/xóa prompt, nhập/xuất file | Nâng bộ Saved hiện tại |
| P2 | Tool-specific Export | Chọn định dạng xuất và hướng dẫn dùng theo công cụ tạo ảnh | Kiểm chứng cú pháp và trạng thái đã thử riêng cho từng model |

## Thiết kế P0

### Prompt DNA

Giữ nguyên masterprompt gốc. Thêm `annotations` với vai trò, đoạn trích chính xác và lời giải thích; renderer hiển thị phần phân tích bên cạnh textarea gốc. Di động dùng danh sách disclosure có nhãn; màu đi kèm tên vai trò. Không tự suy ra prompt gốc của reference study. Mỗi annotation phải khớp văn bản nguồn; không khớp thì bỏ highlight và vẫn hiển thị prompt bình thường.

Chấp nhận khi: chọn bằng chuột/bàn phím mở đúng chú giải; sửa một thành phần trong Studio không sửa masterprompt; mọi chú giải đều được kiểm tra khớp nguồn; sao chép vẫn giữ nguyên văn bản gốc.

### Visual Experiments

Khởi đầu hai bài: động vật và phong cảnh, mỗi bài ba phong cách. Mỗi ảnh có prompt thực tế, nguồn, công cụ đã biết và điểm thay đổi. Desktop so sánh cạnh nhau, mobile xếp dọc hoặc chọn A/B bằng nút; thanh kéo chỉ là lựa chọn bổ sung. Dùng nhãn “curated examples”, ghi rõ ảnh sinh lại có thể khác ở những chi tiết khác. Ảnh chỉ đổi khi chọn một ví dụ đã có; không giả vờ sinh ảnh trực tiếp khi đổi tham số.

Chấp nhận khi: ảnh và prompt của từng lựa chọn khớp nhau; chỉ ra đoạn thay đổi; đưa được lựa chọn vào Studio; tải ảnh chậm/thất bại vẫn đọc được prompt; hoạt động hoàn toàn bằng bàn phím và reduced motion.

### Remix History

Lưu bản ghi `{id, recipeId, name, values, createdAt, updatedAt}` tại khóa mới, giữ giới hạn hợp lý cho từng prompt. Copy, Download và Save dùng cùng một văn bản được lắp từ `values`. Bản lưu gần nhất cũ được chuyển sang lịch sử một lần sau khi ghi khóa mới thành công; không xóa khóa cũ như tác dụng phụ. Dữ liệu nhập phải kiểm tra kiểu, độ dài và ID prompt; quota/storage lỗi phải có thông báo và đường tải file.

Chấp nhận khi: lưu biến thể cho hai prompt rồi reload vẫn đủ cả hai; phục hồi đúng các trường; A/B đánh dấu khác biệt văn bản và không ám chỉ có ảnh kết quả mới; chỉnh sửa không thay đổi bản gốc; dữ liệu cũ được giữ khi chuyển đổi thất bại.

## Luồng demo đề xuất

Khám phá ảnh → đọc Prompt DNA → xem cùng ý tưởng qua ba phong cách → đưa một công thức vào Studio → thay chủ thể → so sánh hai bản → lưu hoặc tải prompt.

Đây là câu chuyện demo thể hiện cả khám phá, học và sáng tạo, thay vì chỉ trình diễn số lượng tính năng.

## Thứ tự triển khai

1. Bổ sung metadata chú giải, template biến thể và lịch sử; giữ nguyên catalog và prompt gốc hiện có.
2. Làm Prompt DNA và Remix History, kiểm tra bất biến nội dung, phục hồi và lỗi lưu trữ.
3. Tạo/chọn ảnh thực cho hai Visual Experiments, ghi manifest prompt, sau đó thêm giao diện so sánh.
4. Kiểm tra toàn bộ luồng demo trên desktop, 375px và màn hình ngang; bàn phím, clipboard thất bại, storage bị chặn và reduced motion. Chạy lại các bài kiểm tra WildFrame hiện có.

## React Bits

Giữ SpotlightCard và FadeContent đã tích hợp. Có thể chuyển tương tác Stepper cho Creative Trails sang DOM thuần sau khi chốt bước P1; phải giữ nhãn bước, Back, Next và kiểm tra bàn phím. Slider so sánh ảnh dùng input range và hai ảnh có kích thước ổn định. Không cần thay grid chính hoặc thêm hệ hiệu ứng toàn trang để triển khai P0.

## Đo giá trị

Thử nghiệm trực tiếp với 3–5 người mới tạo ảnh: hoàn thành tìm một công thức và sao chép; giải thích được vai trò một thành phần; lưu hai biến thể rồi tìm lại. Ghi thời gian, lỗi và nơi họ cần trợ giúp. Đây là kế hoạch đánh giá, chưa có kết quả hay số liệu chuyển đổi. Chỉ cân nhắc tài khoản/cộng đồng và sinh ảnh trực tiếp sau khi luồng cốt lõi được kiểm chứng.
