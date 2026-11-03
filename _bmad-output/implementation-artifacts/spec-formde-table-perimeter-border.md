---
title: 'Đổi màu cả viền ngoài bảng Form đề'
type: 'bugfix'
created: '2026-11-03'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Viền bảng ở tab Form-đề vẫn trông đen sau lần đổi màu trước vì quy tắc mới chỉ đổi màu viền ô, chưa áp dụng cho viền nằm trên chính phần tử bảng.

**Approach:** Áp dụng màu xám `#858585` cho viền ngoài mỗi bảng và các viền ô trong tab Form-đề; giữ nguyên viền nhóm bài đặc biệt.

</frozen-after-approval>

## Implementation Notes

- Thêm selector riêng cho phần tử `table` trong `.formde-shell`; giữ selector ô hiện tại để đặt màu viền cả chu vi bảng lẫn viền ô.
- Xác minh `git diff --check` và `npm run build` thành công.
