---
title: 'Chuẩn hóa AppState và loading-progress cho Form đề học phần'
type: 'feature'
created: '2026-10-14'
status: 'in-progress'
route: 'oneshot'
baseline_commit: 'working-tree'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab Form đề trong `course-management-detail` vẫn dùng loading toàn cục legacy qua `NotificationService.isProcessing`, trong khi component đã có `AppState` và `app-loading-progress` nhưng luồng tải tab có thể để UI đứng ở loading hoặc bị response cũ ghi đè khi đổi học phần/tab.

**Approach:** Chuẩn hóa toàn bộ `monhoc-formde.component.ts/html/css` theo state local: `AppState` điều khiển tải khởi tạo/lỗi/thành công, `app-loading-progress` hiển thị loading trong vùng component, request tab bị hủy khi đổi course/tab, thao tác lưu/xóa dùng state local và cleanup trong mọi nhánh success/error/finally. Giữ nguyên API, tính toán Form đề, quy tắc quyền, tab và checkbox chọn bài.

**Boundaries:** Chỉ sửa ba file `course-management-detail/children/monhoc-formde/monhoc-formde.component.{ts,html,css}`. Không reset hoặc sửa các thay đổi khác trong working tree, không đổi service/model/API, không sửa legacy `quanly-monhoc`.

</frozen-after-approval>

## Code Map

- `monhoc-formde.component.ts`: `loadCourseData` tải course/profile/form duyệt/hội đồng/comment; `state` signals; `changeTabView` gọi các luồng `loadForm*`; các luồng load hiện còn legacy `notificationService.isProcessing`; save/batch dùng `displayModal`, `progressValue`, `loopAddForm`; checkbox drawer dùng `list_week`, `selectedTestTx`, `onSelectWeek`.
- `monhoc-formde.component.html`: root `formde-shell` đã render `app-loading-progress`; tab list `.form-de-tab-list`; tab content; drawer chọn bài đã đổi sang card checkbox custom, summary `selectedWeekCount`, `[list_week || []]`.
- `monhoc-formde.component.css`: host/form shell có height đầy đủ; tab style đang được đồng bộ với assessment tabs; drawer `formde-week-drawer` cần giữ card checkbox nổi bật, footer cố định, nền trắng và focus visible.
- Reuse `AppState` union từ `@core-new/models/app-state`, `LoadingProgressComponent`, `takeUntilDestroyed`, `takeUntil`, `Subject` cancellation; giữ `NotificationService` core-new chỉ cho toast/confirm, không gọi `isProcessing`.

## Implementation Notes

1. Bảo toàn route/query load: tăng `courseLoadVersion` mỗi lần code đổi, `cancelCourseLoad$.next()` và `cancelTabLoad$.next()`, bỏ response cũ nếu version không còn hiện tại. Khởi tạo `list_week = []` để template không lỗi trước API.
2. `loadCourseData`: state loading trước request; success chỉ sau dữ liệu course và danh sách tab đã sẵn sàng; lỗi/ID sai đặt error + message để retry. Không gọi load tab trước khi state/course hợp lệ.
3. Tab loads (`loadFormCcCauhoi*`, `loadFormDgCauhoi*`, `loadFormtxCauhoi*`): pipe với `takeUntil(cancelTabLoad$)` và `takeUntilDestroyed`; mỗi lần bắt đầu cập nhật loading heading/state local; mọi success/error đều kết thúc state, không dùng global `isProcessing`. Chặn response của tab trước khi tab/course mới đã đổi.
4. Save/delete/batch: thay global processing bằng local state/loading heading; `displayModal` chỉ dùng state và `app-loading-progress`; xử lý `request.length === 0`; mọi error tắt overlay, toast lỗi, giữ bản nháp. Không để `toastSuccess` ở nhánh lỗi.
5. Checkbox drawer: giữ `onSelectWeek` và dữ liệu nghiệp vụ; dùng custom checkbox card, selected state, summary null-safe; drawer có footer và chiều cao rõ ràng. Không thay API/logic thêm-xóa tuần.
6. Styles: giữ tab Form đề cùng ngôn ngữ với `assessment-tabs` (icon, active underline, 14px); dùng core-new input/button classes; không mở rộng selector ra component khác.

## Verification

- `npm run build` thành công.
- Diagnostics sạch cho ba file target; các hint `styleClass` deprecated có sẵn không được coi là lỗi.
- Manual: mở `/hoc-phan?code=<id>&tab=form-de`, quan sát lần tải đầu và retry/error; chuyển từng tab CC/DG/TNTX; đổi tab nhanh; kiểm tra load không bị kẹt/không gọi overlay legacy.
- Manual checkbox: mở `Chọn Bài`, thấy card checkbox nổi bật, chọn/bỏ nhiều bài, summary cập nhật, đóng drawer, dữ liệu tuần trong Form đề giữ đúng.
- Manual save/delete: lưu Form đề, lưu batch, xóa tuần có confirm core-new; success/error đều kết thúc loading.
