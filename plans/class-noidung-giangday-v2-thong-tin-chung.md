# Kế hoạch thêm nhóm “Thông tin chung” vào nội dung giảng dạy V2

## Mục tiêu

Thêm một parent ảo `Thông tin chung` ở đầu `list_course_plan`. Parent chứa ba child ảo:

1. `Mô tả môn học`.
2. `Yêu cầu đối với sinh viên`.
3. `Tài liệu`.

Dữ liệu chỉ phục vụ hiển thị; không tạo bản ghi mới, không gọi thêm API, không thay đổi dữ liệu kế hoạch giảng dạy trên backend.

## Phạm vi

Component:

- `src/app/modules/admin/features/lop-hoc-phan/class-details/class-noidung-giangday-v2/class-noidung-giangday-v2.component.ts`
- `src/app/modules/admin/features/lop-hoc-phan/class-details/class-noidung-giangday-v2/class-noidung-giangday-v2.component.html`
- `src/app/modules/admin/features/lop-hoc-phan/class-details/class-noidung-giangday-v2/class-noidung-giangday-v2.component.css`
- `src/app/modules/admin/features/lop-hoc-phan/class-details/class-noidung-giangday-v2/class-noidung-giangday-v2.component.spec.ts` nếu bổ sung kiểm thử.

Không thay đổi service, model backend, API hoặc component quản lý môn học.

## Nguồn dữ liệu

Component cha hiện chỉ truyền `[classSelected]`; `courseSelected` chưa được truyền vào component này. Vì vậy dữ liệu dùng từ `classSelected.course_detail`:

- Mô tả môn học: `classSelected.course_detail.desc`.
- Yêu cầu đối với sinh viên: `classSelected.course_detail.yeucau_sinhvien`.
- Tài liệu chính: `classSelected.course_detail.tailieu_chinh`.
- Tài liệu tham khảo: `classSelected.course_detail.tailieu_thamkhao`.

Hai danh sách tài liệu tuân theo cấu trúc `DocumentFileAndLink[]`:

- `type === 'file'`: file nằm trong `item.file`.
- `type === 'link'`: URL nằm trong `item.link`.

## Thiết kế dữ liệu ảo

### Parent ảo

Tạo một helper riêng, ví dụ `createGeneralInformationPlan()`, trả về parent có:

- ID âm hoặc hằng số riêng để không trùng ID backend.
- `title: 'Thông tin chung'`.
- `week: 0` để template hiển thị `title`, không hiển thị `Bài 0`.
- Một type frontend riêng, ví dụ `GENERAL_INFORMATION`.
- `children` gồm đúng ba child ảo theo thứ tự yêu cầu.

### Ba child ảo

Mỗi child có ID/type riêng, ổn định:

1. `COURSE_DESCRIPTION`
   - `title: 'Mô tả môn học'`.
   - Nội dung lấy từ `course_detail.desc`.
   - Icon văn bản.

2. `STUDENT_REQUIREMENTS`
   - `title: 'Yêu cầu đối với sinh viên'`.
   - Nội dung lấy từ `course_detail.yeucau_sinhvien`.
   - Icon danh sách/yêu cầu.

3. `COURSE_DOCUMENTS`
   - `title: 'Tài liệu'`.
   - Gộp `tailieu_chinh` và `tailieu_thamkhao` thành một danh sách hiển thị.
   - Tài liệu chính đứng trước tài liệu tham khảo; từng nguồn giữ thứ tự theo `ordering`.
   - Icon tài liệu.

Các node ảo không dùng trạng thái duyệt, lịch kích hoạt, `class_plan` hoặc dữ liệu test.

## Tích hợp vào `list_course_plan`

1. Tạo parent ảo từ `classSelected.course_detail`.
2. Sau khi dựng xong `parent_plan` từ API, gán:
   - parent `Thông tin chung` ở vị trí đầu.
   - các parent kế hoạch thật giữ nguyên thứ tự phía sau.
3. Không chèn parent ảo vào dữ liệu `_course_plan.data`; chỉ ghép ở state hiển thị `list_course_plan`.
4. Không ghi parent/child ảo về backend trong bất kỳ thao tác nào.
5. Sau khi tải dữ liệu thành công, tự động chọn child `Mô tả môn học` để nội dung mặc định xuất hiện ngay khi mở màn hình.

## Hiển thị nội dung

### Mô tả môn học

- Bổ sung `ngSwitchCase` tương ứng.
- Hiển thị HTML bằng pipe an toàn đang dùng trong dự án.
- Nếu không có dữ liệu, hiển thị trạng thái rỗng rõ ràng: `Chưa có mô tả môn học`.

### Yêu cầu đối với sinh viên

- Bổ sung `ngSwitchCase` tương ứng.
- Hiển thị HTML bằng pipe an toàn.
- Nếu không có dữ liệu, hiển thị: `Chưa có yêu cầu đối với sinh viên`.

### Tài liệu

- Bổ sung `ngSwitchCase` tương ứng.
- Gộp `tailieu_chinh` và `tailieu_thamkhao` thành một danh sách.
- Tài liệu chính đứng trước tài liệu tham khảo; từng nguồn sắp xếp theo `ordering`.
- Mỗi tài liệu hiển thị badge `Tài liệu chính` hoặc `Tài liệu tham khảo` để nhận biết nguồn.
- Với tài liệu file: hiển thị icon, tên, dung lượng nếu có; click mở bằng luồng xem tài liệu hiện tại.
- Với tài liệu link: hiển thị tên và mở `item.link` trong tab mới với `rel="noopener noreferrer"`.
- Nếu danh sách rỗng, hiển thị: `Chưa có tài liệu`.

## Điều chỉnh template menu trái

- Parent `Thông tin chung` dùng chung layout với parent hiện có.
- Ba child dùng chung trạng thái chọn `selectedPlanActivity`.
- Không hiển thị nhãn trạng thái duyệt cho ba child do `week: 0`.
- Không hiển thị thao tác kích hoạt bài test hoặc action chuyên biệt khác.

## CSS

- Tái sử dụng `p-panel`, `.content-right`, `.files-list-view`, `.single-file`, `.not-ready` hiện có.
- Chỉ thêm class tối thiểu cho:
  - item tài liệu dạng link;
  - trạng thái rỗng từng nội dung.
- Không mở rộng hoặc sao chép thêm khối CSS cũ đang trùng lặp.

## Thứ tự triển khai

1. Khai báo type/hằng số cho parent và ba child ảo.
2. Tạo helper dựng parent `Thông tin chung` từ `classSelected.course_detail`.
3. Chèn parent vào đầu `list_course_plan` sau khi dựng danh sách kế hoạch thật.
4. Thêm ba `ngSwitchCase` ở vùng nội dung bên phải.
5. Thêm template hiển thị danh sách tài liệu đã gộp, hỗ trợ cả file và link.
6. Tự động chọn child `Mô tả môn học` sau khi tải thành công.
7. Bổ sung CSS tối thiểu.
8. Bổ sung/cập nhật test cho cấu trúc parent ảo, thứ tự `list_course_plan` và nội dung được chọn mặc định nếu triển khai kiểm thử.

## Kiểm tra tĩnh cần thực hiện

- `Thông tin chung` luôn đứng đầu `list_course_plan`.
- Parent có đúng ba child, đúng thứ tự và không trùng ID với dữ liệu API.
- `Mô tả môn học` được chọn mặc định sau khi tải thành công.
- Click từng child cập nhật `selectedPlanActivity` đúng.
- Nội dung lấy từ `classSelected.course_detail`, không phụ thuộc `courseSelected` đang chưa được truyền.
- Mô tả và yêu cầu hiển thị đúng HTML; có empty state khi rỗng.
- Tài liệu chính/tham khảo được gộp đúng thứ tự; file và link hiển thị đúng.
- File vẫn mở bằng viewer hiện tại.
- Link mở an toàn trong tab mới.
- Các parent bài học và luồng kích hoạt test không đổi.
- Không có request tạo/cập nhật/xóa phát sinh từ node ảo.

## Trạng thái triển khai 2026-08-13

Đã hoàn thành:

- Tạo parent ảo `Thông tin chung`, chèn đầu `list_course_plan`.
- Tạo ba child ảo với ID âm: `Mô tả môn học`, `Yêu cầu đối với sinh viên`, `Tài liệu`.
- Tự động chọn `Mô tả môn học` sau khi dữ liệu tải thành công.
- Hiển thị mô tả/yêu cầu từ `classSelected.course_detail`; có trạng thái rỗng.
- Gộp tài liệu chính và tài liệu tham khảo; tài liệu chính đứng trước, từng nhóm sắp xếp theo `ordering`; mỗi item có badge phân loại rõ ràng.
- File dùng viewer hiện tại; link mở tab mới với `noopener noreferrer`.
- Bổ sung CSS tối thiểu cho nội dung chung và tài liệu dạng link.

Rà soát:

- `git diff --check`: đạt.
- Đã sửa lỗi Angular template `TS2322` tại vòng lặp `parent.children`: dùng `CoursePlanDisplay extends CoursePlanActivities` để mọi `children` có cùng kiểu mảng; type ảo đặt tại `display_type`, giữ `type` hợp lệ theo model gốc.
- Không chạy build/test theo quy ước review tĩnh.

Còn lại:

- Kiểm tra UI thực tế hoặc build/test khi có yêu cầu riêng.

## Quyết định đã xác nhận

1. Child `Tài liệu` gộp tài liệu chính và tài liệu tham khảo thành một danh sách.
2. Tự động chọn child `Mô tả môn học` khi mở màn hình sau khi tải dữ liệu thành công.

## Câu hỏi mở

Không còn.
