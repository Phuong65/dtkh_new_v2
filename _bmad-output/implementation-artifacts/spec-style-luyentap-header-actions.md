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

**Approach:** Làm header có biểu tượng, tiêu đề và mô tả theo ảnh mẫu. Chỉ hiển thị Sinh đề và Xóa khi đã có form đề và câu hỏi được duyệt; trong trường hợp đủ điều kiện, khóa Xóa nếu chưa có đề, đồng thời tôn trọng quyền và trạng thái bận.

</frozen-after-approval>

## Implementation Notes

- Đổi tiêu đề phần Luyện tập tại nhà thành tiêu đề cấp 2, làm rõ phân cấp bằng biểu tượng, nền nhấn nhẹ và mô tả.
- Theo làm rõ của người dùng, chỉ hiển thị Sinh đề và Xóa khi đủ form đề và câu hỏi đã duyệt; nếu chưa đủ chỉ hiện thông báo. Khi đủ điều kiện, khóa Xóa nếu đề chưa tồn tại; cả hai nút vẫn tôn trọng quyền thao tác và trạng thái bận.
- Xác minh bằng `npm run build` (thành công).
