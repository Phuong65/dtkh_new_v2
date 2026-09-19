# Plan chức năng: Form đề trắc nghiệm thường xuyên

## Phạm vi
- Folder nguồn: [form-de-tn-tx](src/app/modules/admin/features/duyetnoidung/form-de-tn-tx/)
- Dùng component chung [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/) để duyệt/comment.
- Vai trò: hiển thị cấu trúc đề trắc nghiệm thường xuyên theo bài/CDR hoặc part.

## Chức năng hiện có
- Nhận course, hội đồng và form type qua `@Input`.
- Tải dữ liệu từ `CourseFormTxService`, `CoursePlanActivitiesService`, `CoursePlanBankService`, `CourseQuestionsService`.
- Có logic riêng cho `course.av` để tính số câu khả dụng và số câu được lấy theo CDR/part.
- Dùng `PanelModule` và `DuyetFormDeComponent` cho hiển thị và duyệt/comment.

## Kế hoạch hoàn thiện
- Rà soát import `SharedModule` đang lấy từ `primeng/api`; nếu chỉnh code cần xác nhận đây có phải lỗi import hay không.
- Chuẩn hóa cấu trúc tính toán với `form-de-luyentap` và `form-de-dg` để tránh lệch rule.
- Làm rõ `bank_type` dùng cho TNTX và điều kiện `canEdit` sau khi sinh đề.
- Đảm bảo trạng thái duyệt form được đồng bộ về manager.

## Tiêu chí hoàn thành
- Form TNTX hiển thị đúng số câu khả dụng/lấy theo từng bài/CDR hoặc part.
- Cảnh báo số lượng vượt khả dụng hiển thị đúng.
- Duyệt/yêu cầu sửa và comment dùng chung hoạt động ổn định.

## Rủi ro / câu hỏi mở
- Cần đọc sâu template khi triển khai để xác nhận các biến list dùng thực tế.
- Cần xác nhận form TNTX có phân biệt câu hỏi private như DG/TN KTHP không.
