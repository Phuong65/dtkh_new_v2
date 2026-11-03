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

**Approach:** Xếp các nút trên cùng một hàng và dùng màu riêng cho từng nút theo palette `core-new`. Nút Sửa phải có màu xanh; giữ nguyên biểu tượng, hành vi và trạng thái quyền hiện tại.

</frozen-after-approval>

## Implementation Notes

- Cột thao tác rộng 200px; nhóm nút không wrap, mỗi nút rộng 32px với gap 6px nên cả năm nút chiếm 184px.
- Màu theo `core-new`: PLO primary, PEO purple, chọn môn teal, Sửa xanh lá theo biến `--c2-success-rgb`, Xóa danger. Nút Sửa dùng lớp CSS scoped của danh sách vì biến thể success-light dùng màu xanh ngọc, còn badge-success yêu cầu `.mdc-button` mà nút hiện tại không có.
- Chỉ đổi style cột thao tác và class màu nút Sửa; không đổi logic, biểu tượng hoặc style dùng chung.
- Tiêu chí: khi có đủ quyền, năm nút luôn nằm cùng hàng trong cột 200px; 184px là tổng chiều rộng nút và khoảng cách. Trên mobile, bảng tiếp tục dùng cuộn ngang hiện có, không wrap hoặc clip các nút.
- Review xác nhận màu success-light trong palette ICTU gần teal; đổi sang palette `c2-success` xanh lá để phân biệt rõ với nút chọn môn.
- Xác minh markup nút không có `.mdc-button`; áp style xanh lá trực tiếp bằng selector component-scoped để màu hiển thị đúng mà không tác động các nút success khác.
- `npm run build` chạy thành công sau khi áp dụng style xanh lá cho nút Sửa; `git diff --check` không phát hiện lỗi.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi.

## Review Triage Log

- `low` — Đã đổi nút Sửa từ màu success-light ngả xanh ngọc sang `ictu-badge-btn--success` xanh lá để phân biệt với nút chọn môn; đã bổ sung tiêu chí một hàng cho trường hợp đủ quyền và hành vi cuộn ngang trên mobile.
