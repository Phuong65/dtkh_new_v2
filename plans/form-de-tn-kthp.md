# Plan chức năng: Form đề trắc nghiệm KTHP

## Phạm vi
- Folder nguồn: [form-de-tn-kthp](src/app/modules/admin/features/duyetnoidung/form-de-tn-kthp/)
- Dùng component chung [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/) để duyệt/comment.
- Vai trò: hiển thị cấu trúc đề trắc nghiệm kết thúc học phần theo tuần/CDR/part.

## Chức năng hiện có
- Nhận `selectedCourse`, `listThamDInh`, `formType` qua `@Input`.
- Với `course.av` 0: gom số câu đã duyệt theo tuần và CDR, tính câu thường/private từ `CourseFormKthp`.
- Với `course.av` 2: tính theo activity CDR con.
- Với `course.av` 1: tính theo part câu hỏi tiếng Anh và CDR.
- Tính tổng số câu lấy thường/private và cờ vượt số câu khả dụng.

## Kế hoạch hoàn thiện
- Xác nhận ngưỡng `week < 1000` có đúng cho KTHP trắc nghiệm trong mọi môn không.
- Chuẩn hóa rule câu hỏi private và câu hỏi đã duyệt (`status = 1`) khi tính số câu khả dụng.
- Bổ sung xử lý lỗi/tắt loading cho nhánh `loadType0/loadType1` còn thiếu thông báo lỗi.
- Đồng bộ trạng thái duyệt qua `DuyetFormDeComponent`.

## Tiêu chí hoàn thành
- Cấu trúc đề TN KTHP hiển thị đúng theo loại môn `av`.
- Tổng số câu lấy thường/private đúng và cảnh báo vượt số lượng chính xác.
- Duyệt/yêu cầu sửa form hoạt động và cập nhật trạng thái cho manager.

## Rủi ro / câu hỏi mở
- Cần xác nhận `ThiFormService` còn cần dùng hay là import thừa.
- Cần xác nhận KTHP TN có phụ thuộc ngân hàng đề đã sinh để khóa chỉnh sửa như các form khác không.
