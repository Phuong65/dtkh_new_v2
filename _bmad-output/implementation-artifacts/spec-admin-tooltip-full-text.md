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

**Problem:** Tooltip trong khu vực quản lý có thể bị xuống dòng hoặc bị rút gọn, khiến nội dung khó đọc đầy đủ.

**Approach:** Hiển thị nội dung tooltip trên đúng một dòng, không rút gọn bằng dấu ba chấm; giới hạn chiều rộng tối đa theo viewport để giữ nội dung trong tầm nhìn.

</frozen-after-approval>

## Implementation Notes

- Chỉnh quy tắc `.p-tooltip-text` hiện có trong `src/app/core-new/styles/ictu-admin-form.css`; giữ nguyên phạm vi trang hiện tại và không thay đổi nội dung hay vị trí tooltip.
- Nới giới hạn chiều rộng trên khung `.p-tooltip` để nội dung không bị xuống dòng do max-width mặc định của PrimeNG.
- Đặt nội dung tooltip một dòng và bỏ ellipsis; nếu nội dung vượt chiều rộng viewport, vùng chữ có thể cuộn ngang để vẫn đọc được toàn bộ.
- Review xác nhận cần cuộn ngang thay vì để nội dung tràn khỏi viewport khi tooltip dài hơn màn hình.
- Build Angular thành công sau thay đổi; rà soát không còn vấn đề tồn đọng.
