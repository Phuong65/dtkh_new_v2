---
title: 'Dùng Ovic dropdown cho phân loại khối CTĐT'
type: 'bugfix'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bộ chọn phân loại khối trong drawer chưa dùng component `ovic-dropdown` như các form CTĐT khác.

**Approach:** Thay select hiện tại bằng `OvicDropdownComponent`, kết nối với control reactive hiện tại và giữ các lựa chọn Bắt buộc/Tự chọn cùng style ICTU.

</frozen-after-approval>

## Implementation Notes

- Dùng trực tiếp `OvicDropdownComponent` với các API sẵn có: `optionId="value"`, `optionLabel="label"`, `[formField]`, `[defaultValue]`, `[showClear]="false"` và `styleClass`.
- Không thêm `inputId` hay thay đổi API của component dùng chung; nhãn theo mẫu `span` đã được các form CTĐT sử dụng.
- Tùy chỉnh giao diện bằng class cục bộ trong component khung chương trình; không sửa logic lưu hoặc các thay đổi CTĐT khác đang có.
- Files changed: `ctdt-noidung.component.ts`, `ctdt-noidung.component.html`, `ctdt-noidung.component.css`, and this spec.
