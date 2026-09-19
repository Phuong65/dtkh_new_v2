# Plan chức năng: Duyệt bài giảng

## Phạm vi
- Folder nguồn: [duyet-baigiang](src/app/modules/admin/features/duyetnoidung/duyet-baigiang/)
- Route: `baigiang` tại [duyetnoidung-routing.module.ts](src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts#L18-L21).
- Vai trò: duyệt nội dung bài giảng theo kế hoạch bài học/mục tiêu/hoạt động.

## Chức năng hiện có
- Nhận query param `code`, kiểm tra hội đồng/môn học và phân quyền tương tự CPI/CDR.
- Tải `PLAN`, `MUCTIEU`, `ACTIVITY` theo course, nhóm theo bài và sắp xếp theo ordering.
- Hiển thị trạng thái duyệt từng nội dung, nhận xét theo hội đồng, phản hồi nhận xét.
- Có modal xem file review qua `NgbModal`.
- Cho phép duyệt, yêu cầu sửa, hủy/mở trạng thái chỉnh sửa.

## Kế hoạch hoàn thiện
- Hoàn thiện UX xem file review: trạng thái chưa chọn file, modal đóng/mở, file lỗi.
- Chuẩn hóa comment/reply và phân quyền hiển thị danh tính người nhận xét như luồng CPI/CDR.
- Kiểm tra tất cả nhánh API lỗi đều tắt loading và báo lỗi phù hợp.
- Làm rõ rule duyệt bài giảng sau khi đã có yêu cầu sửa hoặc sau khi giảng viên cập nhật lại.

## Tiêu chí hoàn thành
- Tải đúng danh sách bài và nội dung con không bao gồm mục đã xóa `status = -3`.
- Người có quyền duyệt/yêu cầu sửa được từng nội dung và thấy trạng thái mới sau reload.
- Người dùng xem được file đính kèm/review nếu dữ liệu có file.

## Rủi ro / câu hỏi mở
- Cần xác nhận các loại `MUCTIEU`, `ACTIVITY` nào bắt buộc duyệt, loại nào chỉ hiển thị tham khảo.
- Cần xác nhận nội dung thông báo “thao tác không thể hoàn tác” có đúng với chức năng hủy trạng thái hiện có không.
