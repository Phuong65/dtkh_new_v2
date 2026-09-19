# Kế hoạch: thongke-hoidong-nghiemthu

## Mục tiêu

Xây dựng dashboard thống kê hội đồng nghiệm thu cho route `admin/hoi-dong/dashboard` trong project Angular `dtkh_v2.1`.

Màn hình cần tổng hợp số liệu hội đồng theo năm, mặc định là năm hiện tại, phân biệt theo loại hội đồng:

- `celo`: CPI/Bài giảng
- `cauhoi`: Câu hỏi/Đề

Dashboard cũng cần hiển thị bảng chi tiết môn học thuộc từng hội đồng.

## Phạm vi chức năng đã chốt

Dashboard cần hiển thị các nhóm số liệu sau:

1. Tổng số hội đồng.
2. Tổng số môn học.
3. Tổng số ngân hàng câu hỏi.
4. Tổng số đề, gồm TH + Dự án.
5. Số môn nghiệm thu CPI/Bài giảng trên tổng số môn.
6. Số môn nghiệm thu câu hỏi trên tổng số môn.
7. Danh sách môn học được nhóm theo từng hội đồng.
8. Thông tin meta của hội đồng, gồm số thành viên hội đồng và chủ tịch hội đồng.
9. Trong bảng môn học, cột thành viên duyệt chỉ hiển thị số lượng thành viên được phân công duyệt môn học.

## Quy tắc nghiệp vụ

- Nghiệm thu được tính theo `status === 2`.
- Dashboard lọc theo năm; năm mặc định là năm hiện tại.
- Câu hỏi lấy từ `course-questions`.
- Cách đếm câu hỏi phụ thuộc vào `course.av`:
  - Khi `course.av === 1`, câu hỏi lọc theo `group_id !== 0`.
  - Các trường hợp còn lại lọc theo `group_id === 0`.
- Đề lấy từ `CoursePlanActivityTuluanService`.
- Không dùng một nguồn `CoursePlanActivityTuluan` duy nhất để tính đề; cần tách theo các nguồn giống `duyetnoidung-manager`:
  - `tuluan_kthp`
  - `tuluan_tx`
  - `duan`
- KPI `CPI + Bài giảng đã duyệt` chỉ tính cho hội đồng loại `celo`.
- Cần tách rõ hai lớp thông tin:
  - Thành viên hội đồng tổng thể: hiển thị ở meta hội đồng.
  - Thành viên được phân công duyệt môn: hiển thị trong bảng môn học.

## Nguồn dữ liệu và service liên quan

Nhóm service hội đồng:

- `HoidongThamdinhService`
- `HoidongThamdinhMonhocService`
- `HoidongThamdinhThanhvienService`
- `HoidongThamdinhMonhocThanhvienService`

Nhóm service duyệt nội dung:

- `CoursePlanActivitiesService`
- `CourseQuestionsService`
- `CoursePlanActivityTuluanService`

Các service/query cần bám sát logic hiện có trong khu vực `duyetnoidung`, đặc biệt là `duyetnoidung-manager`, để tránh sai lệch số liệu.

## File chính của chức năng

- `src/app/modules/admin/features/thongke-hoidong-nghiemthu/thongke-hoidong-nghiemthu.component.ts`
- `src/app/modules/admin/features/thongke-hoidong-nghiemthu/thongke-hoidong-nghiemthu.component.html`
- `src/app/modules/admin/features/thongke-hoidong-nghiemthu/thongke-hoidong-nghiemthu.component.css`
- `src/app/modules/admin/features/thongke-hoidong-nghiemthu/thongke-hoidong-nghiemthu.types.ts`
- `src/app/modules/admin/routings/hoi-dong/hoi-dong-routing.module.ts`

## Trạng thái đã làm theo session notes

- Route `admin/hoi-dong/dashboard` đã được đổi sang component dashboard mới `ThongkeHoidongNghiemthuComponent`.
- Đã scaffold các file `.ts`, `.html`, `.css`, `.types.ts` cho chức năng.
- UI dashboard cơ bản đã có card, progress, table.
- Scroll dọc/ngang đã được đưa về phạm vi local của component, không phụ thuộc CSS shell toàn cục.
- Đã đồng bộ luồng `idsPlanCdrByCourse`: tạo map, trả từ pipeline, truyền vào `buildDashboard(...)`, và dùng trong phần lọc câu hỏi.
- Logic câu hỏi theo `course.av` đã được đưa vào dashboard.
- Card “Số lượng đề (TH + Dự án)” đã có dạng `approved / total`.
- `summary.approvedProposals` đã được cộng dồn.
- KPI `CPI + Bài giảng đã duyệt` đã được giới hạn trong nhánh hội đồng `celo`.
- Cột “Thành viên duyệt” đang được chuyển sang chỉ hiển thị số lượng thành viên được phân công cho môn học.

## Cập nhật 2026-05-11

- Dashboard đã đổi năm mặc định sang lấy từ `OvicDateTimeService.getCurrentDateTime()`, tức thời gian server, thay vì dùng `new Date()` từ máy client.
- Khi không lấy được thời gian server, dashboard hiển thị lỗi “Không lấy được thời gian server” và không âm thầm fallback sang giờ client.
- Logic lọc hội đồng theo năm vẫn dùng khoảng `YYYY-01-01` đến `YYYY-12-31` dựa trên năm được chọn hoặc năm server mặc định.
- Logic hiển thị trạng thái hội đồng đã cập nhật theo rule mới:
  - `status === 2` hiển thị “Đã hoàn thành”.
  - thời gian server hiện tại nhỏ hơn `date_start` hiển thị “Chưa bắt đầu”.
  - thời gian server hiện tại lớn hơn hết ngày `date_end` hiển thị “Đã kết thúc”.
  - nếu thời gian server hiện tại nằm trong khoảng bắt đầu/kết thúc và `status === 0`, hiển thị “Chưa mở”.
  - nếu thời gian server hiện tại nằm trong khoảng bắt đầu/kết thúc và status khác `0`/`2`, hiển thị “Đang thực hiện”.
- `councilStatusLabel` của cả row môn học và group hội đồng đã dùng chung hàm trạng thái mới.
- UI/UX dashboard và các thông tin hiển thị hiện đã đúng theo yêu cầu hiện tại.
- Các số thống kê tổng hợp đã được cập nhật theo hướng lazy load: card hiển thị trạng thái “Đang tải”, sau đó cập nhật dần theo từng lớp dữ liệu hội đồng, môn học và dữ liệu chi tiết; luồng này dùng loading nội bộ thay vì overlay toàn trang để người dùng thấy số liệu thay đổi dần.
- Các thay đổi hôm nay mới được rà tĩnh; chưa chạy build/test/compile/browser verification theo preference review tĩnh.


## Những hướng đã thử nhưng không phù hợp

- Không nên dùng một nguồn `CoursePlanActivityTuluan` duy nhất để tính “đề”, vì `duyetnoidung-manager` tách dữ liệu thành `tuluan_kthp`, `tuluan_tx`, `duan`.
- Không nên đếm câu hỏi bằng `group_id = 0` cứng từ query, vì logic đúng phụ thuộc `course.av`.
- Cần bảo đảm các object trả về từ pipeline có cùng shape ở mọi nhánh, kể cả khi không có `courseIds`, để tránh lỗi TypeScript/runtime khi gọi `buildDashboard(...)`.
- Khi file thay đổi nhiều, không nên patch bằng block lớn; nên đọc đúng block hiện tại rồi sửa từng đoạn nhỏ.
- Cần cẩn thận khi sửa block `councilGroups`, vì từng có lỗi cú pháp do thiếu `};` và `});`.

## Việc còn lại

1. Rà lại `thongke-hoidong-nghiemthu.component.ts` để bảo đảm logic dữ liệu khớp các rule nghiệp vụ đã chốt.
2. Rà lại `thongke-hoidong-nghiemthu.types.ts` để bảo đảm type contract đủ cho summary fields.
3. Chạy verify compile nhẹ, ưu tiên `npx tsc --noEmit` hoặc lệnh tương đương phù hợp project.
4. Chạy route `admin/hoi-dong/dashboard` trong browser để kiểm tra dữ liệu thực tế.
5. So khớp số liệu dashboard với logic/dữ liệu thật trong `duyetnoidung-manager`.
6. Kiểm chứng hội đồng `celo` có còn bị thiếu sau filter năm và tách logic theo loại hội đồng không.
7. Kiểm chứng card “Số lượng đề (TH + Dự án)” sau khi cộng `approvedProposals` và tách nguồn `tuluan_kthp + tuluan_tx + duan`.

## Câu hỏi mở / điểm cần xác nhận

- Card “Số lượng đề (TH + Dự án)” đã khớp dữ liệu thật chưa?
- Hội đồng `celo` còn bị thiếu sau khi đổi filter theo năm và loại hội đồng không?
- Template đã ẩn/hiện cột theo `group.councilType` đúng hoàn toàn chưa?
- Có cần hiển thị sâu hơn trạng thái nghiệm thu theo từng thành viên hội đồng, hay chỉ cần số lượng thành viên/chủ tịch như hiện tại?
- Route `admin/hoi-dong/dashboard` đã xuất hiện đúng trong menu/sidebar chưa, nếu menu phụ thuộc backend/config?

## Ghi chú workflow

- Lệnh dev server low-RAM của project: `npm run start:lowram`.
- Khi user dùng `/npm-start`, ưu tiên chạy `npm run start:lowram`.
- Sau khi implement, không tự chạy review code nếu user không yêu cầu rõ.
- Trước khi tiếp tục implement, cần re-scan code hiện tại vì session notes và memory là snapshot, có thể đã stale.

## Nguồn tổng hợp

- `D:\project\claude\projects\d--project-dtkh-v2-1\memory\council_dashboard_feature_scope.md`
- `D:\project\claude\session-data\2026-05-08-dtkh-v2-dashboard-session.tmp`
- `D:\project\claude\session-data\2026-05-09-thongke-hoidong-nghiemthu-session.tmp`
