# Plan chức năng: Duyệt CPI/CDR

## Phạm vi
- Folder nguồn: [duyet-celo](src/app/modules/admin/features/duyetnoidung/duyet-celo/)
- Route: `celo` tại [duyetnoidung-routing.module.ts](src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts#L14-L17).
- Vai trò: duyệt các mục CPI/CDR trong kế hoạch học tập theo từng bài.

## Chức năng hiện có
- Nhận query param `code`, tải `HoidongThamdinhMonhoc` kèm course và danh sách thành viên hội đồng.
- Kiểm tra quyền: admin/manager/chuyên viên PDT hoặc thành viên hội đồng; người không thuộc phạm vi bị điều hướng `/admin/content-none`.
- Tải `PLAN` và `ACTIVITY_CDR`, nhóm theo bài, gán nhãn trạng thái: chờ duyệt, đạt, chưa đạt, đã sửa.
- Cho phép nhận xét, phản hồi nhận xét, duyệt/yêu cầu sửa và mở lại trạng thái chỉnh sửa.

## Kế hoạch hoàn thiện
- Chuẩn hóa trạng thái CPI/CDR và hiển thị thống nhất với duyệt bài giảng.
- Đảm bảo mỗi hành động duyệt/yêu cầu sửa lưu đủ `approved_by`, `approved_at`.
- Kiểm tra rule ẩn danh/hiện tên người nhận xét theo vai trò hội đồng, quản lý, đào tạo.
- Thêm xử lý lỗi cho các API load danh sách/comment hiện đang để trống ở một số nhánh.

## Tiêu chí hoàn thành
- Thành viên hội đồng chỉ xem/nhận xét đúng môn được phân công.
- Chủ tịch/manager/đào tạo duyệt hoặc yêu cầu sửa được từng CDR.
- Sau thao tác trạng thái, danh sách reload và nhãn trạng thái cập nhật đúng.

## Rủi ro / câu hỏi mở
- Cần xác nhận trạng thái `-2` có luôn là “Đã sửa” trong toàn bộ module không.
- Cần xác nhận quyền “mở khóa/khóa lại” nội dung đã duyệt theo từng vai trò.
