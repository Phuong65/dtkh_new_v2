---
title: 'Sửa giật menu sidebar khi rê chuột sát cạnh'
type: 'bugfix'
created: '2026-11-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các item menu con sidebar rung liên tục khi con trỏ ở sát cạnh. Selector hover áp margin chỉ trong trạng thái tương tác, làm vùng nhận chuột dịch chuyển qua lại.

**Approach:** Giữ spacing cố định của link; loại bỏ margin chỉ xuất hiện ở trạng thái hover/focus/active để hover không thay đổi hình học item.

</frozen-after-approval>

## Implementation Notes

- Đặt `margin: 2px 10px;` cố định trên `.menu-layout-right-bottom .submenu-v2 .p-menu-item-content` (container nhận nền hover) để viền khối luôn cách đều 2 bên 10px ở mọi trạng thái.
- Đặt `margin: 0;` trên link con `.p-menu-item-link` và `.child-submenu-item-v2 a` để link chiếm trọn container, tránh cộng dồn margin và triệt tiêu khe hở gây nháy sự kiện chuột.
- Loại bỏ `margin-left: 10px; margin-right: 10px;` khỏi các selector hover/focus/active, chỉ đổi màu `#c2e7ff`, giúp hình học item ổn định 100% khi rê chuột qua mép.
- Phạm vi thay đổi: duy nhất `src/assets/css/style.css`. Đã xác thực cú pháp CSS qua postcss parse và `git diff --check`.
- Giữ nguyên các thay đổi chưa commit trước đó của bộ CTĐT PEO.

## Review Triage Log

- finding: Subagent ban đầu không thấy thay đổi uncommitted khi chạy trong worktree độc lập.
  verdict: false
  evidence: Đã chuyển sang đọc repo gốc; subagent độc lập xác nhận CSS hợp lệ, container giữ margin 2 bên cố định, hover không đổi hình học, không cộng dồn khoảng cách.

