---
title: 'Đồng bộ giao diện Thông tin học phần'
type: 'feature'
created: '2026-10-20'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'f63cb2d851dd84435b90a370e1a8d9f5462b1716'
review_loop_iteration: 0
context:
  - 'plans/quy_tắc_giao_dien.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab Thông tin học phần thuộc course-management khác hệ giao diện CTĐT: thanh điều hướng trái, gradient/viền bo lớn, CTA cuối trang, thiếu phản hồi lỗi gần field. Khó theo dõi trạng thái form và thiếu đồng nhất trên màn nhỏ.

**Approach:** Áp dụng quy tắc trong `plans/quy_tắc_giao_dien.md`: bố cục form chính bên trái, aside trạng thái/Lưu/tóm tắt bên phải và sáu nhóm nội dung dạng card; không thêm menu phụ truy cập từng phần. Giữ nguyên toàn bộ dữ liệu, phân quyền, callback component con và luồng lưu.

## Boundaries & Constraints

**Always:** Chỉ sửa `course-management/.../monhoc-thongtin`; giữ nguyên thứ tự sáu section, liên kết CTĐT/khối kiến thức, radio, hai editor và file/link, tải lỗi/retry, thông báo toast. Giữ các quyền riêng từng field. Áp dụng token primary `#2563eb`, border 1px, radius 4px; responsive 960/640/560px; label, focus, keyboard, touched errors.

**Never:** Không sửa bản `quanly-monhoc`, shared CSS/component, route/tab cấp trang, API, cấu trúc payload, logic xóa/tạo liên kết CTĐT hay file RAR không theo dõi. Không chạy thao tác save thật để kiểm thử nếu không có dữ liệu thử được phép.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tải thành công | `code` hợp lệ | Hiển thị đủ sáu card, aside và metadata; field đúng quyền | Không ghi dữ liệu cho đến khi lưu |
| Required chưa đủ | Một trong tên/mã/khoa/tín chỉ/TC thực hành trống | Save disabled, lỗi xuất hiện sau touched | Không gọi API |
| Chọn CTĐT | Thêm/bỏ CTĐT và chọn khối kiến thức | Bảng/empty cập nhật; dữ liệu được giữ khi đổi editor | Quy tắc validate CTĐT hiện hữu được giữ |
| Loading/save/error | Request đang chạy hoặc lỗi | Overlay đúng vùng, khóa save lặp, error + nút retry | Không mất form do thay đổi UI |
| Thiết bị hẹp | 960/640/560/375px | Main/aside xếp dọc, field một cột, bảng cuộn trong vùng riêng | Không tràn viewport |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.html` — form sáu section, rail trái, nút save cuối, Ovic/PrimeNG, permission, trạng thái; tái bố cục nhưng giữ binding.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.css` — style riêng ~1470 dòng đa sắc; rút về CTĐT form/card/aside và responsive.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.ts` — `state`, `isSaving`, `scrollToSection`, `activeDescTab`, `saveCourse`; chỉ bổ sung xử lý UI tối thiểu, tránh đổi logic nghiệp vụ.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.{html,css}` — shell 64px/tab đã tồn tại; không sửa.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-thongtin/ctdt-thongtin.component.{html,css}` — mẫu card/grid/aside/editor để tham chiếu, không sửa.
- `src/app/core-new/styles/ictu-admin-form.css` và `ictu-buttons.css` — reuse `admin-table`, `ictu-admin-table-scroll`, `ictu-badge-btn--primary-reverse`.
- `src/app/modules/shared/components/ovic-dropdown/ovic-dropdown.component.ts` — wrapper select không hỗ trợ inputId/ariaLabelledBy; giữ, dùng group label ở wrapper.

## Tasks & Acceptance

**Execution:**
- [x] `.../monhoc-thongtin.component.html` — sắp form thành main/aside, sáu card thống nhất, input/error ARIA, bảng CTĐT shared có border và retry button; không có menu phụ.
- [x] `.../monhoc-thongtin.component.css` — loại style đa sắc/gradient, áp token CTĐT; bố cục desktop/mobile, focus/reduced-motion, Ovic overrides scoped và border bảng.
- [x] `.../monhoc-thongtin.component.ts` — giữ `saveCourse` và các quyền/binding hiện có; loại bỏ trạng thái/cuộn mục lục không còn dùng.
- [x] `.../monhoc-thongtin.component.spec.ts` — test isolated cho trạng thái invalid/saving, tab/CTĐT/retry nếu mocks khả thi.

**Acceptance Criteria:**
- Given tab Thông tin học phần được tải, when xem desktop, then nội dung main/aside và sáu section theo đúng thứ tự, một nút save cùng status rõ ràng.
- Given màn hình hẹp, when xem tại các breakpoint, then không tràn ngang trang; bảng cuộn trong container riêng, không có menu phụ.
- Given control required đã touched và invalid, when hiển thị, then có lỗi gần field và aria-invalid/aria-describedby; save không gửi request.
- Given quyền chỉnh field khác nhau, when mở với từng role, then trạng thái disabled giữ nguyên trước/sau thay giao diện.

## Implementation Notes

- Đã thay layout thành main/aside, sáu card cùng token, editor 240px, bảng `admin-table` có border từng ô và retry button; không có menu phụ từng phần.
- Desktop main và aside cuộn riêng; ≤960px dùng một vùng cuộn `.mh-shell`, aside sau main.
- Giữ nguyên API, payload và nghiệp vụ `saveCourse`/quan hệ CTĐT. Trong test, `[attr.disabled]` của input bị Reactive Forms ghi đè; đã dùng `readonly` cho bốn trường định danh/tín chỉ với cùng điều kiện quyền, vẫn giữ dữ liệu trong form.
- Form `inert` khi saving để không chỉnh sửa trong request; overlay vẫn hiển thị ngoài form.
- `npm run build`: PASS sau khi sửa TS2347; `git diff --check`: PASS.
- 15 unit test mục tiêu chạy ChromeHeadless: PASS. Bao gồm sáu section, required/touched, save single submit/disabled, retry, CTĐT/editor state, quyền readonly, scroll container desktop/mobile.
- Chưa kiểm tra visual thực tế/breakpoint trong app đăng nhập; chưa chạy save với API thật. Các component Ovic/editor/file được shallow-test, không xác nhận nội bộ của chúng.
- Review tĩnh chuyên biệt đã hoàn thành: chưa phát hiện regression đủ chắc chắn trong ba file.

## Spec Change Log

## Review Triage Log

- static-review — no verified findings — reviewer compared the three target files against baseline; bindings, permissions, callbacks and save behavior remained intact; review was static only.

## Verification

**Commands:**
- `npm run build` — Angular template/types compile (nếu môi trường đủ RAM).
- `npm test -- --watch=false` hoặc chạy spec mục tiêu nếu Karma hỗ trợ — tests pass.
- `git diff --check` — không có lỗi whitespace.

**Manual checks:**
- Mở course detail với dữ liệu thử; kiểm tra 1280/960/640/560/375px, keyboard focus/tab/radio, dropdown/editor/file, loading/error/retry/disabled và save success/failure nếu được cấp dữ liệu thử.
