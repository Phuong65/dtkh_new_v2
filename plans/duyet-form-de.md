# Plan chức năng: Duyệt form đề - comment và trạng thái chung

## Phạm vi
- Folder nguồn: [duyet-form-de](src/app/modules/admin/features/duyetnoidung/duyet-form-de/)
- Component dùng chung trong các form đề: luyện tập, đánh giá, trắc nghiệm thường xuyên, trắc nghiệm KTHP, thực hành KTHP.
- Vai trò: quản lý nhận xét và trạng thái duyệt của một form đề theo `form_type`.

## Chức năng hiện có
- Nhận `selectedCourse`, `listThamDInh`, `typeForm` qua `@Input`.
- Tải `CourseFormDuyet` và `CourseFormComment` theo course/form type.
- Nhóm comment theo user, ẩn/hiện danh tính theo vai trò hội đồng/manager.
- Cho phép nhận xét, reply, duyệt/yêu cầu sửa form, phát sự kiện `onChangeStatus` cho component cha.

## Kế hoạch hoàn thiện
- Chuẩn hóa danh sách `typeForm`: `TN_KTHP`, `TH_KTHP`, `DG`, `TNTX`, `CC` và label hiển thị tương ứng.
- Kiểm tra `onChangeStatus.emit` trả về object ổn định; hiện nhánh update có thể emit object `courseFormDuyet` thay vì id.
- Đảm bảo khi duyệt form mới tạo bản ghi `CourseFormDuyet`, khi đã có thì update đúng record.
- Rà soát hiển thị danh tính khi reply từ giảng viên/chủ biên và hội đồng.

## Tiêu chí hoàn thành
- Mỗi form đề hiển thị đúng lịch sử nhận xét và trạng thái duyệt hiện tại.
- Duyệt/yêu cầu sửa form cập nhật backend và thông báo cho component cha.
- Reply comment reload đúng số lượng phản hồi.

## Rủi ro / câu hỏi mở
- Cần xác nhận manager có bao gồm `admin`/`chuyenvien_pdt` trong luồng form đề hay chỉ `manager` và `hoidongthi_lanhdao` như code hiện tại.
- Cần xác nhận form được duyệt có còn cho phép thêm nhận xét hay không.
