---
title: 'Dùng trường số tín chỉ dự kiến cho khối kiến thức CTĐT'
type: 'bugfix'
created: '2026-11-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cột lưu tín chỉ dự kiến của khối kiến thức trong `ctdt-config` là `sotinchi_dukien`, nhưng giao diện hiện đang đọc và ghi trường `value`.

**Approach:** Dùng nhất quán `sotinchi_dukien` trong model và giao diện khung chương trình để tín chỉ dự kiến được lưu, tải lại, hiển thị và giữ nguyên khi materialize các cấu hình mặc định.

</frozen-after-approval>

## Implementation Notes

- Thay thế việc dùng `value` làm số tín chỉ khối bằng `sotinchi_dukien` ở model, form, hiển thị và payload lưu; không đổi API khác.
- Cấu hình mặc định và bản ghi cấu hình riêng giữ nguyên `sotinchi_dukien`.
- Kiểm tra component tests và Angular build.
