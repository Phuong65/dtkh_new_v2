# Plan chức năng: Form đề luyện tập / chuyên cần

## Phạm vi
- Folder nguồn: [form-de-luyentap](src/app/modules/admin/features/duyetnoidung/form-de-luyentap/)
- Dùng component chung [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/) để duyệt/comment.
- Vai trò: hiển thị cấu trúc lấy câu hỏi cho form luyện tập/chuyên cần theo CDR hoặc part.

## Chức năng hiện có
- Nhận `selectedCourse`, `listThamDInh`, `formType` qua `@Input`.
- Với `course.av` 0/2: tải CDR theo bài, số câu hỏi có sẵn, số câu lấy từ `CourseFormCc`, ngân hàng đề `CC` để xác định có thể sửa hay không.
- Với `course.av` 1: xử lý câu hỏi tiếng Anh theo part/group question.
- Tính tổng số câu lấy, tổng câu khả dụng và cờ vượt số lượng (`require_cdr`/`require_part`).

## Kế hoạch hoàn thiện
- Xác nhận tên nghiệp vụ của form type `CC`: luyện tập hay chuyên cần để thống nhất label UI/plan.
- Chuẩn hóa xử lý `private` nếu form này không lấy câu hỏi private.
- Đảm bảo `canEdit` phản ánh đúng khi đã sinh ngân hàng đề theo tuần.
- Đồng bộ trạng thái duyệt qua `DuyetFormDeComponent`.

## Tiêu chí hoàn thành
- Cấu trúc form hiển thị đúng theo CDR/part và course.av.
- Các dòng vượt số lượng câu khả dụng được đánh dấu rõ.
- Trạng thái duyệt/comment hoạt động qua component dùng chung.

## Rủi ro / câu hỏi mở
- Cần xác nhận `bank_type = CC` tương ứng chính xác với form này.
- Cần xác nhận `course.av = 2` dùng chung logic với `av = 0` là đúng lâu dài.
