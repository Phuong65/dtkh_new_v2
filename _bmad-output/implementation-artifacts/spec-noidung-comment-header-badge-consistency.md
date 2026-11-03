---
title: 'Đồng nhất nút nhận xét và badge trạng thái header Nội dung'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'd6f971529552a1946b0aef409971ec428658e975'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nút xem nhận xét tại các phần trong tab Nội dung đang lệch kiểu hiển thị; badge trạng thái và thời điểm duyệt ở các header cũng thiếu nhất quán về kích thước và bo góc.

**Approach:** Dùng chung kiểu nút nhận xét cho các phần có hỗ trợ xem nhận xét; đồng nhất badge trạng thái ở các header, giữ nền badge nhưng dùng góc vuông nhẹ thay cho bo tròn dạng viên thuốc.

</frozen-after-approval>

## Implementation Notes

- Trong hai phần Mục tiêu và Tài liệu, chuẩn hóa class nút nhận xét, wrapper và số lượng comment; tránh selector CSS toàn cục gạch chân các span bên trong.
- Trong header Mục tiêu và Tài liệu, hiển thị tất cả trạng thái duyệt và thời điểm duyệt bằng badge cùng kích thước, cùng bán kính góc `4px`, dùng biến và class badge của core-new.
- Theo xác nhận của người dùng, dùng kiểu badge core-new vuông nhẹ `4px`, không sao chép kiểu badge khác.
- Giữ nguyên điều kiện hiển thị nút, nội dung trạng thái, số lượng nhận xét, hành vi toggle và phần sidebar dạng chữ màu.
- Giữ nguyên file chưa theo dõi có sẵn ngoài phạm vi.
- Thay wrapper/class đặc thù của từng nút bằng class chung để tránh selector toàn cục `.view-comment-action span` gây underline.
- Thêm kiểm thử component cho cả bốn trạng thái, bán kính badge render `4px`, đúng đích toggle nhận xét và ẩn nút khi không có nhận xét.
- Kiểm thử radius cho mọi badge đang hiển thị, bao gồm cả badge thời điểm duyệt; kiểm thử nút gọi đúng component nhận xét tương ứng.
- Xác minh: 15/15 component tests đạt, `npm run build` đạt và `git diff --check` đạt.

## Review Triage Log

- `false` — Nhận xét về trường Người phụ trách thuộc spec riêng `spec-course-responsible-unpaged-cursor.md`, không thuộc thay đổi hay phạm vi spec hiện tại; giữ nguyên file ngoài phạm vi.
- `false` — Nhận xét về kiểm thử phân trang cursor thuộc spec riêng nói trên, không liên quan đến thay đổi nút nhận xét và badge header.
- `patched` — Spy trước đó chỉ kiểm tra đối số; kiểm thử hiện gọi handler thật và xác nhận nó gọi đúng child toggle cho Mục tiêu và Tài liệu.
- `patched` — Kiểm thử hiện xác nhận radius `4px` cho toàn bộ badge header đang hiển thị và nội dung badge thời điểm duyệt ở cả hai header.
- `false` — `aria-expanded` không thuộc yêu cầu; không thay đổi semantics/accessibility ngoài phạm vi khi yêu cầu là giữ nguyên hành vi toggle.
