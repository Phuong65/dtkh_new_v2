---
title: 'Áp dụng border xám cho toàn bộ tab Form đề'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Border xám `#858585` hiện chỉ được áp dụng cho bảng nằm trong các panel con của Form đề, nên chưa bao phủ hết các bảng thuộc tab Form đề ở màn hình chi tiết học phần.

**Approach:** Mở rộng phạm vi selector border để áp dụng cho mọi bảng trong nội dung tab Form đề, giữ nguyên màu header và các viền trạng thái/nhóm có chủ đích.

</frozen-after-approval>

## Implementation Notes

- Mở rộng selector trong `monhoc-formde.component.css` từ `.form-de-tab-panels .form-de-tab-panel` ra `.formde-shell`, vẫn bỏ qua ô thuộc hàng `.cc-lesson-row`.
- Các trạng thái đặc biệt hiện dùng màu nền/chữ; không có border riêng cần giữ. Thay đổi chỉ đặt `border-color`, giữ nguyên style trạng thái và loại trừ hàng `.cc-lesson-row`.
- `git diff --check` và `npm run build` chạy thành công.

## Review Triage Log

- `false` — Nhận định selector mới sẽ ghi đè border riêng của trạng thái không đúng: các trạng thái trong Form đề chỉ khai báo màu nền/chữ, không có border riêng; hàng `.cc-lesson-row` vẫn được loại trừ.
- `low` — Ghi chú xác minh bị lặp trong spec Bộ CTĐT là việc có sẵn, ngoài phạm vi. Đã ghi nhận để xử lý sau, không sửa nội dung Bộ CTĐT.
