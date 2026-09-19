# Plan chức năng: Form đề đánh giá

## Phạm vi
- Folder nguồn: [form-de-dg](src/app/modules/admin/features/duyetnoidung/form-de-dg/)
- Dùng component chung [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/) để duyệt/comment.
- Vai trò: hiển thị và duyệt cấu trúc đề đánh giá theo CDR/part, bao gồm câu hỏi thường và private.

## Chức năng hiện có
- Nhận `selectedCourse`, `listThamDInh`, `formType` qua `@Input`.
- Với `course.av` 0/2: tải `ACTIVITY_CDR`, form DG, ngân hàng đề `DG`, câu hỏi thường/private, tính số câu lấy theo CDR.
- Với `course.av` 1: xử lý theo part câu hỏi tiếng Anh, có số câu thường/private theo part.
- Tính `total_question`, `question_take_total`, `question_take_total_private`, cờ vượt số lượng.

## Kế hoạch hoàn thiện
- Kiểm tra thống nhất service đang dùng: `getCourseFormDgByPage` và `getCoursePlansByPageNew` có khác contract không.
- Chuẩn hóa quy tắc private question trong form đánh giá.
- Đảm bảo `canEdit` dựa trên `CoursePlanBank` và quyền manager đúng nghiệp vụ.
- Đồng bộ trạng thái duyệt form thông qua `DuyetFormDeComponent`.

## Tiêu chí hoàn thành
- Hiển thị đủ cấu trúc đề DG theo bài/CDR hoặc part.
- Cảnh báo khi số câu lấy vượt số câu khả dụng, tách rõ thường/private.
- Duyệt/yêu cầu sửa và comment hoạt động qua component chung.

## Rủi ro / câu hỏi mở
- Cần xác nhận form DG có luôn dùng `bank_type = DG` để khóa chỉnh sửa khi đã sinh đề không.
- Cần xác nhận private question có bắt buộc trong mọi course hay chỉ một số loại.
