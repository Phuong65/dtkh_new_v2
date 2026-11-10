---
title: 'Đồng bộ trạng thái lưu và loading cho cấu hình môn học mẫu'
type: 'bugfix'
created: '2026-11-09'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '1ee0eb14e9e03fcdc4e6212bcdd515c7c98a1570'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mọi request trong màn hình cấu hình môn học mẫu chưa hiển thị `app-loading-progress`. Sau khi PUT CO/CLO thành công, UI có thể quay về nội dung cũ dù backend đã lưu giá trị mới, khiến trạng thái hiển thị không phản ánh server.

**Approach:** Dùng một overlay loading thống nhất cho tải và mọi mutation. Khi PUT thành công, coi payload gửi đi cộng với response hợp lệ là nguồn dữ liệu mới; không GET lại ngay sau lưu và không cho response rỗng/partial ghi đè trường vừa lưu.

## Boundaries & Constraints

**Always:** Loading che đúng vùng cấu hình; mỗi request tăng/giảm trạng thái an toàn; nội dung vừa lưu phải còn trên UI; lỗi giữ draft để thử lại; request cũ không ghi vào Subject mới.

**Never:** Không sửa backend; không dùng delay giả; không gọi lại API GET chỉ để cập nhật UI sau một PUT thành công; không xóa thay đổi chưa commit; không commit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tải CO/CLO | Mở Subject | Hiện loading-progress đến khi hai GET kết thúc | Tắt overlay, hiện lỗi/tải lại |
| Lưu Subject | PUT `subjects/{id}` | Overlay hoạt động; response/payload cập nhật header và form | Giữ form, tắt overlay, báo lỗi |
| Lưu CO/CLO | PUT thành công, response full/partial/rỗng | Overlay hoạt động; UI giữ nội dung payload mới, không reset | Không xóa draft chưa lưu |
| Thêm/xóa/reorder/link | POST/DELETE/PUT đang chạy | Overlay hoạt động xuyên suốt chuỗi request | Tắt overlay ở mọi nhánh; reconcile khi trạng thái server không chắc chắn |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.ts` -- trạng thái request, merge PUT response, draft và mutation CO/CLO.
- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.html` -- hiện chỉ dùng text `role=status`, cần `app-loading-progress`.
- `src/app/core-new/components/loading-progress/loading-progress.component.ts` -- overlay chuẩn; host absolute nên container phải `position-relative`.
- `src/app/modules/shared/services/subject-muctieu-chitiet.service.ts` -- PUT map `response.data`, có thể không bảo đảm full entity.
- `src/app/modules/shared/services/subject-clo.service.ts` -- cùng response contract CO.
- `src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.spec.ts` -- mock success/error và kiểm chứng payload mới không bị reset.

## Tasks & Acceptance

**Execution:**
- [ ] `subject-template-detail.component.ts` -- thêm trạng thái/heading loading thống nhất; merge payload với entity hiện tại và response; bỏ reload sau save thành công.
- [ ] `subject-template-detail.component.html` -- import/render `LoadingProgressComponent` cho load và mọi API mutation.
- [ ] `subject-template-detail.component.spec.ts` -- test overlay từng API, response full/partial/rỗng, lỗi và request cũ.
- [ ] Chạy test mục tiêu/build/diff check.

**Acceptance Criteria:**
- Given PUT CO/CLO trả response cũ, partial hoặc rỗng, when save thành công, then UI vẫn hiển thị chính xác nội dung payload vừa gửi.
- Given bất kỳ request nào đang chạy, when quan sát màn hình, then có loading-progress và thao tác xung đột bị khóa.
- Given request lỗi hoặc bị hủy do đổi Subject, when kết thúc, then overlay tắt đúng và không ghi dữ liệu cũ.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/admin/features/subject-management/subject-template-detail/subject-template-detail.component.spec.ts"` -- expected: all target tests pass.
- `npm run build` -- expected: Angular build succeeds.
- `git diff --check` -- expected: no whitespace errors.
