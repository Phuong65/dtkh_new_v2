---
title: 'Đồng bộ kích thước Ovic dropdown trong form khối CTĐT'
type: 'bugfix'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ovic dropdown phân loại khối trong drawer có kích thước khác với dropdown trong phần “Tổ chức đào tạo” của tab “Thông tin chung” CTĐT.

**Approach:** Dùng cùng cấu trúc field, component `ovic-dropdown` và bộ quy tắc style đang áp dụng ở phần “Tổ chức đào tạo”; chỉ thay options và tên trường cho phân loại khối.

</frozen-after-approval>

## Implementation Notes

- CSS `.ctdt-field` và Ovic dropdown trước đây chỉ áp dụng trong phạm vi `ctdt-thongtin`; drawer khung chương trình được append vào `body`, ngoài phạm vi style component.
- Chuyển nguyên các quy tắc field, label, error và dropdown từ `ctdt-thongtin.component.css` sang `ictu-admin-form.css` để hai màn hình dùng cùng styles; không thêm bộ style riêng cho khung chương trình và không thay đổi API Ovic dropdown.
- Markup phân loại khối theo cấu trúc như các dropdown trong “Tổ chức đào tạo”; option source tương ứng là `khoiTypeOptions`.
- Files changed: `ictu-admin-form.css`, `ctdt-thongtin.component.css`, `ctdt-noidung.component.html`, `ctdt-noidung.component.css`, and this spec.
- Validation: CTĐT content component tests passed (16/16); Angular production build succeeded. Review found no significant issues.
