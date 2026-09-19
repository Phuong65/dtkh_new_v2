# Context

`GopYAllComponent` hiện chỉ là component khởi tạo, chưa tải hoặc hiển thị dữ liệu. Cần biến màn hình này thành danh sách góp ý sinh viên: dữ liệu mới nhất trước, phân trang phía API 20 bản ghi/trang, luôn hiển thị nội dung, kèm danh sách file nếu góp ý có `attachments`.

## Phạm vi

### 1. Cập nhật model góp ý

**File:** `src/app/modules/shared/models/student-feedback.ts`

- Import và dùng lại `OvicFileInfo` từ `src/app/modules/shared/models/file-store.ts`.
- Đổi `attachments?: []` thành `attachments?: OvicFileInfo[]` để ánh xạ đúng mảng file upload mẫu.
- Bổ sung các trường phản hồi cần cho danh sách/API: `id`, `created_at`, `updated_at` (các trường thời gian cho phép null nếu API có thể trả null).
- Giữ nguyên các trường nghiệp vụ hiện có: `donvi_chuyenmon_id`, `student_feedback_category_id`, `content`, `school_year`, `semester`.

### 2. Hoàn thiện logic `GopYAllComponent`

**File:** `src/app/modules/admin/features/gop-y/gop-y-all/gop-y-all.component.ts`

- Bổ sung standalone imports cần thiết: `CommonModule`, `PaginatorModule` và module nút/icon PrimeNG đang dùng trong dự án.
- Inject `HttpClient`, `FileService`, `NotificationService`.
- Khai báo trạng thái rõ kiểu: danh sách `StudentFeedback[]`, `page = 1`, `rows = 20`, `totalRecords`, `loading`.
- Tải dữ liệu qua `GET getRoute('student-feedbacks/')` với query:
  - `paged`: trang hiện tại;
  - `limit`: `20`;
  - `orderby`: `created_at`;
  - `order`: `DESC`.
- Ánh xạ `Dto.data` vào danh sách; lấy `Dto.recordsFiltered` làm tổng bản ghi cho paginator. Không phân trang hoặc sắp xếp lại ở client.
- Gọi tải trang 1 trong `ngOnInit`; xử lý `onPageChange` bằng `event.page + 1`.
- Khi lỗi: dừng loading, xóa dữ liệu trang lỗi, đưa tổng về 0, báo lỗi qua `NotificationService`.
- Thêm hàm tải file đính kèm bằng `FileService.AwsDownloadWithProgress(file.id, file.title || file.name)`; chỉ cho tải khi file có `id`; báo lỗi nếu tải thất bại. Dùng `FileService.formatBytes` để hiển thị dung lượng.
- Dùng `trackBy` cho góp ý và file để hạn chế render lại.

### 3. Xây dựng giao diện danh sách

**File:** `src/app/modules/admin/features/gop-y/gop-y-all/gop-y-all.component.html`

- Thay nội dung placeholder bằng tiêu đề và danh sách dạng card/feed.
- Mỗi góp ý hiển thị:
  - thời điểm gửi từ `created_at`;
  - nguyên văn `content`, giữ xuống dòng bằng CSS, không render HTML;
  - khu vực “File đính kèm” chỉ xuất hiện khi `attachments?.length > 0`;
  - từng file hiển thị icon, `title` ưu tiên hơn `name`, phần mở rộng, dung lượng, nút tải.
- Có trạng thái đang tải, danh sách rỗng “Chưa có góp ý”, và paginator cuối danh sách.
- Paginator cố định `[rows]="20"`, nhận `[totalRecords]`, đồng bộ `[first]="(page - 1) * rows"` để đúng trang hiện tại.

### 4. Bổ sung style responsive

**File:** `src/app/modules/admin/features/gop-y/gop-y-all/gop-y-all.component.css`

- Tạo bố cục card dễ đọc, phân cấp rõ nội dung/thời gian/file.
- Cho tên file dài tự xuống dòng; hàng file và nút tải không làm tràn màn hình.
- Giữ màu sắc, khoảng cách gần với Bootstrap/PrimeNG hiện có; thêm breakpoint cho màn hình nhỏ.
- Dùng `white-space: pre-wrap` cho nội dung góp ý.

## Không thay đổi

- Không sửa route `lanhdao-khoa-gopy-all` theo lựa chọn hiện tại.
- Không tạo service mới; request API chỉ phục vụ component này, giữ đúng phạm vi model + component.
- Không hiển thị hoặc suy đoán danh tính sinh viên khi model/API chưa có trường tương ứng.

## Xác minh

1. Chạy build Angular: `npm run build`.
2. Kiểm tra request trang đầu có `paged=1`, `limit=20`, `orderby=created_at`, `order=DESC`.
3. Với hơn 20 góp ý: chuyển trang, xác nhận mỗi trang tối đa 20 bản ghi và paginator dùng `recordsFiltered`.
4. Xác nhận thứ tự mới nhất đến cũ theo `created_at` từ API.
5. Kiểm tra góp ý không file, một file, nhiều file, tên file dài, nội dung nhiều dòng.
6. Tải file mẫu `.xlsx`; xác nhận dùng đúng tên `Thong_ke_khao_sat_2026_2027_HK1.xlsx`, tải qua AWS, báo lỗi khi API tải thất bại.
7. Kiểm tra trạng thái loading, API lỗi, dữ liệu rỗng, desktop và màn hình nhỏ.
