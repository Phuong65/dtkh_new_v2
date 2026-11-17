---
title: 'Phiên cấu hình Bộ CTĐT bốn mục'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'dispatch'
baseline_commit: '2098c19a405f7f4e4da6d1d20a02286e116ff5e7'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sửa thông tin, chọn môn học, PEO và PLO/PI của một Bộ CTĐT đang nằm ở bốn luồng rời rạc, làm người dùng mất ngữ cảnh và phải quay lại bảng nhiều lần.

**Approach:** Gộp thành một phiên cấu hình trong trang hiện tại: sidebar trái đúng bốn mục **Thông tin / Môn học / Mục tiêu cụ thể / Chuẩn đầu ra**, vùng phải chỉ hiện mục đang chọn. Thông tin và Môn học nằm inline; PEO/PLO giữ CRUD và drawer nhập hiện có.

## Boundaries & Constraints

**Always:**
- Một nút Cấu hình thay bốn nút Sửa/Chọn môn/PEO/PLO trên dòng; giữ click tên mở chương trình, tạo mới và xóa.
- Mở mặc định Thông tin; đóng quay lại đúng danh sách/bộ lọc/phân trang trước đó.
- Giữ API, validation, phân quyền, confirm xóa, retry lỗi một phần và chống tạo course trùng hiện có.
- Quyền chỉ đọc vẫn xem đủ bốn mục; từng chức năng sửa/lưu/CRUD bị khóa theo quyền hiện có.
- Chặn chuyển/đóng khi đang ghi/xóa. Nháp chưa lưu phải xác nhận bỏ; hủy xác nhận giữ nguyên dữ liệu.
- PEO/PLO/PI giữ drawer thêm/sửa hiện tại; child embedded chỉ ẩn header/back trùng và dùng chiều cao container.

**Never:** thêm route/backend/service/schema; reset lựa chọn môn chỉ vì đổi sidebar; hủy request ghi để cho phép điều hướng; commit hoặc gọi API thật.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Mở cấu hình | Chọn một Bộ CTĐT | Header Bộ, sidebar 4 mục, mặc định Thông tin | Không đổi list state |
| Lưu thông tin | Form hợp lệ | Cập nhật header và row list, ở lại panel | Giữ draft khi lỗi |
| Chọn môn học | Search/page/toggle | Giữ selection qua trang và đổi sidebar | Lỗi một phần reconcile, không tạo course trùng |
| PEO/PLO | Chuyển mục, CRUD | Chỉ active child mount; drawer CRUD hoạt động như cũ | Lỗi lưu giữ drawer/draft |
| Điều hướng | Busy hoặc dirty | Busy chặn; dirty hỏi bỏ nháp | Hủy confirm giữ nguyên context |
| Chỉ đọc | Không có quyền sửa | Xem được cả 4 mục | Nút ghi dữ liệu bị khóa |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt.component.ts` -- list, quyền, form chung, subject session/load/save; thêm configuration session/guard.
- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt.component.html` -- thay bốn action bằng Cấu hình; shell sidebar/main; inline info/subjects.
- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt.component.css` -- layout shell sáng, scroll/responsive, panel inline.
- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt-peo/*` -- embedded contract, busy/dirty/discard; giữ drawer CRUD.
- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt-cdr/*` -- embedded contract, busy/dirty/discard; giữ PLO/PI và drawer CRUD.
- `src/app/core-new/service/notification.service.ts` -- dùng confirm cho discard; không sửa service.

## Tasks & Acceptance

**Execution:**
- [x] `bo-ctdt.component.ts` -- configuration state, section guard, inline save info và lifecycle môn học không phụ thuộc drawer.
- [x] `bo-ctdt.component.html/css` -- một action Cấu hình, sidebar 4 mục đúng thứ tự, active panel bên phải, responsive.
- [x] `bo-ctdt-peo/*` -- embedded UI + contract busy/dirty/discard, giữ CRUD drawer.
- [x] `bo-ctdt-cdr/*` -- embedded UI + contract busy/dirty/discard, giữ PLO/PI drawer.
- [x] Cập nhật tests parent/child cho navigation, quyền, save/error và embedded; chạy diagnostics, tests mục tiêu, build, diff check.

**Acceptance Criteria:**
- Given bảng Bộ CTĐT, when mở Cấu hình, then chỉ một phiên có sidebar đúng 4 mục và Thông tin active.
- Given đổi mục, when section sạch và không busy, then chỉ panel tương ứng hiển thị, dữ liệu đã tải/draft cần giữ không bị reset.
- Given nháp hoặc mutation, when đổi mục/đóng, then confirm/chặn đúng và không có stale callback đổi Bộ.
- Given quyền chỉ đọc, when vào cấu hình, then xem được dữ liệu nhưng không ghi trái quyền.
- Given quay lại danh sách, when tạo mới/xóa/click tên, then các luồng cũ vẫn hoạt động.

## Implementation Notes

- Đã áp patch từ worktree về workspace gốc; chỉ sửa các file Bộ CTĐT, không đụng thay đổi tooltip ở nơi khác.
- Lifecycle môn học đổi từ drawer sang phiên; snapshot lần tải đầu phân biệt với nháp đã có, tránh mất liên kết khi retry GET lỗi.
- Lưu thông tin cập nhật row/header trực tiếp và đồng bộ mã Bộ cho phiên chọn môn; không tải lại list gây dữ liệu cũ.
- Drawer PEO/PLO dùng nút X custom trước khi đóng để xác nhận nháp không làm mất backdrop; busy bao gồm confirmation xóa.
- CSS embedded nằm trong từng child để không bị encapsulation ngăn selector.
- Test parent mới 15 ca (gồm 2 ca bổ sung cho refresh/pagination), thêm 6 ca child cho embedded, discard nháp và confirm xóa.

## Spec Change Log

- 2026-11-16: Người dùng thay yêu cầu cũ ba mục thành bốn mục, đưa Môn học vào cùng phiên và giữ drawer CRUD PEO/PLO/PI.

## Review Triage Log

| Finding | Verdict | Action |
|---|---|---|
| Native drawer ẩn mask trước khi hỏi bỏ nháp | high | Đã sửa: khóa native close/Escape/mask, nút X custom và Hủy gọi guard trước khi đổi visible. |
| CSS embedded đặt ở parent không xuyên encapsulation | medium | Đã chuyển selector về stylesheet child, giữ height theo container. |
| Confirm xóa chưa nằm trong busy | medium | Đã thêm confirmingDelete, chặn đổi context trong lúc confirm. |
| Retry GET lần đầu giữ Set rỗng, làm mất lựa chọn đã lưu | high | Đã phân biệt baseline đã tải; regression test PASS. |
| Mã Bộ trong phiên môn học cũ sau lưu thông tin | medium | Đã cập nhật subjectBo khi lưu thông tin; regression test PASS. |
| Test kích thước nút PEO báo width 48px thay 35px | low | Đã bổ sung border-box/padding 0; giữ nguyên assertion 35px, PASS. |
| List còn row cũ khi thông tin mới không còn khớp filter | medium | Đã tải lại list theo filter hiện hành khi đóng phiên, cập nhật tổng bản ghi và lùi trang nếu trang hiện tại trống; regression test chạy. |

## Verification

- `npx ng test --watch=false --browsers=ChromeHeadless` với ba include cụ thể (parent, PEO, CDR): **45/45 PASS**, exit 0; tất cả API được mock.
- Parent regression test chạy riêng sau pagination fix: **15/15 PASS**, exit 0.
- `npm run build`: chạy lại độc lập **PASS**, Angular AOT, exit 0. Lần chạy nối tiếp sau test trước đó bị exit 1 không có diagnostics; chưa xác định nguyên nhân lần thất bại đó.
- `git diff --check` và `git diff --cached --check`: **PASS**, chỉ cảnh báo LF/CRLF.
- VS Code diagnostics cho TS/HTML/CSS mục tiêu: không lỗi.
- Chưa kiểm chứng trình duyệt trên backend thật; chưa gọi API thật. Không commit.
- Matrix: mở/readonly/đổi panel/lưu thông tin/lỗi và subject retry đã có tests parent; CRUD/embedded/discard/delete-confirm ở child. Khi đổi sidebar, nháp chọn môn được giữ trong phiên; hỏi bỏ khi đóng phiên.
