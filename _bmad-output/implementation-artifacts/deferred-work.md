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
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-home-practice-table-header-style.md`
  summary: Thêm kiểm thử UI cho màu nút Sửa Bộ CTĐT.
  evidence: Review phát hiện chưa có UI assertion cho class màu `ictu-button-info-light`; thay đổi class màu thuộc yêu cầu Bộ CTĐT trước đó, không thuộc chỉnh header Luyện tập tại nhà và được giữ nguyên theo yêu cầu người dùng.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-bo-ctdt-row-action-one-row-colors.md`
  summary: Loại bỏ ghi chú build và diff-check bị lặp trong spec màu nút.
  evidence: Review task border Form đề phát hiện hai dòng xác minh giống nhau trong spec Bộ CTĐT đã tồn tại; không sửa để bảo toàn thay đổi trước đó.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-bo-ctdt-row-action-one-row-colors.md`
  summary: Kiểm tra trực quan cột thao tác Bộ CTĐT trên màn hình hẹp.
  evidence: Review task border Form đề phát hiện thiếu kiểm tra trình duyệt cho bố cục một hàng trên mobile; không thuộc scope border Form đề và không thay đổi ở task này.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-formde-table-border-scope.md`
  summary: Xóa ghi chú xác minh bị lặp trong spec màu nút Bộ CTĐT.
  evidence: Review task này tiếp tục phát hiện ghi chú build và diff-check lặp trong spec Bộ CTĐT; không sửa tài liệu ngoài phạm vi để giữ nguyên thay đổi hiện có.
- source_spec: none
  summary: Chuẩn hóa nút Xem nhận xét và thêm đường phân cách phía trên trong các phần tab Nội dung.
  evidence: Tách khỏi yêu cầu hiển thị trạng thái dạng chữ để giới hạn thay đổi đầu tiên vào cách trình bày trạng thái.
- source_spec: none
  summary: Thu gọn footer drawer Thêm CPI.
  evidence: Đây là chỉnh sửa bố cục độc lập, không cần thiết để thống nhất cách hiển thị trạng thái.
- source_spec: none
  summary: Đổi nút chọn tệp sang kiểu success của core-new.
  evidence: Đây là chỉnh sửa giao diện upload độc lập với trạng thái duyệt ở sidebar và header.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-admin-feature-tooltips-left-single-line.md`
  summary: Khóa thao tác chọn môn học trong sidebar Bộ CTĐT theo quyền canSelectSubjects.
  evidence: Nút môn học vẫn có thể bật khi canSelectSubjects là false, trong khi toggleSubject bỏ qua thao tác; đây là thay đổi sidebar đã staged trước task tooltip.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-admin-feature-tooltips-left-single-line.md`
  summary: Hiển thị giải thích lỗi theo trường trong form cấu hình Bộ CTĐT.
  evidence: Form staged chỉ khóa nút lưu khi invalid mà không chỉ ra trường cần sửa; không phát sinh từ thay đổi tooltip.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-admin-feature-tooltips-left-single-line.md`
  summary: Bổ sung accessible name khi component PEO được nhúng.
  evidence: Header chứa bo-peo-title bị ẩn ở chế độ embedded trong khi aria-labelledby vẫn tham chiếu ID đó; đây là markup staged trước task tooltip.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-admin-feature-tooltips-left-single-line.md`
  summary: Bổ sung kiểm thử cho luồng sidebar cấu hình Bộ CTĐT.
  evidence: Spec sidebar staged yêu cầu kiểm thử navigation, quyền, save/error và embedded behavior nhưng thay đổi staged chưa gồm test tương ứng; ngoài phạm vi chỉnh tooltip.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-core-new-tooltip-style-location.md`
  summary: Đồng bộ trạng thái checklist trong spec sidebar Bộ CTĐT với phần triển khai đã staged.
  evidence: Review phát hiện task thực thi trong spec sidebar vẫn chưa được đánh dấu hoàn tất; tài liệu này có sẵn trước thay đổi vị trí CSS tooltip.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-default-elective-block.md`
  summary: Tạo empty marker khi xóa hết khối kiến thức từ tab Cấu hình CTĐT.
  evidence: `deleteConfig()` xóa khối cuối rồi tải lại; nếu không có `KHOI_KIEN_THUC_EMPTY`, tab sẽ hiển thị lại các khối mặc định. Đây là hành vi có sẵn, ngoài phạm vi chuẩn hóa mặc định cho CTĐT mới.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-ctdt-default-elective-block.md`
  summary: Làm rõ cách xử lý lưu cấu hình CTĐT khi một số request add/update thất bại.
  evidence: `saveConfig()` gửi nhiều request độc lập bằng `forkJoin`, nên request thành công có thể đã ghi dữ liệu dù request khác thất bại; đây là hạn chế có sẵn, cần thiết kế giao dịch/khôi phục riêng.

- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-course-content-exam-teachers.md`
  summary: Ho?n thi?n backend contract cho creator_exam_id g?m l?u, ??c l?i, b? ph?n c?ng b?ng null, ki?m quy?n v? th? t? tri?n khai.
  evidence: Review x?c nh?n frontend ch? g?i payload; backend ch?a ???c ki?m ch?ng v? n?m ngo?i ph?m vi n?y. C?n round-trip backend tr??c khi kh?ng ??nh ph?n c?ng ???c l?u b?n v?ng.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-course-content-exam-teachers.md`
  summary: X?c ??nh v? tri?n khai ri?ng quy?n truy c?p h?c ph?n c?ng c?c consumer bi?u m?u ?? cho gi?ng vi?n ph? tr?ch ??.
  evidence: Lu?ng hi?n t?i l?c h?c ph?n theo creator_plan_id v? m?t s? consumer bi?u m?u ?? c?ng d?ng creator_plan_id; thay ??i c?c l?c/lu?ng n?y n?m ngo?i goal hi?n t?i v? c? th? t?c ??ng quy?n truy c?p.
- source_spec: `E:\New folder (3)\dtkh_new_v2\_bmad-output\implementation-artifacts\spec-course-content-exam-teachers.md`
  summary: L?m cho c?p nh?t li?n k?t CT?T v? PUT h?c ph?n failure-atomic.
  evidence: Review x?c nh?n flow CT?T c? s?n x?a/th?m li?n k?t tr??c PUT n?n l?i ? b??c sau c? th? ?? l?i li?n k?t d? dang; thay ??i giao d?ch n?y kh?ng thu?c scope g?n gi?ng vi?n.
