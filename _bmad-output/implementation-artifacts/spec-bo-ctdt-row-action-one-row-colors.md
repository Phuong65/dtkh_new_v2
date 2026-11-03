---
title: 'Đưa nút thao tác Bộ CTĐT về một hàng'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nhóm nút thao tác Bộ CTĐT đang xếp thành hai hàng; người dùng muốn các thao tác hiển thị trên một hàng gọn.

**Approach:** Xếp các nút trên cùng một hàng và dùng màu riêng cho từng nút theo palette `core-new`. Nút Sửa dùng class `ictu-button-info-light` (xanh dương); giữ nguyên biểu tượng, hành vi và trạng thái quyền hiện tại.

</frozen-after-approval>

## Implementation Notes

- Cột thao tác rộng 200px; nhóm nút không wrap, mỗi nút rộng 32px với gap 6px nên cả năm nút chiếm 184px.
- Màu theo `core-new`: PLO primary, PEO purple, chọn môn teal, Sửa info (xanh dương), Xóa danger.
- Chỉ đổi style cột thao tác và class màu nút Sửa; không đổi logic, biểu tượng hoặc style dùng chung.
- Tiêu chí: khi có đủ quyền, năm nút luôn nằm cùng hàng trong cột 200px; 184px là tổng chiều rộng nút và khoảng cách. Trên mobile, bảng tiếp tục dùng cuộn ngang hiện có, không wrap hoặc clip các nút.
- Sau phản hồi người dùng, nút Sửa dùng class có sẵn `ictu-button-info-light` như ví dụ người dùng cung cấp; đã bỏ CSS xanh lá scoped không còn cần thiết.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi.

## Review Triage Log

- `low` — Sau khi người dùng chỉ rõ class mong muốn, nút Sửa chuyển sang `ictu-button-info-light`; đã bỏ override xanh lá riêng.
