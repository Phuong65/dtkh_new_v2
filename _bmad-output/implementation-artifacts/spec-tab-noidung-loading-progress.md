---
title: 'Áp dụng loading-progress cho tất cả API trong tab Nội dung'
type: 'feature'
created: '2026-10-29'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'f8af08f75bf5e48ec1e6000859098cef3c9f4fb2'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Trong tab Nội dung học phần (`monhoc-noidung`) và component chuẩn đầu ra (`chuandaura`), nhiều thao tác gọi API (lưu mục tiêu, lưu học liệu, lưu thảo luận, xóa bài, lưu thứ tự bài, thêm bài giảng/thảo luận, tải/lưu/xóa CPI) chưa hiển thị `app-loading-progress` cục bộ đồng bộ theo Design System core-new, hoặc chỉ phụ thuộc vào spinner toàn trang.

**Approach:** Tích hợp `LoadingProgressComponent` (`app-loading-progress`) vào toàn bộ luồng gọi API trong tab Nội dung (`monhoc-noidung`) và component chuẩn đầu ra con (`chuandaura`): quản lý trạng thái loading/saving rõ ràng với tiêu đề tương ứng theo từng ngữ cảnh (`Đang tải nội dung...`, `Đang lưu mục tiêu...`, `Đang lưu tài liệu...`, `Đang lưu chuẩn đầu ra...`, `Đang xóa bài...`, `Đang cập nhật...`), bảo đảm khóa thao tác khi đang gọi API và tắt loading chính xác khi hoàn tất (cả nhánh thành công lẫn lỗi).

## Boundaries & Constraints

**Always:** Phạm vi gồm `MonhocNoidungComponent`, `ChuandauraComponent`, `NhanxetNoidungComponent` và các API do ba component này gọi trực tiếp trong tab Nội dung. Dùng `app-loading-progress`; heading phải phản ánh thao tác; khóa submit/xóa/đóng phù hợp khi đang xử lý; loading chỉ tắt sau request cuối cùng của chuỗi hoặc nhóm song song; cả success/error đều phải kết thúc state.

**Never:** Không đổi service contract, payload, phân quyền, nghiệp vụ tạo/xóa/lưu, tiêu đề UI, form `ictu-form`, drawer CPI, upload component, toast/confirm semantics; không thay `app-loading-progress` bằng spinner tự viết; không để một request con gọi tắt loading của request cha đang còn chạy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Tải tab | API khóa học, profile, kế hoạch, nhận xét, CLO, thảo luận và CPI đang chạy | Overlay `app-loading-progress` bao tab; heading tải nội dung; không hiện empty/error sớm | Request lỗi chuyển đúng error/retry; counter không âm |
| Lưu dữ liệu | Lưu mục tiêu, học liệu, thảo luận hoặc CPI | Overlay hiện đến khi save và reload liên quan hoàn tất; action bị khóa | Giữ dữ liệu nhập; toast lỗi; overlay tắt |
| Xóa/tạo/sắp xếp | Chuỗi API có nhiều bước hoặc `forkJoin` | Một overlay xuyên suốt toàn chuỗi, không nhấp nháy giữa các bước | Bước lỗi kết thúc overlay, không báo thành công sai |
| Nhận xét | Tải reply, gửi reply, yêu cầu duyệt | Loading nằm trong tab, heading đúng ngữ cảnh | Toast lỗi và tắt loading |
| Đồng thời | Parent reload và CPI/comment request chồng nhau | Overlay chỉ tắt khi toàn bộ request đang theo dõi đã hoàn tất | Reference count bảo vệ không tắt sớm |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.ts` -- API tải ban đầu và mọi action bài/mục tiêu/học liệu/thảo luận/sắp xếp; bổ sung tracker reference-count và bao mỗi chuỗi API.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.html` -- một overlay `app-loading-progress` dùng cho initial load lẫn action API, không thay empty/error hiện có.
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.ts` -- tải/lưu/xóa CPI; phát sự kiện busy lên parent hoặc dùng contract input/output để parent overlay theo dõi.
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.html` -- giữ drawer/form, khóa action theo `isSaving`; không tạo spinner khác.
- `src/app/modules/admin/features/course-management/course-management-detail/children/nhanxet-noidung/nhanxet-noidung.component.ts` -- tải/gửi reply và yêu cầu duyệt; phát busy lifecycle lên parent.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.spec.ts` -- test reference count, heading, success/error và chuỗi API.
- `src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.spec.ts` -- test event busy và save/xóa CPI.

## Tasks & Acceptance

**Execution:**
- [ ] `monhoc-noidung.component.ts` -- tạo state busy reference-count dùng `signal/computed`, helper bắt đầu/kết thúc request và áp dụng cho tất cả API parent; dùng `finalize`/`try-finally` để không rò trạng thái.
- [ ] `monhoc-noidung.component.html` -- render một `app-loading-progress` trên shell khi initial state hoặc busy counter đang hoạt động; heading theo thao tác.
- [ ] `chuandaura.component.ts` và `nhanxet-noidung.component.ts` -- phát event busy `{ active, heading }` quanh mọi API trực tiếp; đảm bảo từng start có đúng một end.
- [ ] Hai template con -- nối event lên `MonhocNoidungComponent`; giữ nguyên drawer, form, nhận xét và tiêu đề.
- [ ] Các spec liên quan -- test request thành công/lỗi/chồng nhau và xác nhận overlay không tắt sớm.

**Acceptance Criteria:**
- Given bất kỳ API trực tiếp nào trong tab Nội dung đang chạy, when giao diện render, then `app-loading-progress` hiển thị với heading phù hợp và thao tác trùng bị khóa.
- Given nhiều request đồng thời hoặc chuỗi save rồi reload, when một request hoàn tất trước, then overlay vẫn hiển thị đến request cuối cùng kết thúc.
- Given API lỗi, when error callback/finally chạy, then overlay biến mất, toast/error hiện đúng và form/context người dùng không bị mất.
- Given không có request, when tab ở success/empty/error ổn định, then overlay không che nội dung.

## Implementation Notes

- Working tree có nhiều thay đổi UI chưa commit; chỉ sửa phạm vi tab Nội dung, giữ nguyên thay đổi sẵn có; không commit/push.
- Handoff trước không sửa được do worktree cô lập thiếu trạng thái hiện tại. Triển khai trên checkout hiện tại.
- Đã thêm khung `busyCount/busyHeading/isBusy` và helper trong parent, `onBusy` trong nhận xét; chưa nối API/template. Có thể tinh chỉnh helper để bắt đầu trước subscribe và cleanup đúng một lần, không dùng Promise đã chạy trước khi bật loading.
- Overlay phải độc lập nhánh render nội dung để không hủy form/component khi save; CPI drawer `appendTo="body"` cần overlay riêng ở drawer khi đang lưu, parent overlay nằm phía sau không đủ.
- Giữ API/payload; có thể gom chuỗi RxJS/Promise để theo dõi trọn thao tác, bao gồm reload, hủy component, lỗi và batch rỗng. Không dùng `NotificationService.isProcessing()` như getter (đây là setter bật spinner toàn cục).
- Bổ sung test API thực với Subject/delayed Observable, không chỉ test boolean. Test nhận xét thêm file mới nếu cần.
- Tiến độ đang dở: parent đã thêm computed/busyCount/trackBusy (chưa dùng); comments đã thêm onBusy/finalize quanh tải/gửi/duyệt (chưa nối event, chưa cancellation/duplicate guards); CPI đã thêm onBusy, isLoading, beginLoading/endLoading nhưng chưa nối API. Hoàn thiện hoặc thay helper chưa dùng, tránh double-count, không dựa boolean cho concurrent API. Đây chưa phải triển khai hoàn chỉnh.
- Contract event đã duyệt có thể dùng emitter async + cleanup theo DestroyRef để tránh NG0100 khi con ngOnChanges/ngOnInit phát event; phải kiểm thử parent render thực với child load. Mọi API trong ba component cần theo dõi, nhưng không sửa upload/shared widget toàn ứng dụng.
- Không commit/stash/push: user chỉ yêu cầu triển khai, working tree nhiều thay đổi của phiên khác. Chỉ lưu file trong scope spec.

## Verification

**Commands:**
- `npm test -- --include=src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/monhoc-noidung.component.spec.ts --include=src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/chuandaura.component.spec.ts --watch=false --browsers=ChromeHeadless` -- expected: toàn bộ test pass.
- `npm run build -- --configuration development-lowram` -- expected: AOT build thành công.

**Manual checks:**
- Thực hiện tải tab, lưu mục tiêu, lưu học liệu, lưu thảo luận, thêm/sửa/xóa CPI, xóa/thêm/sắp xếp bài, gửi/tải phản hồi; mỗi luồng có overlay đúng heading, không nhấp nháy/tắt sớm.
