---
title: 'Đổi tiêu đề khung chương trình và thêm tín chỉ cho khối kiến thức'
type: 'feature'
created: '2026-11-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab Học phần CTĐT đang có tiêu đề chưa thể hiện rõ đây là khung chương trình và chưa cho phép khai báo số tín chỉ riêng cho từng khối kiến thức.

**Approach:** Đổi tiêu đề phần nội dung thành “Khung chương trình” và bổ sung trường số tín chỉ có thể chỉnh sửa cho mỗi khối kiến thức, lưu cùng cấu hình khối để hiển thị lại sau khi tải.

</frozen-after-approval>

## Implementation Notes

- Phạm vi tiêu đề là heading trong nội dung tab Học phần; giữ nguyên nhãn tab điều hướng “Học phần”.
- Số tín chỉ dự kiến lưu trong trường `sotinchi_dukien` của cấu hình `KHOI_KIEN_THUC`; không thay đổi API hay cộng tự động từ các học phần.
- Form thêm/sửa khối kiến thức lưu số tín chỉ; hàng tiêu đề mỗi khối hiển thị giá trị đã lưu. Giữ nguyên giá trị này khi tạo cấu hình mặc định còn thiếu trong luồng lưu/xóa khối.
- Trường tín chỉ không bắt buộc, chấp nhận số không âm (có thể lẻ); khối cũ chưa có giá trị hiển thị “Chưa khai báo tín chỉ”, còn khối tạm “Chưa xác định” không hiển thị trường này.
- Kiểm thử component đạt 15/15; build Angular thành công.

## Review Triage Log

- patched — Không hiển thị tín chỉ cho nhóm tạm chưa xác định khối; nhóm này không có cấu hình tín chỉ.
- patched — Khối cũ chưa có giá trị hiển thị “Chưa khai báo tín chỉ” thay vì dấu gạch kèm đơn vị gây hiểu nhầm.
- patched — Thêm `aria-invalid` và `aria-describedby` cho trường tín chỉ khi có lỗi min.
- patched — Ghi rõ hành vi với giá trị trống, 0 và số lẻ trong Implementation Notes.
- patched — Bổ sung kiểm thử lưu số tín chỉ và giữ giá trị khi tạo cấu hình riêng từ các khối mặc định.
