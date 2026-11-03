---
title: 'Thu gọn cột thao tác danh sách Bộ CTĐT'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cột Thao tác của danh sách Bộ CTĐT đang rộng và các nút cách nhau quá xa, khiến bảng kém gọn.

**Approach:** Thu gọn cột Thao tác và xếp các nút thành hai hàng để tránh kéo rộng bảng. Mỗi nút dùng một màu riêng từ bộ style có sẵn của `core-new`, vẫn giữ kích thước, biểu tượng và hành vi hiện tại.

</frozen-after-approval>

## Implementation Notes

- Trong `bo-ctdt.component.css`, giới hạn cột thao tác 130px, nhóm nút 108px và khoảng cách 6px; với đủ năm quyền, ba nút ở hàng đầu và hai ở hàng sau.
- Giữ nút icon 32px. Ánh xạ màu có sẵn: PLO `primary`, PEO `purple`, chọn môn `teal`, sửa `orange`, xóa `danger`.
- Chỉ đổi style cột thao tác danh sách Bộ CTĐT; không đổi logic, style dùng chung hoặc các cột khác.
- Người dùng cập nhật yêu cầu trong khi triển khai: cần xếp hai hàng và phân biệt màu từng nút.
- Tiêu chí: khi `canUpdate` và `canDelete` đều bật, đủ năm nút xuất hiện theo bố cục 3+2; khi một trong hai quyền tắt, các nút tương ứng ẩn và số nút còn lại không tràn khỏi cột.
- Xác minh ở viewport desktop 1280px và mobile 375px: vùng nút rộng 108px chứa tối đa ba nút 32px với hai khoảng cách 6px; bảng vẫn cuộn ngang theo min-width hiện có trên mobile, nhưng nút không tràn khỏi ô thao tác.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi.

## Review Triage Log

- `low` — Đã làm rõ tiêu chí theo trạng thái `canUpdate`/`canDelete`; template chỉ ẩn hai nút Sửa/Xóa theo quyền, ba nút còn lại vẫn hiển thị và giữ trạng thái disabled hiện tại.
- `low` — Đã xác định viewport desktop 1280px/mobile 375px và hành vi bảng cuộn ngang trên mobile; chiều rộng nhóm nút 108px chứa chính xác ba nút 32px với hai khoảng cách 6px.
