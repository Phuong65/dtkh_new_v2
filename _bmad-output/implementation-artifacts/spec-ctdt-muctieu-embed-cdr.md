---
title: 'Nhúng chuẩn đầu ra vào cuối màn hình mục tiêu CTĐT'
type: 'feature'
created: '2026-10-23'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Màn hình mục tiêu CTĐT cần hiển thị luôn phần chuẩn đầu ra (PLO/PI và ma trận PEO–PLO) ở cuối nội dung, thay vì buộc người dùng chuyển sang tab hoặc màn hình riêng.

**Approach:** Tái sử dụng `CtdtCdrComponent` standalone bằng cách nhúng selector của component vào cuối vùng nội dung chính của `CtdtMuctieuCdrComponent`, truyền CTĐT hiện tại và tín hiệu làm mới PEO để dữ liệu liên kết được cập nhật.

</frozen-after-approval>

## Implementation Notes

- Thay đổi hiện tại đã thêm `CtdtCdrComponent` vào imports standalone của component mục tiêu.
- Template đã đặt `<app-ctdt-cdr>` sau bảng PEO, nên nội dung CDR nằm ở vị trí cuối cùng trong cột chính.
- CDR có chế độ `embedded` để không đọc `queryParams` riêng, dùng CTĐT từ input, tự dọn subscription khi bị hủy và tải lại khi danh sách PEO thay đổi.
- Không thay đổi route CDR độc lập; tab/màn hình CDR hiện tại vẫn được giữ.
- Cần kiểm tra build Angular và rà soát diff cuối cùng; không thực hiện migration hoặc thao tác dữ liệu ngoài các API CRUD đã có.
