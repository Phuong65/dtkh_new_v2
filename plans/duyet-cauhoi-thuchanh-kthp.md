# Plan chức năng: Duyệt câu hỏi thực hành KTHP

## Phạm vi
- Folder nguồn: [duyet-cauhoi-thuchanh-kthp](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp/)
- Component con của [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Vai trò: duyệt câu hỏi/đề thực hành KTHP không gắn activity kế hoạch thường xuyên.

## Chức năng hiện có
- Nhận `selectedCourse`, `planTuluan`, `listThamDInh` qua `@Input`.
- Tải `CoursePlanActivityTuluan` với `private = 1`, `course_plan_activity_id = 0` theo course.
- Tải comment/reply hội đồng theo từng đề thực hành.
- Cho phép nhận xét, reply, duyệt/yêu cầu sửa, đưa về chờ duyệt, duyệt tất cả, khóa/mở hàng loạt.

## Kế hoạch hoàn thiện
- Xác nhận điều kiện lấy dữ liệu `private = 1` và `course_plan_activity_id = 0` là rule nghiệp vụ chính thức cho thực hành KTHP.
- Loại bỏ/kiểm tra import không dùng như `request` từ `http` nếu chỉnh code.
- Chuẩn hóa xử lý lỗi API và tắt loading ở mọi nhánh.
- Đảm bảo “duyệt tất cả” không cập nhật các mục đã xóa hoặc không thuộc course hiện tại.

## Tiêu chí hoàn thành
- Màn hình hiển thị đúng danh sách đề thực hành KTHP của môn học.
- Người có quyền nhận xét/reply và duyệt/yêu cầu sửa từng đề.
- Duyệt tất cả và khóa/mở hàng loạt có progress, reload và thông báo đúng.

## Rủi ro / câu hỏi mở
- Cần xác nhận đề thực hành KTHP có cần kiểm tra tiêu chí chấm/đáp án trước khi duyệt không.
- Cần xác nhận `private = 1` có thể trùng ý nghĩa với câu hỏi riêng tư ở các luồng khác không.
