---
title: 'Đồng bộ bộ chọn loại khối với ICTU form'
type: 'bugfix'
created: '2026-11-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bộ chọn phân loại khối trong drawer chưa dùng đúng style control của `ictu-form`.

**Approach:** Dùng class và style control ICTU form đã có cho bộ chọn, giữ nguyên options, reactive form và hành vi lưu hiện tại.

</frozen-after-approval>

## Implementation Notes

- Dựa theo token và quy tắc trong `src/app/core-new/styles/ictu-admin-form.css`.
- Dùng `select` native với class `ictu-form__input-field`, giữ hai option Bắt buộc/Tự chọn và `formControlName` hiện tại.
- Chỉ chỉnh bộ chọn phân loại ở drawer trong `ctdt-noidung.component.html` và style trực tiếp liên quan nếu cần; không sửa stylesheet dùng chung.
- Bộ chọn giữ trạng thái bắt buộc và thông báo lỗi hỗ trợ truy cập nhất quán với trường tên khối.
- Files changed: `ctdt-noidung.component.html`, `ctdt-noidung.component.css`, `ctdt-noidung.component.ts`, and this spec.

## Review Triage Log

- `low` — Reviewer phát hiện thiếu `ctdt-noidung.component.ts` trong danh sách file; đã đồng bộ ghi chú theo thay đổi gỡ PrimeNG Select.
- `medium` — Select native chưa công bố trạng thái bắt buộc cho công nghệ hỗ trợ; đã thêm thuộc tính `required`.
- `medium` — Select thiếu trạng thái lỗi và thông báo khi invalid; đã bổ sung `aria-invalid`, `aria-describedby` và thông báo lỗi nhất quán với ô tên khối.
