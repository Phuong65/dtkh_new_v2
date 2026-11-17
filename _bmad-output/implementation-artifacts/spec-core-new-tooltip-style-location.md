---
title: 'Đặt style tooltip trong CSS core-new'
type: 'chore'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Quy tắc một dòng cho tooltip của các khu vực quản lý đang nằm trong stylesheet global thay vì stylesheet của core-new.

**Approach:** Chuyển nguyên quy tắc CSS có giới hạn theo trang sang stylesheet core-new đang được nạp trong ứng dụng và bỏ quy tắc khỏi stylesheet global.

</frozen-after-approval>

## Implementation Notes

- Chuyển quy tắc giới hạn tooltip của `bo-ctdt`, `subject-management` và `course-management` từ `src/assets/css/style.css` vào `src/app/core-new/styles/ictu-admin-form.css`, file này đã được nạp trong `angular.json`.

## Review Triage Log

- medium — Nút chọn môn học sidebar có thể không khả dụng theo quyền nhưng vẫn nhận click; lỗi đã có trước thay đổi này và được ghi nhận trong deferred-work.
- low (rejected) — Danh sách môn học thiếu empty state; ngoài phạm vi di chuyển CSS và chỉ ảnh hưởng tình huống không có kết quả.
- medium — Form cấu hình thiếu thông báo lỗi theo trường; lỗi có sẵn, đã ghi nhận trong deferred-work.
- medium — PEO embedded tham chiếu heading bị ẩn; lỗi có sẵn, đã ghi nhận trong deferred-work.
- medium — Thiếu kiểm thử cho luồng sidebar theo spec; tồn tại trước thay đổi CSS và đã ghi nhận trong deferred-work.
- low — Checklist triển khai trong spec sidebar chưa cập nhật; lỗi tài liệu có sẵn, đã ghi nhận trong deferred-work.
- false — Ghi chú nói chuyển rule khỏi `style.css` là chính xác: rule được thêm vào stylesheet đó ở thay đổi ngay trước rồi được chuyển theo yêu cầu này.
- low (rejected) — Tìm kiếm sidebar cần nhấn Enter nhưng đang hoạt động bình thường; không liên quan CSS tooltip.
