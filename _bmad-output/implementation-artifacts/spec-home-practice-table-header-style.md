---
title: 'Chỉnh style header bảng Luyện tập tại nhà'
type: 'feature'
created: '2026-11-03'
status: 'done'
baseline_commit: '67623d8ac3c90614aab0c6330a073dc7a6e524f7'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Header bảng trong tab con Luyện tập tại nhà chưa đúng style mong muốn.

**Approach:** Làm thanh tiêu đề phía trên bảng Luyện tập tại nhà giống các header khác: nền xanh gradient và vạch nhấn xanh bên trái. Giữ nguyên tiêu đề, icon, mô tả và cấu trúc bảng.

</frozen-after-approval>

## Implementation Notes

- Đã làm rõ: người dùng muốn thanh tiêu đề phía trên bảng, không phải hàng tiêu đề cột; tham chiếu gradient xanh có vạch nhấn như header tab Kiểm tra trắc nghiệm.
- Chỉ sửa `.assessment-card-head` trong stylesheet của tab đánh giá; giữ nguyên tiêu đề, icon, mô tả và cấu trúc bảng.
- Dùng cùng gradient xanh, vạch nhấn xanh 5px và viền dưới như header Kiểm tra trắc nghiệm.
- Bo hai góc trên của header theo bán kính card; vạch nhấn bo góc trên trái để không vuông cạnh khung.
- Tiêu chí: header Luyện tập tại nhà hiển thị gradient xanh, vạch nhấn 5px; góc trên khớp card và nội dung header không đổi.
- `npm run build` chạy thành công; `git diff --check` không phát hiện lỗi.
- Kiểm tra trình duyệt tới `/` chỉ hiển thị trang đăng nhập; chưa thể kiểm tra màn hình học phần có xác thực trong phiên này. Đã rà soát selector CSS, gradient, vạch nhấn và bo góc đối chiếu header trắc nghiệm cùng component.

## Review Triage Log

- `low` — Đã bo góc trên của header và vạch nhấn để khớp khung card; lỗi này phát sinh do header gradient mới không có radius trong khi card cha không clip nội dung.
- `low` — Không có UI regression test cho CSS header; component không có spec hiện hữu, không đổi logic và build cùng rà soát selector CSS đã xác nhận declarations. Không tạo test harness mới cho thay đổi style thuần.
- `defer` — Review phát hiện ghi chú build bị lặp trong spec màu nút Bộ CTĐT; đó là thay đổi trước task này, đã được ghi nhận trong deferred-work và được giữ nguyên theo yêu cầu người dùng.
- `defer` — Review phát hiện thiếu UI test cho class màu nút Sửa của Bộ CTĐT; không thuộc thay đổi header hiện tại, giữ nguyên theo yêu cầu bảo toàn thay đổi trước đó.
