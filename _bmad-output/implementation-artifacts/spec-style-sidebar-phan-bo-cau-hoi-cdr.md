---
title: 'Style sidebar Phân bổ câu hỏi CDR'
type: 'feature'
created: '2026-11-02'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sidebar của tab Phân bổ câu hỏi CDR còn thô, khó đọc, nút đóng/mở thiếu trạng thái truy cập và bố cục nhãn cố định gây chật trên viewport hẹp.

**Approach:** Làm mới riêng presentation layer của sidebar theo pattern header/card hiện có trong course-management-detail, bổ sung responsive và accessibility; giữ nguyên toàn bộ dữ liệu, binding, handler và logic nghiệp vụ.

</frozen-after-approval>

## Implementation Notes

- Đã chỉnh duy nhất HTML/CSS của `children/monhoc-question-cdr`, giữ `closeLeftBody()`, binding, bảng, modal và những thay đổi chưa commit ở tab Sinh đề.
- Sidebar chuyển sang `aside` với header cố định, vùng nội dung cuộn, thẻ tổng quan/cảnh báo/khuyến nghị. Thu gọn còn thanh 52px để nút mở lại luôn truy cập được; `aria-expanded`/`aria-controls`, focus-visible, responsive và reduced-motion.
- Không cần chỉnh TypeScript hoặc import thư viện/icon; sử dụng Tabler icons có sẵn trong project.
- Đợt chỉnh tiếp theo theo feedback: nút đóng dùng `mat-flat-button` + `ictu-badge-btn--secondary-reverse`; nút mở tách thành floating overlay giữa chiều dọc khi sidebar đóng; thông tin CĐR đổi thành KPI, danh sách card có progress bar, pill số liệu và cảnh báo/điều kiện dễ quét hơn.
- `npm run build`: đạt ở đợt trước; đang chạy lại sau đợt chỉnh. `git diff --check`: đạt ở đợt trước. VS Code không báo lỗi template, chỉ còn hint `styleClass` deprecated của bảng hiện hữu. Chưa kiểm thử trực quan trên ứng dụng đăng nhập.
