---
title: 'Đồng nhất badge trạng thái CPI'
type: 'feature'
created: '2026-11-03'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Badge trạng thái CPI đang khác kích thước, bo góc và cách trình bày so với badge trạng thái trong Giảng dạy lý thuyết và Thảo luận.

**Approach:** Dùng cùng biến thể màu và thông số hiển thị của badge trạng thái hiện có cho tất cả trạng thái CPI, gồm trạng thái duyệt và thời điểm duyệt.

</frozen-after-approval>

## Implementation Notes

- Badge CPI và badge thành công `.course-status-badge.ictu-badge--success` dùng cùng kiểu hiển thị xanh lá với `.cdr-info-tag .value-info.method`; giữ nguyên nội dung và hành vi các trạng thái.
