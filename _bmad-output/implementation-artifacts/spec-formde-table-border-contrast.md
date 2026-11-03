---
title: 'Tăng độ tương phản đường viền bảng ở các tab Form đề'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
baseline_commit: 'c990704d80f9f00df192926cfe63f7fb55ae985d'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Đường viền các bảng trong tab con Form đề quá nhạt, gần trùng với nền header nên khó phân biệt ranh giới hàng và cột.

**Approach:** Tăng độ tương phản đường viền bảng trong các tab con Form đề bằng màu viền trung tính rõ hơn, giữ nguyên màu nền và kiểu chữ hiện tại của header.

</frozen-after-approval>

## Implementation Notes

- Áp dụng cho bảng trong tất cả panel Form đề (`CC`, `DG`, `TNTX`, `TN_KTHP`), bao gồm bảng nằm trong component con; chỉ đổi đường viền ô thường, giữ nguyên viền nhóm bài và màu trạng thái đặc biệt.
- Dùng `#74859a`; tỷ lệ tương phản thấp nhất là 3.09:1 trên nền header xanh nhạt `#dbeafe` (và cao hơn trên nền trắng, xám nhạt). Kiểm tra bằng build và rà soát bảng/selector trong bốn panel.
- `npm run build` chạy thành công sau khi áp dụng selector cuối.

## Review Triage Log

- `medium` — Selector viền bảng ban đầu ghi đè viền riêng của hàng nhóm bài CC; đã loại `.cc-lesson-row` khỏi selector để giữ viền đặc biệt đó.

## Review Triage Log

- `medium` — Màu viền ban đầu chưa đạt độ tương phản rõ trên nền sáng; tăng lên `#74859a`, đạt tối thiểu 3.09:1 trên các nền bảng sáng đã xác định.
- `low` — Spec thiếu mô tả phạm vi và tiêu chí đo; bổ sung danh sách panel và ngưỡng tương phản tối thiểu 3:1.
