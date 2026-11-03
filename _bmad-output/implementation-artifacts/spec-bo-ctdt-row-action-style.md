---
title: 'Đồng bộ style nút thao tác danh sách Bộ CTĐT'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
baseline_commit: 'c990704d80f9f00df192926cfe63f7fb55ae985d'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các nút icon trong cột Thao tác của danh sách Bộ CTĐT cần được trình bày gọn, đồng đều và dễ nhận biết theo ảnh tham khảo.

**Approach:** Căn đều nhóm nút trong cột, giữ nút thao tác thường màu xanh nhạt và nút xóa màu đỏ nhạt, thống nhất kích thước vuông và trạng thái hover/focus. Chỉ áp dụng trong danh sách Bộ CTĐT, không thay đổi logic hoặc style dùng chung.

</frozen-after-approval>

## Implementation Notes

- Căn đều nhóm nút theo hàng ngang, giãn 16px ở màn hình thường và 8px trên màn hình hẹp; giữ màu xanh nhạt/đỏ nhạt từ style nút dùng chung.
- Chuẩn hóa nút icon 32px, bo góc nhẹ, thêm hover nâng nhẹ; chỉ giới hạn trong cột thao tác danh sách Bộ CTĐT.
- Giữ nguyên logic, tooltip, nhãn truy cập và các thay đổi chưa commit khác.
- Ảnh tham chiếu thể hiện năm nút icon vuông trên một hàng, bốn nút thao tác nền xanh nhạt và nút xóa nền đỏ nhạt, được giãn đều trong cột.
- `git diff --check` và build Angular được xác minh.

## Review Triage Log

- `low` — Spec chưa chép lại chi tiết ảnh tham chiếu; đã ghi rõ số lượng, màu và cách căn nút trong Implementation Notes để kết quả có thể đối chiếu.
