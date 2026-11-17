---
title: 'Lưu phân loại và tín chỉ dự kiến khối trong params'
type: 'feature'
created: '2026-11-17'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Phân loại bắt buộc/tự chọn và tín chỉ dự kiến của khối kiến thức cần được lưu theo cấu hình mà không thêm cột riêng vào `ctdt-config`.

**Approach:** Lưu `loai_khoi` và `sotinchi_dukien` trong `params` của cấu hình `KHOI_KIEN_THUC`; cho phép nhập/sửa hai giá trị này và hiển thị chúng ở khung chương trình. Mặc định nhận diện key `TUCHON` là khối tự chọn, các khối khác là bắt buộc.

</frozen-after-approval>

## Implementation Notes

- Giữ nguyên các thuộc tính khác trong `params` khi cập nhật cấu hình.
- Khi đọc dữ liệu cũ, dùng giá trị tín chỉ ở cột `sotinchi_dukien` làm fallback; payload mới chỉ ghi số tín chỉ và loại khối bên trong `params`.
- Khi materialize khối mặc định lúc lưu hoặc xóa, giữ phân loại và tín chỉ dự kiến trong `params`.
- Không đổi cách tính tổng tín chỉ học phần trong phạm vi này.
- Dòng khối chỉ hiển thị nhãn “Tự chọn” hoặc “Bắt buộc”; chỉ khối tự chọn hiển thị thêm tín chỉ dự kiến.
- Dùng PrimeNG `p-select` trong drawer sửa khối để đồng nhất giao diện với các form CTĐT khác.
- Files changed: `ctdt-noidung.component.ts`, `ctdt-noidung.component.html`, `ctdt-noidung.component.css`, and this spec.

## Review Triage Log

- `false` — Giữ trường nhập tín chỉ dự kiến trong drawer cho cả hai phân loại không trái với yêu cầu hiển thị: yêu cầu chỉ giới hạn nội dung ở dòng khối. Ẩn trường nhập là thay đổi hành vi bổ sung, không được yêu cầu.
