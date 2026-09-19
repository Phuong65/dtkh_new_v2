# Plan chức năng: Form đề thực hành KTHP

## Phạm vi
- Folder nguồn: [form-de-th-kthp](src/app/modules/admin/features/duyetnoidung/form-de-th-kthp/)
- Dùng component chung [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/) để duyệt/comment.
- Vai trò: hiển thị cấu trúc đề thực hành KTHP gồm CLO, số câu/số điểm.

## Chức năng hiện có
- Nhận `selectedCourse`, `listThamDInh`, `formType` qua `@Input`.
- Tải `CourseFormThKthp` theo course và danh sách CLO.
- Tính `totalScore` = tổng `point * question_take` và `totalTake` = tổng số câu lấy.
- Phát sự kiện thay đổi trạng thái form qua `onChangeStatus`.

## Kế hoạch hoàn thiện
- Xác nhận form TH KTHP chỉ hiển thị/duyệt hay có cần thêm/sửa cấu trúc trong màn hình này; hiện có nhiều biến form add/update nhưng chưa dùng trong phần đã đọc.
- Hiển thị CLO rõ ràng với ký hiệu và nội dung; xử lý CLO chưa có nội dung.
- Đồng bộ trạng thái duyệt/comment qua `DuyetFormDeComponent`.
- Nếu không cho sửa ở màn duyệt, loại bỏ UI/logic thêm form không dùng khi refactor sau.

## Tiêu chí hoàn thành
- Danh sách cấu trúc TH KTHP tải đúng và tính tổng điểm/tổng câu chính xác.
- Duyệt/yêu cầu sửa form hoạt động qua component chung.
- Người dùng thấy rõ mỗi dòng cấu trúc gắn với CLO nào.

## Rủi ro / câu hỏi mở
- Cần xác nhận tổng điểm kỳ vọng có phải 10/100 hay không để thêm cảnh báo nếu lệch.
- Cần xác nhận quyền chỉnh sửa cấu trúc form trong màn duyệt có được phép không.
