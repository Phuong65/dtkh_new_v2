---
title: 'Đồng bộ header trắc nghiệm với bài tự luận'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Header trắc nghiệm hiện tại chưa theo đúng kiểu header bài tự luận.

**Approach:** Đồng bộ kiểu nền gradient xanh nhạt, vạch nhấn trái và kiểu tiêu đề theo header bài tự luận; giữ thông tin và nút sinh đề bên dưới header.

</frozen-after-approval>

## Implementation Notes

- Khớp header trắc nghiệm với header tự luận: cùng gradient xanh nhạt, vạch nhấn trái, cỡ chữ/màu tiêu đề; phần trạng thái và hành động giữ bên dưới.
- Giữ tiêu đề bài trắc nghiệm là heading và căn giữa các thông tin trạng thái, nút sinh/xóa đề theo chiều ngang.
- Chỉ chỉnh template/CSS trắc nghiệm; giữ nguyên nội dung các thay đổi chưa commit khác trong worktree.
- Các vấn đề review không liên quan đã được ghi riêng vào danh sách việc cần làm sau.

## Review Triage Log

- `medium` — Tiêu đề trắc nghiệm bị đổi từ heading thành span; đã đổi lại thành `h2`.
- `defer` — Nút phân bổ câu hỏi chỉ có tooltip, thiếu accessible name ổn định; vấn đề có sẵn ở phần CĐR, ngoài phạm vi chỉnh header.
- `defer` — Thanh cuộn ma trận khai báo `role="scrollbar"` nhưng thiếu giá trị ARIA bắt buộc; vấn đề có sẵn ở phần CĐR, ngoài phạm vi chỉnh header.
- `defer` — Khi thu gọn sidebar CĐR, focus không được chuyển tới nút mở lại; vấn đề có sẵn ở phần CĐR, ngoài phạm vi chỉnh header.
- `defer` — Trạng thái CĐR bắt buộc chỉ phân biệt bằng màu; vấn đề có sẵn ở phần CĐR, ngoài phạm vi chỉnh header.
- `low` (bỏ qua) — Ghi chú kiểm thử trong spec sidebar CĐR chưa đồng bộ với trạng thái `done`; đây là tài liệu của công việc khác và không ảnh hưởng thay đổi header.
