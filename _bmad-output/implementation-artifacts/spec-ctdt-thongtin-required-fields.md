---
title: 'Bắt buộc Khoa, Ngành, Khóa và Hệ đào tạo'
type: 'feature'
created: '2026-10-16'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Biểu mẫu `bo-ctdt/ctdt-thongtin` chưa bắt buộc đầy đủ bốn trường Khoa, Ngành, Khóa áp dụng và Hệ đào tạo, nên có thể lưu hồ sơ thiếu thông tin tổ chức đào tạo.

**Approach:** Bổ sung validator bắt buộc cho bốn control tương ứng, hiển thị dấu sao và lỗi theo mẫu hiện có; trạng thái hoàn thiện và nút lưu tiếp tục dựa trên `formCtdt.valid`.

</frozen-after-approval>

## Implementation Notes

- Chỉ sửa `ctdt-thongtin.component.ts` và `ctdt-thongtin.component.html`.
- `category_id` và `nganh_id` đã có `Validators.required`, dấu sao và lỗi; giữ nguyên.
- Bổ sung `Validators.required` cho `khoa_apdung` và `he_dt`, cùng dấu sao, `aria-invalid`/`aria-describedby` phù hợp và thông báo lỗi khi touched + invalid.
- Không ghi đè thay đổi hiện có, gồm placeholder Khóa áp dụng `VD: 20` và CSS/UI khác.
- Xác minh bằng TypeScript, Angular development build và `git diff --check`.
