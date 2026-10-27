- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Làm sạch dữ liệu CDR nhúng khi đổi CTĐT nhưng tải PEO thất bại.
  evidence: Review phát hiện `CtdtCdrComponent.ngOnChanges()` bỏ qua programme mới khi `peoRefreshKey` bằng 0; đây là lỗi state có sẵn, không phát sinh từ việc chia tab.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Mở khóa thao tác định hướng sau khi request tải lại thất bại.
  evidence: `orientationRefreshPending` có thể còn giữ sau lỗi refresh; đây là hành vi có sẵn, cần thiết kế retry/error state riêng.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-settings-subtabs.md`
  summary: Giữ draft tab Cài đặt khi chuyển sang tab ngoài khác.
  evidence: Parent đang dùng `@if` nên hủy component khi rời Cài đặt; yêu cầu hiện tại chỉ cam kết giữ DOM giữa bốn tab con, thay đổi parent cần phạm vi riêng.
