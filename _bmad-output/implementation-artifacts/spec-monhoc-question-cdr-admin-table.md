---
title: 'Làm mới giao diện ma trận câu hỏi CDR'
type: 'feature'
created: '2026-10-14'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'e9ab123df451f0ef510e7bf545a21ed8a0b5afc9'
review_loop_iteration: 0
context:
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html'
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css'
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.ts'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ma trận câu hỏi/CDR cần đồng bộ với khung bảng quản trị, trực quan hơn khi phân bổ số câu và vẫn giữ nguyên logic nghiệp vụ hiện tại.

**Approach:** Cập nhật presentation layer theo pattern `admin-wrap-table`, chuyển ô nhập sang PrimeNG directive `pInputText` nhưng giữ Input Group ba phần `[min ≤] [Input Số] [= tỷ lệ %]`. Dùng palette xanh dương semantic, spacing/radius/type scale compact, hover/focus rõ. Loading/error/reload được tách sang spec phụ; spec này chỉ xử lý giao diện bảng và input.

## Boundaries & Constraints

**Always:** Chỉ sửa component trong `course-management-detail/children/monhoc-question-cdr`. Giữ `[(ngModel)]`, `keyup`, `keydown`, `#inputNumberQuestion`, `type="number"`, thứ tự ba phần, Tab navigation và trạng thái dòng cảnh báo. Dùng đúng `admin-wrap-table` và `pInputText`; không dùng `admin-warp-table` hoặc tag `p-input`. Palette chính là xanh dương semantic trên nền sáng; addon xám xanh nhạt; warning đỏ chỉ dành cho invalid. Focus ring phải nhìn thấy; màu không là kênh duy nhất truyền trạng thái.

**Never:** Không thay công thức CDR, model, endpoint, quyền, luồng lưu, API hoặc sidebar; không thêm thư viện; không đổi TypeScript ngoài thay đổi tối thiểu cần thiết để gắn `pInputText`; không sửa component tương tự ngoài scope; không triển khai `AppState`, `app-loading-progress` hoặc error/reload trong story này.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Dữ liệu thành công | Danh sách CDR có thể chỉnh sửa | `admin-wrap-table` hiển thị bảng và toolbar; màu xanh dương đồng bộ | Giữ trạng thái rỗng hiện hữu |
| CDR editable | Input số có giá trị | Đúng `[min ≤] [input số] [= tỷ lệ %]`; `pInputText`; group liền khối | Không đổi validation |
| Hover/focus | Di chuột hoặc Tab vào input | Viền/nền phản hồi nhẹ, focus ring rõ, không layout shift | Không dùng hover duy nhất |
| CDR lỗi/disabled | `require_cdr` hoặc `cdr.disabled` | Màu đỏ/disabled thắng theme; behavior không đổi | Không che text cảnh báo |
| Viewport hẹp | Bảng co hoặc sidebar đóng/mở | Không tràn body; scroll bảng hiện hữu hoạt động | Không đổi layout nghiệp vụ |

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html` — layout trái/phải, `p-table`, toolbar và Input Group body; giữ toàn bộ binding/event.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css` — layout, table, Input Group, warning row; tổ chức lại màu/spacing/radius trong scope component.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.ts` — không thay logic load/save/tính toán; chỉ kiểm tra standalone imports để thêm `InputTextModule` nếu chưa có.
- `src/app/core-new/styles/ictu-admin-form.css:52-98` — định nghĩa `.admin-wrap-table`, `__head`, `__body`, `__foot`.
- `src/app/modules/admin/features/course-management/course-management.component.html:6,14,38,77` — pattern shell `admin-wrap-table`.
- `src/app/modules/admin/features/course-management/course-management.component.html:17-22` — pattern PrimeNG `pInputText`; repository không có tag `p-input`.

## Tasks & Acceptance

**Execution:**
- [x] `monhoc-question-cdr.component.html` — bọc presentation bằng `admin-wrap-table` pattern; đổi input sang `pInputText`; giữ Input Group ba phần và binding/event.
- [x] `monhoc-question-cdr.component.css` — thiết kế palette xanh dương, table density, padding, radius, font-size, hover/focus, warning/disabled override; selector scoped.
- [x] `monhoc-question-cdr.component.ts` — thêm `InputTextModule` nếu standalone component chưa import; không đổi logic nghiệp vụ.

**Acceptance Criteria:**
- Given bảng hiển thị, when dữ liệu thành công, then shell dùng đúng `admin-wrap-table` và không có `admin-warp-table`/`p-input`.
- Given CDR editable, when ô render, then giữ đúng `[min ≤] [input số] [= tỷ lệ %]`, input có `pInputText`, group không double border hoặc clipping.
- Given hover/focus/Tab, when trạng thái đổi, then feedback rõ, focus ring thấy được, không layout shift và không đổi giá trị.
- Given warning/disabled, when theme mới áp dụng, then màu đỏ/disabled và behavior hiện hữu được bảo toàn.
- Given nhập số/lưu/sidebar co, when handler/layout chạy, then ngModel, tỷ lệ, validation, save API, focus và scroll giữ nguyên.

## Implementation Notes

Đã tách state/loading/error thành spec phụ `spec-monhoc-question-cdr-state-loading.md`. Điều tra repo xác nhận tên đúng là `admin-wrap-table` và `pInputText`; `AppState`/`app-loading-progress` không thuộc scope story giao diện này.

## Design Notes

Dùng header xanh dương đậm vừa, body trắng, addon xanh-xám nhạt, input trắng; warning đỏ chỉ khi invalid. Bo góc ở shell và hai đầu Input Group; padding compact phù hợp bảng quản trị; focus ring không làm thay đổi kích thước.

## Verification

**Commands:**
- `npm run build` — expected: Angular build không lỗi template/TypeScript/CSS.
- `git diff --check` — expected: không có whitespace error.

**Manual checks:**
- Kiểm tra editable, disabled, warning, giá trị nhiều chữ số, Tab/focus, hover, viewport hẹp và sidebar đóng/mở; xác nhận số liệu/tỷ lệ/luồng Lưu không đổi.
