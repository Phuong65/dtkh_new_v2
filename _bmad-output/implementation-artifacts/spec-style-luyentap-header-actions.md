---
title: 'Style header và trạng thái nút ở Luyện tập tại nhà'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'c5b6c36b26d7d2a3c188470f1e78955a5e23ada8'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Header của bảng Luyện tập tại nhà chưa rõ cấp bậc thông tin như ảnh tham khảo; các nút Sinh đề và Xóa đang ẩn/hiện theo điều kiện nên thao tác trong bảng thiếu nhất quán.

**Approach:** Làm header có biểu tượng, tiêu đề và mô tả theo ảnh mẫu. Luôn hiển thị Sinh đề và Xóa ở các ô thao tác, bật/tắt theo điều kiện form, câu hỏi, đề hiện có, quyền và trạng thái bận.

</frozen-after-approval>

## Implementation Notes

- Đổi tiêu đề phần Luyện tập tại nhà thành tiêu đề cấp 2, làm rõ phân cấp bằng biểu tượng, nền nhấn nhẹ và mô tả.
- Giữ nút Sinh đề và Xóa luôn hiển thị trong từng ô thao tác. Sinh đề bị vô hiệu hóa khi thiếu form/câu hỏi đã duyệt; Xóa bị vô hiệu hóa khi chưa có đề. Cả hai cũng tôn trọng quyền thao tác và trạng thái bận.
- Xác minh bằng `npm run build` (thành công).
