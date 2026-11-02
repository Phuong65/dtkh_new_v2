---
title: 'Hoàn thiện drawer CPI và thẻ nhận xét'
type: 'bugfix'
created: '2026-10-31'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Vấn đề:** Hoàn tất phần giao diện đang làm dở: drawer CPI không hiển thị badge số; Nội dung giảng dạy thêm bằng nút thay vì phím Tab. Người dùng bổ sung yêu cầu bỏ viền xanh của thẻ bao nút xem nhận xét.

**Cách xử lý:** Chia thành ba phần nhỏ: xác nhận bỏ badge trong drawer; hoàn thiện và kiểm thử chế độ nút Thêm nội dung; bỏ border của `.nx-shell`. Giữ các thay đổi chưa commit, hành vi Tab mặc định ở nơi khác, chức năng xem/ẩn/phản hồi nhận xét và focus của các nút. Người dùng đã cho phép tiếp tục trên working tree hiện tại.

</frozen-after-approval>

## Implementation Notes

- Phạm vi nhỏ, không thay API, dữ liệu lưu, cấu hình hay triển khai. Không còn lựa chọn cần hỏi người dùng.
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.html`: đã bỏ hai badge mục 01/02, bật `[addByButton]="true"` cho `desc_cpi`.
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.css`: đã xóa rule CSS `.cdr-form-section__index` không còn sử dụng.
- `src/app/modules/shared/components/list-editor/list-editor.component.{ts,html,css}`: nút thêm nội dung riêng, không dùng Tab để thêm trong chế độ nút; vá lỗi paste không ghi đè mục cuối đã lưu.
- `src/app/modules/shared/components/list-editor/list-editor.component.spec.ts`: bổ sung bộ test kiểm tra nút thêm, dán danh sách không đè, focus và chế độ Tab mặc định (8/8 pass).
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.spec.ts`: cập nhật kiểm thử cấu trúc drawer CPI và directive `ListEditorComponent` (6/6 pass).
- `src/app/modules/admin/features/course-management/course-management-detail/children/nhanxet-noidung/nhanxet-noidung.component.css`: bỏ viền `.nx-shell` theo yêu cầu bổ sung của người dùng.
- `tsc -p tsconfig.app.json --noEmit` hoàn thành không lỗi.

## Review Triage Log

- finding 1 (high): `openReply()` và nút bị disabled khi `count_reply = 0` → fixed (cho phép mở để gửi phản hồi đầu tiên).
- finding 2 (high): `onPaste()` ghi đè dòng cuối khi dùng chế độ button → fixed (nối thêm phần tử khi dòng cuối không rỗng, chỉ dùng dòng cuối nếu rỗng).
