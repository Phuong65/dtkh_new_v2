---
title: 'Thêm header gradient cho bài kiểm tra trắc nghiệm'
type: 'feature'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bài kiểm tra trắc nghiệm trong tab Kiểm tra thường xuyên chưa có header trực quan như các bài kiểm tra khác.

**Approach:** Thêm header nền xanh gradient hiển thị tên bài trắc nghiệm, bên dưới là trạng thái thông tin đề và thao tác Sinh đề hiện có.

</frozen-after-approval>

## Implementation Notes

- Đã thêm header gradient xanh hiển thị loại và tên bài kiểm tra; thông tin trạng thái và nút sinh/xóa đề nằm bên dưới.
- Chỉ chỉnh template và CSS của `monhoc-kiemtra-danhgia`; giữ nguyên logic nghiệp vụ và các thay đổi có sẵn ở component khác.
- Rà soát trực tiếp diff và `git diff --check`: không phát hiện lỗi.
- `npm run build` chưa thể xác minh template vì Angular CLI lỗi trước bước biên dịch khi không đọc được tài nguyên `angular:script:global:scripts`.
