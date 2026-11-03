- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Làm sạch dữ liệu CDR nhúng khi đổi CTĐT nhưng tải PEO thất bại.
  evidence: Review phát hiện `CtdtCdrComponent.ngOnChanges()` bỏ qua programme mới khi `peoRefreshKey` bằng 0; đây là lỗi state có sẵn, không phát sinh từ việc chia tab.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Mở khóa thao tác định hướng sau khi request tải lại thất bại.
  evidence: `orientationRefreshPending` có thể còn giữ sau lỗi refresh; đây là hành vi có sẵn, cần thiết kế retry/error state riêng.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Giữ draft tab Cài đặt khi chuyển sang tab ngoài khác.
  evidence: Parent đang dùng `@if` nên hủy component khi rời Cài đặt; yêu cầu hiện tại chỉ cam kết giữ DOM giữa bốn tab con, thay đổi parent cần phạm vi riêng.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-thuongxuyen-tracnghiem-header-style.md`
  summary: Bổ sung accessible name cho nút phân bổ câu hỏi CĐR.
  evidence: Review phát hiện nút chỉ có tooltip; đây là phần việc CĐR có sẵn, không thuộc chỉnh sửa header trắc nghiệm.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-thuongxuyen-tracnghiem-header-style.md`
  summary: Hoàn thiện ARIA cho thanh cuộn ngang ma trận CĐR.
  evidence: Review phát hiện role scrollbar chưa khai báo giá trị và vùng nội dung liên quan; đây là phần việc CĐR có sẵn, không thuộc chỉnh sửa header trắc nghiệm.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-thuongxuyen-tracnghiem-header-style.md`
  summary: Giữ focus bàn phím khi thu gọn hoặc mở sidebar CĐR.
  evidence: Review phát hiện nút đang focus bị ẩn mà không chuyển focus; đây là phần việc CĐR có sẵn, không thuộc chỉnh sửa header trắc nghiệm.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-thuongxuyen-tracnghiem-header-style.md`
  summary: Thể hiện trạng thái CĐR bắt buộc không chỉ bằng màu sắc.
  evidence: Review phát hiện trạng thái bắt buộc dùng màu để phân biệt; đây là phần việc CĐR có sẵn, không thuộc chỉnh sửa header trắc nghiệm.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-bo-ctdt-row-action-one-row-colors.md`
  summary: Xóa dòng ghi nhận kết quả build và diff-check bị lặp.
  evidence: Review phát hiện ghi chú xác minh bị lặp trong spec của thay đổi màu nút Bộ CTĐT; đây là tài liệu thuộc yêu cầu trước, không sửa trong phạm vi giảm viền bảng PEO/PLO.
