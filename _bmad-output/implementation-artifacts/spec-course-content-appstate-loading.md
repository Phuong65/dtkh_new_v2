---
title: 'Trạng thái AppState cho nội dung học phần chưa khởi tạo'
type: 'feature'
created: '2026-10-28'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['E:/New folder (3)/dtkh_new_v2/plans/quy_tắc_giao_dien.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab Nội dung hiện dùng `loading: boolean` và trạng thái rỗng dựa trực tiếp vào `list_plan`, nên chưa biểu đạt rõ tiến trình tải, lỗi tải và trạng thái “chưa khởi tạo nội dung”.

**Approach:** Chuyển trạng thái tải của `MonhocNoidungComponent` sang `AppState`, hiển thị `app-loading-progress` trong shell, giữ nguyên nhánh empty state và toàn bộ luồng tạo bài hiện có.

## Boundaries & Constraints

**Always:** Giữ nguyên API, form, phân quyền, drag-drop, payload, handler tạo bài, thông báo và UI đã style; dùng `AppState` cùng `app-loading-progress` sẵn có.

**Never:** Không thay đổi nghiệp vụ tạo/xóa/lưu bài, không thêm thư viện, không thay đổi service contract, không xóa empty state CTA.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Loading | Query có `code`, API đang tải | Hiển thị `app-loading-progress`, khóa/ngăn thao tác tạo nội dung | Giữ trạng thái loading đến khi tải xong |
| Empty | API thành công, không có kế hoạch bài học | Hiển thị empty state, CTA khởi tạo nội dung vẫn hoạt động | Không coi empty là lỗi |
| Success | API thành công, có kế hoạch | Hiển thị sidebar và vùng nội dung bình thường | Giữ lựa chọn/form hiện có |
| Error | API course/profile/plan/comment/CLO thất bại | Hiển thị lỗi + retry phù hợp | Tắt loading, không hiển thị CTA tạo sai ngữ cảnh |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.ts` -- trạng thái tải, `ngOnInit`, API `forkJoin`, `loadPlan`, thao tác tạo nội dung.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.html` -- shell sidebar, empty state, CTA khởi tạo, vùng hiển thị loading/error.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.css` -- style shell/loading/empty state hiện có.
- `src/app/core-new/models/app-state.ts` -- kiểu trạng thái dùng chung.
- `src/app/core-new/components/loading-progress/loading-progress.component.ts` -- component loading hiện hữu.

## Tasks & Acceptance

**Execution:**
- [ ] `monhoc-noidung.component.ts` -- thay boolean loading bằng `AppState`, cập nhật success/error/loading tại các điểm API hiện có -- biểu đạt trạng thái mà không đổi nghiệp vụ.
- [ ] `monhoc-noidung.component.html` -- render `app-loading-progress` khi AppState loading, render lỗi/retry khi error, giữ empty CTA khi success nhưng không có plan -- phân biệt rõ ba trạng thái.
- [ ] `monhoc-noidung.component.spec.ts` -- bổ sung test loading, success-empty, error và CTA -- ngăn hồi quy trạng thái.

**Acceptance Criteria:**
- Given tab Nội dung đang tải, when component render, then `app-loading-progress` hiển thị.
- Given tải thành công nhưng `list_plan` rỗng, when component render, then empty state và CTA khởi tạo vẫn hiển thị.
- Given API lỗi, when request kết thúc, then AppState là error, loading biến mất và trạng thái lỗi được hiển thị.
- Given có kế hoạch bài học, when tải thành công, then sidebar và content giữ nguyên hành vi hiện tại.

## Implementation Notes

1. Thay boolean `loading` bằng signal `state: AppState`, `loadingHeading` và `errorMessage`; getter `loading` chỉ giữ tương thích cho điều kiện CTA hiện hữu.
2. Tải dữ liệu khởi tạo được gom vào `loadContent(code)`: loading local bắt đầu trước request, success chỉ sau khi course/plan/CLO/thảo luận được nạp, lỗi render trong chính tab và có retry.
3. Giữ nguyên API, điều kiện khởi tạo bài, quyền `canAdded`, form, payload và luồng `loadPlan` sau thao tác nghiệp vụ.
4. Bổ sung `app-loading-progress`, error state và test loading/error/empty. Không thay đổi global processing của các thao tác save/delete/create cũ.

## Review Triage Log

- Review subagent không khởi chạy được do safety classifier không khả dụng; kiểm tra cục bộ bằng diagnostics, focused tests và AOT build.

## Verification

**Commands:**
- `ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.spec.ts"` -- expected: all tests pass.
- `ng build --configuration development --aot` -- expected: build succeeds.
