---
title: 'Đồng nhất tooltip trái và một dòng trong các khu vực quản lý'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tooltip trong các component `bo-ctdt`, `subject-management` và `course-management` đang có vị trí hiển thị không nhất quán, một số tooltip có thể xuống nhiều dòng.

**Approach:** Cấu hình mọi `pTooltip` trong các khu vực này hiển thị bên trái và giữ nội dung trên một dòng, chỉ giới hạn ảnh hưởng trong các khu vực được yêu cầu.

</frozen-after-approval>

## Implementation Notes

- Đặt `tooltipPosition="left"` cho các tooltip còn thiếu hoặc đang dùng vị trí khác trong `bo-ctdt` và `course-management`; các tooltip trong `subject-management` đã đúng vị trí.
- Thêm CSS giữ tooltip trên một dòng, giới hạn chiều rộng theo viewport và rút gọn nội dung quá dài; quy tắc chỉ áp dụng khi một trong các trang mục tiêu đang hoạt động.

## Review Triage Log

- defer — Nút chọn môn học trong sidebar staged chưa khóa theo `canSelectSubjects`; không do thay đổi tooltip, đã ghi vào deferred-work.
- reject-low — Chưa có empty state cho danh sách môn học; chỉ lộ rõ khi không có kết quả và không liên quan thay đổi tooltip.
- defer — Form staged chưa hiển thị lỗi theo trường khi dữ liệu không hợp lệ; không do thay đổi tooltip, đã ghi vào deferred-work.
- defer — PEO embedded ẩn heading nhưng vẫn tham chiếu ID qua `aria-labelledby`; markup staged trước task này, đã ghi vào deferred-work.
- patched — Tooltip động dài có thể tràn khi ép một dòng; đã giới hạn chiều rộng theo viewport và ellipsis.
- reject-low — Tìm kiếm chỉ chạy khi nhấn Enter nhưng vẫn hoạt động; bổ sung hướng dẫn tìm kiếm là cải thiện nhỏ, ngoài phạm vi.
- reject-low — Nút lưu cho phép thao tác không đổi dữ liệu nhưng hàm thoát an toàn; tác động thấp và không liên quan.
- defer — Thiếu các kiểm thử sidebar được spec staged yêu cầu; không thuộc thay đổi tooltip, đã ghi vào deferred-work.
