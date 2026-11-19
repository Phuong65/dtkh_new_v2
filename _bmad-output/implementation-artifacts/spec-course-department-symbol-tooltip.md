---
title: 'Hiển thị ký hiệu Khoa và Bộ môn trong bảng quản lý'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tên Khoa và Bộ môn dài đang chiếm nhiều chỗ trong bảng quản lý học phần và môn học.

**Approach:** Trong các cột Khoa/Bộ môn đang có, hiển thị ký hiệu `code`; nếu chưa có `code` thì dùng chữ viết tắt từ tên. Hover hiển thị tên đầy đủ bằng tooltip. Không thêm cột mới hoặc thay đổi dữ liệu, lọc và các hành vi khác.

</frozen-after-approval>

## Implementation Notes

- Đã đổi các cột Khoa/Bộ môn ở bảng quản lý học phần và cột Khoa ở bảng quản lý môn học sang ký hiệu; ưu tiên `code`, dự phòng bằng chữ viết tắt tên.
- Tooltip hiển thị tên đầy đủ; tên đầy đủ cũng được bổ sung vào accessible name của ô. Các bộ lọc, dữ liệu và cột hiện có được giữ nguyên.
- Đã chạy `npm run build` (Angular AOT); build thành công.

## Review Triage Log

- `medium` — Đã thêm accessible name cho ô Khoa/Bộ môn để tên đầy đủ không chỉ có khi hover.
- `low` (rejected) — Danh mục Khoa trạng thái không hoạt động không nằm trong lookup hiện có nên có thể không có tên tooltip; không có bằng chứng hiện tại về dòng bảng bị ảnh hưởng, còn lookup riêng để giữ danh mục ẩn khỏi bộ lọc vượt ngoài phạm vi nhỏ này.
