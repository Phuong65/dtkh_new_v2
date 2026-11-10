---
title: 'Tích hợp API mục tiêu chi tiết và CLO cho môn học mẫu'
type: 'feature'
created: '2026-11-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '1ee0eb14e9e03fcdc4e6212bcdd515c7c98a1570'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Màn hình cấu hình môn học mẫu đã có giao diện CO/CLO nhưng dữ liệu đang dùng sai tên thuộc tính, xử lý CRUD chưa hoàn chỉnh và kiểm thử vẫn giả định dữ liệu cục bộ. Vì vậy model và API `subject-muctieu-chitiet` / `subject-clo` chưa hoạt động ổn định từ tải dữ liệu đến thêm, sửa, xóa, sắp xếp và liên kết.

**Approach:** Chuẩn hóa màn hình theo hai model `SubjectMuctieuChitiet` và `SubjectClo`, dùng hai service hiện có làm nguồn dữ liệu thật. Hoàn thiện vòng đời CRUD, đồng bộ thứ tự/ký hiệu, liên kết mỗi CLO với một CO và cập nhật kiểm thử bằng mock API.

## Boundaries & Constraints

**Always:** Giữ nguyên UI/sidebar đang có; lọc dữ liệu bằng `subject_id`; hiển thị `kyhieu`/`noidung`; mọi thao tác CO/CLO phải phản ánh kết quả API; báo trạng thái tải/lỗi rõ ràng; giữ các thay đổi chưa commit của người dùng.

**Never:** Không hoàn tác hoặc viết lại các phần thông tin chung, tài liệu, đề cương; không dùng API `course-*`; không bổ sung backend, migration hoặc API mới; không commit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tải dữ liệu | Mở cấu hình một Subject có `id` | Gọi đồng thời hai API với `subject_id`, sắp xếp theo `ordering`, hiển thị CO/CLO đúng model | Giữ màn hình hoạt động, hiện thông báo lỗi phù hợp, kết thúc loading |
| Thêm CO/CLO | Subject hợp lệ | POST bản ghi có `subject_id`, `ordering`, `kyhieu`, `noidung`; thêm response vào bảng | Không thêm bản ghi giả; thông báo thao tác thất bại |
| Sửa nội dung | Người dùng chỉnh `noidung` | PUT bản ghi tương ứng; UI giữ dữ liệu server trả về | Giữ dữ liệu có thể sửa lại; báo lỗi |
| Sắp xếp | Kéo thả hàng | PUT lại `ordering` và `kyhieu` tuần tự cho các hàng bị ảnh hưởng | Báo lỗi và tải lại dữ liệu server để tránh lệch trạng thái |
| Xóa CO | CO đang được CLO tham chiếu | DELETE CO; CLO liên quan hiển thị liên kết rỗng sau khi dữ liệu đồng bộ | Nếu API từ chối, giữ nguyên bảng và báo lỗi |
| Liên kết CLO–CO | Chọn hoặc bỏ chọn một CO | PUT `subject_muctieu_chitiet_id`; ma trận phản ánh response | Khôi phục liên kết trước đó khi lỗi |

</frozen-after-approval>

## Code Map

- `src/app/modules/shared/models/subject-muctieu-chitiet.ts` -- Model CO chuẩn: `subject_id`, `ordering`, `kyhieu`, `noidung`.
- `src/app/modules/shared/models/subject-clo.ts` -- Model CLO chuẩn, gồm khóa liên kết `subject_muctieu_chitiet_id`.
- `src/app/modules/shared/services/subject-muctieu-chitiet.service.ts` -- CRUD endpoint `subject-muctieu-chitiet/`; hiện import sai tên model `SubjectMuctieuChitietV2`.
- `src/app/modules/shared/services/subject-clo.service.ts` -- CRUD endpoint `subject-clo/` và truy vấn phân trang/điều kiện.
- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.ts` -- Đã inject hai service nhưng thiếu quản lý subscription, trạng thái thao tác, lưu nội dung và đồng bộ reorder.
- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.html` -- Đang bind `code`, `content`, `goalId`, không khớp model/API.
- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.spec.ts` -- Kiểm thử cũ giả định CRUD cục bộ; cần mock hai service và kiểm tra payload/luồng lỗi.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-muctieu-cdr/monhoc-muctieu-cdr.component.ts` -- Tham khảo `condition`, `request`, `loadData`, `runOperation`, đánh lại thứ tự; không sao chép API `course-*`.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/modules/shared/services/subject-muctieu-chitiet.service.ts` -- sửa type import/signature để service biên dịch đúng với model hiện có.
- [x] `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.ts` -- hoàn thiện tải song song, CRUD, lưu nội dung, reorder, liên kết, teardown và trạng thái lỗi/loading.
- [x] `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.html` -- bind đúng `kyhieu`, `noidung`, `subject_muctieu_chitiet_id`; khóa thao tác cần thiết khi loading/saving; bỏ ghi chú “chưa lưu”.
- [x] `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.spec.ts` -- mock service; kiểm tra tải, payload thêm/sửa/xóa/reorder/liên kết và lỗi.
- [x] Chạy kiểm tra TypeScript/build và test mục tiêu; sửa lỗi chỉ trong phạm vi tích hợp này.

**Acceptance Criteria:**
- Given một Subject hợp lệ, when mở cấu hình, then CO/CLO từ hai API xuất hiện đúng thứ tự và đúng trường model.
- Given người dùng thêm, sửa, kéo thả, xóa hoặc liên kết CO/CLO, when API thành công, then giao diện đồng bộ với dữ liệu trả về và ký hiệu/thứ tự liên tục.
- Given API bất kỳ thất bại, when thao tác kết thúc, then loading/saving được tắt, dữ liệu không giả thành công và người dùng nhận thông báo lỗi.
- Given component bị đóng hoặc đổi Subject, when request cũ còn chạy, then subscription cũ không ghi dữ liệu vào Subject mới.

## Implementation Notes

- Đã chuẩn hóa service CO sang `SubjectMuctieuChitiet`, binding CO/CLO sang `kyhieu`, `noidung`, `subject_muctieu_chitiet_id`.
- Tải song song bằng `forkJoin`; cancellation/version guard khi thay Subject hoặc đóng component.
- Mutation dùng khóa `isSaving`, xử lý lỗi rõ ràng; xóa/reorder/thêm thất bại sẽ tải lại để đồng bộ trạng thái server.
- Editor hỗ trợ lưu khi blur hoặc nút Lưu, nút Hủy; khóa input trong lúc lưu, giữ bản nháp khi API lưu lỗi.
- Loại bỏ đọc `value.muctieu` vì model `Subject` hiện tại không có trường này; mục tiêu chung vẫn là bản nháp cục bộ.
- Không commit, không gọi API thật trong test.

## Spec Change Log

- 2026-11-08: Sửa Code Map sang component tham khảo thực tế thuộc `course-management/course-management-detail/children/monhoc-muctieu-cdr`.

## Review Triage Log

| Finding | Verdict | Action |
|---------|---------|--------|
| POST có thể thành công ở server nhưng response thất bại, khiến danh sách và thứ tự bị lệch khi thử lại | medium | Đã sửa: reconcile qua tải lại dữ liệu khi thêm CO/CLO lỗi |
| Review subagent không thấy file mới trong worktree riêng | limitation | Reviewer đọc các file tuyệt đối trong workspace chính; không sửa file |

## Verification

**Commands:**
- `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.spec.ts"` -- PASS: 21/21 tests, exit code 0.
- `npm run build` -- PASS: Angular AOT production build, exit code 0.
- `git diff --check` -- PASS; chỉ cảnh báo LF/CRLF có sẵn.
- VS Code diagnostics cho component TS/HTML/spec -- không có lỗi.

**Limitations:** Chưa chạy kiểm thử giao diện trên backend thật; chưa kiểm chứng contract phản hồi CRUD và xử lý khóa ngoại của server bằng integration test.
