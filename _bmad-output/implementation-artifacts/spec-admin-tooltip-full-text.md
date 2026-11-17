---
title: 'Hiển thị đầy đủ nội dung tooltip quản trị'
type: 'bugfix'
created: '2026-11-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các tooltip trong khu vực quản lý bị rút gọn bằng dấu ba chấm khi nội dung dài.

**Approach:** Hiển thị đầy đủ nội dung tooltip, cho phép xuống dòng khi cần và giữ giới hạn chiều rộng theo viewport; nội dung ngắn vẫn hiển thị trên một dòng.

</frozen-after-approval>

## Implementation Notes

- Chỉnh quy tắc `.p-tooltip-text` hiện có trong `src/app/core-new/styles/ictu-admin-form.css`; giữ nguyên phạm vi trang hiện tại và không thay đổi nội dung hay vị trí tooltip.
- Tooltip ngắn vẫn hiển thị trên một dòng; tooltip dài tự xuống dòng, không bị cắt bằng dấu ba chấm.
- Build Angular thành công; rà soát thay đổi không phát hiện vấn đề đáng kể.
