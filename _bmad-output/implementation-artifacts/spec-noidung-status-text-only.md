---
title: 'Hiển thị trạng thái nội dung dạng chữ màu'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các trạng thái duyệt trong sidebar và header nội dung đang hiển thị bằng badge hoặc dấu chấm, tạo cảm giác nặng và không đồng nhất.

**Approach:** Hiển thị tên trạng thái và thời điểm duyệt bằng chữ có màu tương ứng, bỏ nền, viền và bo tròn dạng badge trên các mục sidebar và header của phần nội dung.

</frozen-after-approval>

## Implementation Notes

- Phạm vi là trạng thái `Chờ duyệt`, `Đạt`, `Chưa đạt`/`Yêu cầu sửa`, `Đã sửa`/`Yêu cầu duyệt` trên mục lục và các header Mục tiêu, Tài liệu giảng dạy; trạng thái duyệt lúc nào cũng là chữ màu, không pill.
- Giữ nguyên nội dung, điều kiện hiển thị và màu ngữ nghĩa của từng trạng thái.
- Giữ nguyên file chưa theo dõi có sẵn ngoài phạm vi.
- Đã thay dot/badge/pill bằng class chữ màu dùng chung ở `monhoc-noidung.component.html` và `monhoc-noidung.component.css`.
- Cho phép nhãn dài xuống dòng trong sidebar; thêm assertion cho trạng thái sidebar trong `monhoc-noidung.component.spec.ts`.
- Màu chữ trạng thái được kiểm tra tương phản tối thiểu 4.5:1 trên các nền sáng của sidebar/header; nhãn ở header giữ cỡ chữ 14px.
- `npm run build` thành công; kiểm thử component chạy 14/14 thành công; `git diff --check` đạt.

## Review Triage Log

- `false` — Nhãn khác nhau giữa mục lục và các khối nội dung đã tồn tại trước thay đổi; lần này chỉ chuẩn hóa cách trình bày, không đổi nội dung trạng thái.
- `low` — Nhánh trạng thái ngoài các giá trị 0, 1, -1, -2 vẫn chưa có nhãn; không có bằng chứng đây là giá trị trạng thái hợp lệ, nên không tự đặt nội dung fallback.
- `medium` — Nhãn sidebar dài có thể tràn vùng thao tác; đã cho phép xuống dòng và giới hạn độ rộng trạng thái mục cha.
- `false` — Thêm icon/shape hoặc badge trái với yêu cầu hiển thị chữ màu không badge.
- `false` — Thiếu `aria-live` không phải hồi quy từ thay đổi này; trạng thái là nội dung trang được tải cùng dữ liệu, không phải thông báo tương tác tức thời.
- `false` — Đã thêm kiểm thử component đảm bảo trạng thái sidebar là chữ và không còn dot/badge.
- `low` — Chuẩn hóa mapping trạng thái thành helper chung là refactor ngoài phạm vi; các nhãn/domain mapping được giữ nguyên.
- `false` — Bổ sung thời điểm cho các trạng thái ngoài đã duyệt không thuộc yêu cầu và không bị thay đổi.
- `false` — Màu trạng thái đạt tương phản ít nhất 4.5:1 trên nền trắng và nền sáng; màu xanh resubmitted được làm đậm hơn để đạt mức này trên header xanh nhạt.
