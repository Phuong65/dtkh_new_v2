---
title: 'Giảng viên nội dung và đề học phần'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'dispatch'
baseline_commit: '60a32cbc985189179b519d5c303ea4fd268ab04c'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Người dùng xác nhận `creator_plan_id` dành cho giảng viên phụ trách nội dung. Thêm field top-level `creator_exam_id?: number | null` cho giảng viên phụ trách đề tại Course Management Detail → Thông tin chung. Hai dropdown độc lập, được chọn cùng người hoặc bỏ chọn; tóm tắt hiển thị tên/email của từng vai trò.

## Boundaries & Constraints

**Always:** Giữ dữ liệu `creator_plan_id`, quyền `canAssignTeacher`, form/grid/loading hiện có. Tái sử dụng danh sách `teacher=1` và `UserService.getUser`. Course cũ thiếu field đề coi là chưa phân công. ID được chuẩn hóa số nguyên dương hoặc null; không có quyền hoặc không đổi thì không gửi assignment field. Lỗi lưu giữ draft, tắt loading; lookup lỗi giữ ID/nhãn dự phòng. Response cũ không cập nhật course mới. Người dùng đã duyệt kế hoạch và giữ thay đổi hiện có.

**Never:** thêm backend/SQL, relation `creatorExam` chưa có contract, đổi quyền/filter các tab nội dung/form đề, ghi API thật, commit, install package, tạo worktree. Làm trực tiếp trong workspace hiện tại `E:/New folder (3)/dtkh_new_v2`, không sửa bản `quanly-monhoc` legacy hoặc các thay đổi tab-title/sidebar/cursor ngoài phạm vi.

Backend phải bổ sung nhận/lưu/trả `creator_exam_id` và kiểm quyền phía server. Đây là contract frontend mới đã được duyệt, không phải backend đã triển khai. Không retry bằng bỏ field khi API từ chối.

## I/O & Edge-Case Matrix

| Trường hợp | Kết quả |
|---|---|
| Course cũ chỉ có creator_plan_id | Giữ GV nội dung, GV đề null |
| Hai ID khác nhau hoặc trùng nhau | Hai ô và tóm tắt đúng vai trò, cùng danh sách options |
| GV đang gán ngoài options | Lookup getUser, thêm option ID số; lỗi giữ nhãn Giảng viên #ID |
| Có quyền thay đổi/bỏ chọn | PUT top-level ID số/null, chỉ assignment đã thay đổi |
| Không quyền/form bị sửa bằng code | Không gửi cả hai assignment fields |
| Không đổi assignment | Không gửi field mới rỗng về backend cũ |
| PUT thất bại | Giữ draft, tắt loading, báo lỗi |
| Giá trị form thay đổi sau submit | Response thành công cập nhật model bằng payload đã gửi, không lấy draft mới |
| Đổi course trong lúc GET/lookup chờ | Không ghi tên/options/form/state từ course cũ sang mới |

</frozen-after-approval>

## Code Map

Đường dẫn dưới tính từ workspace gốc.
- `src/app/modules/shared/models/elng-khoa-hoc.ts`: thêm optional creator_exam_id cạnh creator_plan_id; không relation mới.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.ts`: formKhoaHoc, listGiangvien/canAssignTeacher, quickInfoContentTeacher/quickInfoExamTeacher, loadCourse, hydrateAssignedTeachers, editKhoaHoc, saveCourse. Tách dữ liệu hai vai trò, chuẩn hóa ID/options và dùng chung lookup theo ID; dùng request version để chặn response load/lookup cũ, snapshot payload/course trước await save, giữ nguyên payload params và nghiệp vụ CTĐT.
- `.../monhoc-thongtin.component.html`: teacher block ~97, overview teacher ~349; đổi nhãn nội dung, thêm ô đề cạnh ô nội dung bằng mh-field hiện có, hai overview rows. Filter/showClear/permission-help giữ đủ ARIA.
- `.../monhoc-thongtin.component.css`: reuse mh-fields/mh-field responsive, không cần sửa nếu đã đủ.
- `src/app/modules/shared/services/elearning-khoa-hoc.service.ts`: updateElnKhoaHoc truyền body nguyên tới PUT courses/{id}; không cần sửa.
- `src/app/modules/shared/components/ovic-dropdown/ovic-dropdown.component.ts`: ID equality và showClear; tham khảo, không sửa.

## Tasks & Acceptance

- [x] Model field creator_exam_id optional nullable.
- [x] Form/hydrate/lookup/tóm tắt hai vai trò; không lẫn dữ liệu course khác.
- [x] Save chỉ gửi assignment có quyền và thực sự thay đổi; normalize ID/null; success theo snapshot; error giữ draft.
- [x] Hai dropdown và summary cùng style, không đổi nghiệp vụ tab khác.
- [x] Thêm `monhoc-thongtin-teachers.component.spec.ts` cho matrix, mock mọi API. Suite presentation cũ có expectations về section CTĐT đã comment và có thể thiếu mock UserService; không sửa unrelated expectation cho khớp. Chạy focused spec mới, build và diff-check.

**Acceptance Criteria:** Given tab Thông tin chung, when mở/lưu, then giảng viên nội dung và đề tách biệt theo field đúng; Given user không quyền, when sửa form bằng code, then payload không đổi phân công; Given request cũ, when course đổi, then không lẫn tên/ID.

## Implementation Notes

Frontend gửi `creator_exam_id` top-level theo contract; backend vẫn cần nhận/lưu/trả field này và kiểm quyền phía server.

Đã kiểm tra lại ngày 2026-11-19: focused spec **10/10 test đạt**, gồm course cũ thực sự thiếu `creator_exam_id` và hai trường không chiếm toàn hàng ở màn rộng. Angular AOT build thành công, diagnostics mục tiêu không lỗi và `git diff --check` không phát hiện lỗi whitespace. Lệnh npx ban đầu thoát mã 1 không ghi lỗi; chạy trực tiếp CLI cục bộ bằng node thành công, không cài dependency.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route and evidence |
|---|---|---|
| Backend chưa lưu/trả `creator_exam_id` | medium | defer — Phạm vi này chỉ thêm frontend; service truyền body PUT, backend support là prerequisite chưa xác minh. |
| Thiếu kiểm quyền phía server | medium | defer — Kiểm quyền server nằm ngoài thay đổi frontend và được ghi rõ là trách nhiệm backend. |
| Ngữ nghĩa `null` khi bỏ phân công chưa xác minh | maybe-false | defer — Chưa có backend round-trip để xác nhận null được lưu như bỏ phân công. |
| Giảng viên chỉ được gán đề không qua filter course hiện tại | medium | defer — Query hiện lọc `creator_plan_id`; sửa lọc/quyền nằm ngoài goal hiện tại và bị giới hạn scope. |
| Luồng biểu mẫu đề vẫn tra giảng viên qua `creator_plan_id` | medium | defer — Các consumer của form đề nằm ngoài thay đổi trang Thông tin chung; spec giữ nguyên hành vi các tab đó. |
| Liên kết CTĐT có thể cập nhật dở dang nếu insert/PUT lỗi (Blind Hunter) | medium | defer — Xóa/thêm liên kết trước PUT là flow CTĐT có sẵn; spec yêu cầu giữ flow và không tái cấu trúc nghiệp vụ này. |
| Liên kết CTĐT có thể mất một phần khi thao tác lưu thất bại (Edge Case Hunter) | medium | defer — Cùng rủi ro atomicity đã có trong flow CTĐT; xử lý cần thay đổi giao dịch ngoài scope. |
| Test chưa xác nhận backend persistence/readback | maybe-false | defer — API được mock theo spec và không gọi API thật; round-trip cần backend đã triển khai. |
| Thứ tự deploy frontend/backend chưa xác định | medium | defer — Backend support là prerequisite; rollout coordination nằm ngoài code frontend này. |
| Không có kiểm thử tích hợp cho field mới | maybe-false | defer — Verification Gap xác nhận test mock chỉ chứng minh payload; cần backend contract test sau khi backend sẵn sàng. |

## Verification

- `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin-teachers.component.spec.ts"`
- `npm run build`
- `git diff --check`
- Không gọi API thật; chưa xác minh backend hỗ trợ field mới.
