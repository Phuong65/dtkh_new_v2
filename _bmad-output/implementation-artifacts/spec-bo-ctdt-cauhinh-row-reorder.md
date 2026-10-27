---
title: 'Sửa kéo thả thứ tự cấu hình CTĐT'
type: 'bugfix'
created: '2026-10-15'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các dòng trong bảng thuộc từng nhóm cấu hình của tab Cấu hình CTĐT không đổi được vị trí bằng tay kéo; số thứ tự cũng phải phản ánh vị trí mới để thao tác lưu giữ đúng thứ tự.

**Approach:** Giữ PrimeNG row reorder đang có. Bảo đảm drag handle được nhận diện, xử lý sự kiện reorder để đánh số thứ tự theo mảng đã được PrimeNG sắp xếp, rồi dùng luồng lưu và tải lại cấu hình hiện hữu. Giữ nguyên dữ liệu, màu sắc, nội dung, nhóm và các chỉnh sửa khác chưa commit.

</frozen-after-approval>

## Implementation Notes

- Người dùng đã cho phép tiếp tục trên working tree có nhiều thay đổi chưa commit, yêu cầu không ghi đè chúng.
- File mục tiêu: `src/app/modules/admin/features/ctdt/ctdt-detail/children/ctdt-cauhinh/ctdt-cauhinh.component.html` và `.ts`.
- PrimeNG 21 `ReorderableRow` kiểm tra `p-datatable-reorderable-row-handle` trên target/ancestor ở mousedown. Bản cài đặt hiện tại dùng Lara, không có `unstyled: true`; gắn class rõ ràng trên handle để không phụ thuộc style config.
- `onRowDrop` của PrimeNG hoán đổi mảng trước khi phát `onRowReorder`; event chỉ có dragIndex/dropIndex. Handler chỉ đánh lại `ordering = index + 1`; `saveConfig()` đã cập nhật ordering trước PUT/POST và `loadCtdtConfig()` đã tải order ASC.
- Giữ cùng từng nhóm `parent.ctdt_config`; không sắp xếp các section cấu hình.
- Đã thay span handle bằng phần tử icon `ti-grip-vertical` có explicit class `p-datatable-reorderable-row-handle`, bind `(onRowReorder)` và `onConfigRowReorder()` để đánh lại `ordering` theo thứ tự đã đổi.
- Đã bổ sung test cô lập cho việc đánh số sau reorder và chặn khi đang loading.
