---
title: 'Hiển thị loại và mã trong tên tab chi tiết học phần'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Thanh tiêu đề trong màn chi tiết học phần chỉ hiện tên, nên thiếu loại bản ghi và mã để nhận diện.

**Approach:** Hiển thị “Học phần - [MÃ] - Tên” trong thanh tiêu đề ở màn chi tiết học phần.

</frozen-after-approval>

## Implementation Notes

- Màn “Học phần” hiện hữu là route `hoc-phan`; thanh tiêu đề nằm trong `course-management-detail.html` và dữ liệu được tải trong `course-management-detail.ts`.
- Dùng chung thứ tự loại bản ghi → mã trong ngoặc vuông → tên; bỏ qua mã hoặc tên rỗng và vẫn giữ “Học phần” khi cả hai thiếu.
- Giữ nguyên tiêu đề tab trình duyệt; chỉ cập nhật nhãn tiêu đề hiển thị trong thanh của màn chi tiết học phần.
- Kiểm thử nhãn và tooltip tiêu đề của thanh chi tiết; chạy component spec và Angular build.
- Đã thêm computed heading dùng chung cho nội dung và tooltip của thanh tiêu đề; đã hoàn nguyên thay đổi title trình duyệt và không thay đổi màn môn học.

## Review Triage Log

- patched — Hiển thị loại, mã và tên học phần trong thanh tiêu đề trên màn chi tiết; nội dung và tooltip dùng cùng một giá trị.
