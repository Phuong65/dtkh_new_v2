---
title: 'Làm mảnh đường viền bảng nhập PEO và PLO'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Đường lưới trong bảng ở màn hình nhập PEO và PLO/PI đang nhìn hơi dày.

**Approach:** Làm mảnh đường viền ô của hai bảng PEO và PLO/PI, giữ nguyên màu, bố cục, nền bảng và các thành phần khác.

</frozen-after-approval>

## Implementation Notes

- Giảm border ô header/cell từ `1px` xuống `0.5px` trong hai stylesheet riêng; giữ màu `--bo-cdr-border`/`--bo-peo-border` và viền khung card 1px.
- Không sửa bảng khác hoặc component dùng chung.
- Tiêu chí: Given bảng PEO và PLO/PI được hiển thị, when xem đường lưới, then border ô mảnh hơn trước; viền khung card vẫn 1px và bảng khác không đổi.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi. Kiểm tra CSS xác nhận hai selector bảng dùng `0.5px`, còn border khung card vẫn `1px`.

## Review Triage Log

- `low` — Đã thêm tiêu chí kiểm tra border ô, khung card và phạm vi bảng khác; ghi rõ build, diff-check và rà soát selector CSS.
- `low` — Review phát hiện ghi chú build bị lặp trong spec màu nút Bộ CTĐT đã tồn tại trước yêu cầu này; không sửa để giữ nguyên thay đổi chưa commit của người dùng, đã đưa vào deferred-work.
