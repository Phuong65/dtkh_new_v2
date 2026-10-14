---
title: 'Bổ sung trạng thái tải và lỗi cho ma trận CDR'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: 'e9ab123df451f0ef510e7bf545a21ed8a0b5afc9'
review_loop_iteration: 0
context:
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html'
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.ts'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ma trận câu hỏi/CDR chưa có state presentation thống nhất cho loading, success và lỗi tải. Người dùng cần thấy tiến trình rõ và có thể tải lại khi request lỗi.

**Approach:** Áp dụng pattern hiện hữu của course-management/monhoc-formde: signal cục bộ kiểu `AppState`, `app-loading-progress` khi loading, và `admin-table__alert-danger` với `errorMessage()` cùng `reloadData()` khi lỗi. Không đổi API, dữ liệu hoặc logic nghiệp vụ CDR.

## Boundaries & Constraints

**Always:** Dùng `AppState = 'loading' | 'error' | 'success'`, Angular signals và `LoadingProgressComponent`. Mọi request tải dữ liệu phải rời `loading` ở cả success lẫn error. Error UI dùng đúng pattern: `<div class="admin-table__alert-danger text-center w-100">{{ errorMessage() }} <a (click)="reloadData()" href="javascript:" class="admin-table__alert-danger__btn-reload">Tải lại</a></div>`. `reloadData()` gọi lại luồng tải hiện hữu, không nhân đôi logic.

**Never:** Không tạo AppStateService toàn cục; không thêm endpoint, thay payload, công thức CDR hoặc save flow; không đổi giao diện bảng/Input Group ngoài phần render theo state; không để loading overlay treo sau lỗi. Không yêu cầu viết lại hành vi điều hướng hoặc cảnh báo đối với course không hợp lệ/không có quyền.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Khởi tạo/tải lại | State `loading` | `app-loading-progress` hiển thị; dữ liệu nửa chừng không render | Kết thúc ở success/error |
| Tải thành công | Request trả dữ liệu | State `success`; ma trận hiển thị | Giữ dữ liệu/logic hiện hữu |
| Tải lỗi | Request lỗi | State `error`; thông báo từ `errorMessage()` và link `Tải lại` | `reloadData()` chạy lại request |
| Code học phần sai | Thiếu/không hợp lệ | Error message rõ hoặc điều hướng hiện hữu | Không crash template |
| Retry thành công | Lần đầu lỗi, lần sau thành công | Loading → success; error cũ được xoá | Không gửi request song song ngoài ý muốn |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.ts` — `ngOnInit`, request lấy course, `loadCDRCauhoi`; thêm `state`, `errorMessage`, `reloadData` và imports, tái sử dụng luồng tải.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html` — thêm nhánh loading/error/success; error markup đúng pattern đã chốt.
- `src/app/core-new/models/app-state.ts:1-8` — type `AppState`.
- `src/app/core-new/components/loading-progress/loading-progress.component.ts:6-36` — `LoadingProgressComponent`, selector `app-loading-progress`.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-formde/monhoc-formde.component.html:2-10` và `.ts:155,377-402` — pattern `state()`, `errorMessage()`, `reloadData()` được người dùng chọn.

## Tasks & Acceptance

**Execution:**
- [x] `monhoc-question-cdr.component.ts` — import `AppState`, signal APIs, `LoadingProgressComponent`; thiết lập loading/success/error; thêm `errorMessage()` và `reloadData()` bằng cách tái sử dụng luồng load.
- [x] `monhoc-question-cdr.component.html` — render `app-loading-progress`, error block đã chốt, và nội dung ma trận khi success.
- [ ] Component scope — kiểm tra initial load, load lỗi, retry lỗi, retry thành công, route code không hợp lệ.

**Acceptance Criteria:**
- Given component bắt đầu tải, when request chưa hoàn tất, then `app-loading-progress` hiển thị và bảng chưa render dữ liệu nửa chừng.
- Given request thành công, when callback hoàn tất, then state là `success`, loading biến mất và ma trận hiển thị như trước.
- Given request lỗi, when error callback chạy, then state là `error`, `errorMessage()` có nội dung và link `Tải lại` xuất hiện.
- Given error UI, when nhấn `Tải lại`, then `reloadData()` chuyển về loading và gọi lại đúng luồng request hiện hữu.
- Given retry thành công, when dữ liệu về, then error cũ bị xoá, state là success và không còn overlay.
- Given code không hợp lệ/quyền không phù hợp, when logic hiện hữu xử lý, then không crash hoặc làm sai điều hướng/thông báo hiện tại.

## Implementation Notes

Tách từ spec giao diện `spec-monhoc-question-cdr-admin-table.md`. Story này độc lập về state management nhưng nên triển khai sau hoặc cùng nhánh với story giao diện để tránh xung đột template. Không thay CSS theme/Input Group.

## Review Triage Log

- Đã sửa: callback lỗi tải học phần thiếu kiểm tra requestId, có thể ghi đè trạng thái của request mới.
- Đã sửa: thiếu code trên route chưa vô hiệu hóa request đang chạy; bổ sung tăng loadRequestId, xoá courseId và kết thúc processing/loading trước điều hướng.
- Đã chỉnh: khởi tạo state là loading, không phải success. Chưa có bằng chứng browser về nháy giao diện trước ngOnInit.

## Kết quả triển khai

Đã thêm AppState, app-loading-progress, errorMessage và reloadData đúng markup được duyệt. Nhánh tải học phần và ma trận có success/error cùng guard requestId. Không thay CSS của spec 1 hoặc công thức CDR. Build sau sửa review thành công. Chưa chạy test hành vi/browser cho toàn bộ ma trận; giữ trạng thái in-review, chưa xác nhận mọi acceptance criterion hoàn tất.

## Verification

**Commands:**
- `npm run build` — expected: Angular build không lỗi.
- `git diff --check` — expected: không có whitespace error.

**Manual checks:**
- Mô phỏng success/error/retry; kiểm tra loading không treo, error text hiển thị, link tải lại hoạt động, dữ liệu và save flow không đổi.
