---
title: 'Đổi border bảng Form đề sang màu xám'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Border bảng trong các tab con Form đề hiện dùng màu slate đậm, trông gần đen; border cần là xám nhưng vẫn phân biệt rõ với nền header.

**Approach:** Dùng màu xám trung tính `#858585` cho border ô của tất cả bảng trong các tab con Form đề; giữ nguyên nền header, viền nhóm bài đặc biệt và các trạng thái màu hiện có.

</frozen-after-approval>

## Implementation Notes

- Dùng selector tổng hợp hiện có trong `monhoc-formde.component.css`, áp dụng cho `CC`, `DG`, `TNTX`, `TN_KTHP` và bảng trong component con; giữ loại trừ `.cc-lesson-row`.
- `#858585` đạt tương phản tối thiểu 3.02:1 trên header xanh nhạt `#dbeafe`; vẫn là xám trung tính, nhẹ hơn màu slate `#74859a`.
- Chỉ đổi màu border từ selector hiện có; không sửa các màu header hoặc hành vi bảng.
- Đã đổi `border-color` tại selector chung từ `#74859a` sang `#858585`; các selector viền nhóm/hàng trạng thái riêng không đổi.
- Tiêu chí: tất cả ô header/cell trong bảng ở các tab con Form đề dùng xám `#858585`, tối thiểu 3:1 tương phản với nền header xanh nhạt; hàng nhóm `.cc-lesson-row` và style trạng thái riêng vẫn giữ nguyên.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi. Đã rà soát selector chung và phạm vi loại trừ `.cc-lesson-row`.

## Review Triage Log

- `defer` — Review phát hiện ghi chú build/diff-check bị lặp trong spec màu nút Bộ CTĐT; đó là thay đổi có sẵn ngoài task này, không sửa để bảo toàn worktree.
- `defer` — Review đề xuất kiểm tra trực quan hành vi một hàng ở mobile cho nút Bộ CTĐT; không thuộc thay đổi border Form đề và được giữ nguyên ngoài phạm vi.
