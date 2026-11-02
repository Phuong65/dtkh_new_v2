---
title: 'Chỉnh giao diện tạo câu hỏi tự luận thường xuyên'
type: 'feature'
created: '2026-11-02'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Màn Kiểm tra – Đánh giá > Kiểm tra thường xuyên > Tạo câu hỏi tự luận có CSS legacy khiến header, ô tiêu đề, nhóm nút hành động và drawer tạo/sửa đề thiếu đồng nhất; ảnh người dùng cung cấp cho thấy bảng dễ lệch và viền không liền.

**Approach:** Chỉ tinh chỉnh cấu trúc HTML/CSS của màn tự luận thường xuyên theo shell bảng admin/core-new hiện có. Giữ toàn bộ form control, API, CRUD, trạng thái duyệt, phân quyền, drawer và payload đang dùng.

</frozen-after-approval>

## Implementation Notes

- Chuẩn hóa bảng danh sách đề tự luận: full width/min-width, border đầy đủ, header xám, row hover, title cell co giãn và action group không làm lệch cột.
- Header table dùng gradient xanh, vạch xanh trái và typography đồng nhất Course Detail.
- Nút đóng drawer dùng core-new icon button có tooltip; drawer head/body/footer giữ cấu trúc hiện có, không đổi logic.
- Sửa icon sidebar Kiểm tra thường xuyên từ `ti-chevrons-lef` thành `ti-chevrons-left`.
- Bổ sung overflow ngang cho bảng khi viewport hẹp.
- Không có unit spec riêng cho `thuongxuyen-tuluan-v2`; xác nhận bằng TypeScript và diff check.

## Review Triage Log

- No verified functional findings; review scoped to markup/CSS. Isolated reviewer could not access the shared checkout, so browser visual verification remains manual.

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` — đạt.
- `git diff --check -- src/app/modules/admin/features/course-management/course-management-detail/children/thuongxuyen-tuluan-v2 src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-kiemtra-danhgia` — đạt.
- Manual: mở Kiểm tra – Đánh giá → Kiểm tra thường xuyên → chọn bài tự luận → Tạo câu hỏi mới; kiểm tra table border, action alignment, drawer editor scroll/footer, mobile horizontal scroll.
