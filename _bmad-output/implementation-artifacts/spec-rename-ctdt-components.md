---
title: 'Đổi tên hai component CTĐT'
type: 'refactor'
created: '2026-10-26'
status: 'done'
baseline_commit: 'e4460192642ee3e38577bf67eab2cd0d0e297aa1'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Chỉ đổi tên hai component: `BoCtdtManagementComponent` thành `CtdtComponent` (file `ctdt.component.*`, selector `app-ctdt`); `BoCtdtListComponent` thành `BoCtdtComponent` (thư mục/file `bo-ctdt`, selector `app-bo-ctdt`). Cập nhật tương ứng các route imports. Giữ nguyên thư mục feature cha `features/bo-ctdt`, URL routes, component con trong `ctdt-detail`, và mọi thay đổi hiện có ngoài phạm vi này.

</frozen-after-approval>

## Implementation Notes

- Đổi tên đúng hai component và cập nhật lazy imports trong route Đào tạo, Lãnh đạo khoa; giữ nguyên URL và feature root.
- Không thay đổi `ctdt-detail` hay các phần việc có sẵn khác.
- `npm run build` -- thành công.
