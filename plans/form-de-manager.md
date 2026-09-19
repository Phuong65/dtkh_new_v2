# Plan chức năng: Quản lý các tab cấu trúc đề

## Phạm vi
- Folder nguồn: [form-de-manager](src/app/modules/admin/features/duyetnoidung/form-de-manager/)
- Component con của [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Vai trò: điều phối các tab cấu trúc đề theo loại đánh giá của môn học.

## Chức năng hiện có
- Import các component form đề: luyện tập, đánh giá, TNTX, TN KTHP, TH KTHP.
- Tải trạng thái duyệt form qua `CourseFormDuyetService`.
- Dùng `TabViewModule` để gom các form liên quan vào một giao diện.
- Có logic phân quyền theo vai trò và course/form type.

## Kế hoạch hoàn thiện
- Chuẩn hóa điều kiện hiển thị từng tab theo `selectedCourse.params`, `exam_format`, `exam_type`, `av`.
- Đồng bộ trạng thái duyệt từ component con về tab manager khi `onChangeStatus` phát ra.
- Làm rõ form nào bắt buộc trước khi cho phép duyệt tổng câu hỏi.
- Rà soát import/logic động để tránh dùng API đã deprecated như `ComponentFactoryResolver` nếu không cần.

## Tiêu chí hoàn thành
- Người dùng thấy đúng các tab form đề cần duyệt cho môn hiện tại.
- Trạng thái mỗi tab cập nhật ngay sau khi duyệt/yêu cầu sửa.
- Không render component form không phù hợp với cấu hình môn học.

## Rủi ro / câu hỏi mở
- Cần xác nhận quy tắc nghiệp vụ chọn tab theo từng loại môn và hình thức thi.
- Cần xác nhận có cần trạng thái duyệt tổng cho toàn bộ cấu trúc đề hay từng form type là độc lập.
