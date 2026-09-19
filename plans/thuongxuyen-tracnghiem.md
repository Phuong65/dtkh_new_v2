# Kế hoạch chức năng Thường xuyên - Trắc nghiệm

## 1. Mục tiêu

Theo dõi hiện trạng, quyết định nghiệp vụ, phần đã triển khai và các việc còn lại của màn hình **Thường xuyên - Trắc nghiệm** trong chi tiết lớp học phần.

- **Component:** `ThuongxuyenTracnghiemComponent`
- **Đường dẫn:** `src/app/modules/admin/features/lop-hoc-phan/class-details/thuongxuyen-tracnghiem/`
- **Loại:** Angular standalone component

## 2. Phạm vi chức năng

Màn hình hỗ trợ giảng viên quản lý bài kiểm tra trắc nghiệm thường xuyên cho một lớp học phần:

- Quản lý danh sách sinh viên và bài kiểm tra theo lớp.
- Tạo đề, sinh đề trực tiếp và nhập điểm trực tiếp.
- Theo dõi trạng thái làm bài qua WebSocket và auto-refresh.
- Dừng, tiếp tục, thu bài, hủy bài, thêm thời gian cho sinh viên.
- Xử lý vi phạm trong quá trình làm bài.
- Điểm danh/khóa đăng nhập cho từng sinh viên hoặc toàn lớp.
- Thao tác theo nhóm sinh viên: điểm danh vắng, điểm danh có, thu bài nhóm.

## 3. File liên quan

| File | Vai trò |
| --- | --- |
| `thuongxuyen-tracnghiem.component.ts` | Logic chính: load dữ liệu, realtime, thao tác bài thi, thao tác nhóm. |
| `thuongxuyen-tracnghiem.component.html` | Template danh sách sinh viên, bộ lọc, nhóm action, dialog xác nhận, modal tiến trình. |
| `thuongxuyen-tracnghiem.component.css` | Style riêng của màn hình. |
| `class-group/` | Nguồn nghiệp vụ nhóm sinh viên dùng cho thao tác theo nhóm. |

## 4. Luồng nghiệp vụ chính

1. Đọc query params `code` và `test`.
2. Load thông tin lớp, hoạt động kiểm tra và quyền truy cập.
3. Kết nối WebSocket theo activity hiện tại.
4. Load sinh viên, bài kiểm tra, thống kê trạng thái và danh sách nhóm.
5. Cập nhật UI qua WebSocket và auto-refresh 15 giây.
6. Cho phép thao tác cá nhân, toàn lớp hoặc theo nhóm.

## 5. Quyết định nghiệp vụ đã chốt

1. **Thao tác nhóm áp dụng cho toàn bộ sinh viên thuộc nhóm**, không phụ thuộc trang hiện tại hoặc bộ lọc UI.
2. Nguồn danh sách sinh viên nhóm lấy từ `ClassGroupMemberService`.
3. Điểm danh nhóm tham khảo `onChangeLock()`:
   - **Điểm danh nhóm vắng:** `updateClassPlanActivitiesTests(test.id, { lock: 1 })`.
   - **Điểm danh nhóm có:** `updateClassPlanActivitiesTests(test.id, { lock: 0 })`.
4. Sinh viên không có bài test được bỏ qua khi điểm danh vắng/có theo nhóm.
5. Thu bài nhóm chỉ xử lý bài test hợp lệ, bỏ qua sinh viên chưa có đề, đã nộp, đã hủy hoặc trạng thái không cho thu.
6. Thu bài nhóm chỉ thu khi trạng thái khác `2`, `-1`, `0`, theo logic `openDialogThubai()`.
7. Sau thao tác nhóm phải refresh lại danh sách và thống kê để đồng bộ UI.
8. Thao tác nhóm dùng chung quyền quản lý bài kiểm tra hiện tại, chưa cần quyền riêng.

## 6. Việc đã hoàn thành

### 6.1. Tối ưu và ổn định component

- Tách logic load sinh viên/bài test trùng lặp thành helper dùng chung.
- Giảm khoảng 190 dòng code trùng lặp trong luồng load chính và auto-refresh.
- Parse cấu hình từ `localStorage` an toàn hơn.
- Guard dữ liệu vi phạm rỗng, thiếu hoặc đã bị xóa khỏi cấu hình.
- Bổ sung tắt loading ở các nhánh lỗi dễ làm kẹt UI.
- Cleanup `ResizeObserver` trong `ngOnDestroy()`.
- Guard WebSocket event khi sinh viên chưa có `test_tracnghiem`.

### 6.2. Sửa lỗi vận hành/UX

- `saveViolation()` không crash khi key vi phạm không còn trong `dbConfig`.
- `saveAddtime()` tắt loading khi lỗi, ghi đúng `received_by`, sửa toast thành công.
- `filterStatusSelect` không set `null` gây lọc sai trong auto-refresh.
- `submitShiftStudent()` tắt loading khi lỗi.
- `savePointTest()` rollback đúng `test_tracnghiem` và tránh crash khi focus sang sinh viên không có bài test.
- `getStatusTestPromise()` trả `[]` thay vì `null` khi API lỗi.
- `continueAllTest()` không kẹt modal khi không có bài nào đang tạm dừng.

### 6.3. Thao tác theo nhóm

- Inject `ClassGroupService` và `ClassGroupMemberService`.
- Thêm state nhóm đang chọn và danh sách `selectedGroupMemberStudentIds` lấy từ API member.
- Thêm `loadGroups()`, `onGroupChange()`, `openGroupActionConfirm()`, `confirmGroupAction()`.
- Thêm `queryTestsByStudentIds()` để query bài test theo toàn bộ `student_id` trong nhóm với `limit = -1`.
- Điểm danh vắng/có theo nhóm chỉ update sinh viên có bài test, bỏ qua sinh viên không có bài test.
- Thu bài nhóm query toàn bộ bài test trong nhóm, lọc bài hợp lệ rồi gọi `nopbai`.
- Toast kết quả thao tác nhóm có số thành công và số bị bỏ qua.
- Sau thao tác nhóm refresh lại danh sách hiện tại.
- Thêm dialog xác nhận trước khi cập nhật hàng loạt.

### 6.4. UI/UX thao tác nhóm

- Di chuyển dropdown chọn nhóm và 3 nút action xuống cạnh ô tìm kiếm trong caption bảng sinh viên.
- Đổi button từ `btn-sm` sang `btn-icon` để đồng bộ icon-only button.
- Luôn hiển thị 3 nút action, bỏ điều kiện `*ngIf="selectedGroupId"`.
- Quy ước UI hiện tại:
  - **Điểm danh nhóm vắng:** `btn-warning`, icon `fa-square-o`, `lock = 1`.
  - **Điểm danh nhóm có:** `btn-primary`, icon `fa-check-square-o`, `lock = 0`.
  - **Thu bài nhóm:** `btn-danger`, icon `fa-stop-circle-o`.

### 6.5. P2 2026-05-13 — Đồng bộ thống kê, an toàn innerHTML, tracking thu bài nhóm

- **Đồng bộ thống kê sau thao tác nhóm:**
  - Đổi `loadStudentClass(this.pageIndex)` → `loadStudentAndTest()` trong cả 3 nhánh thao tác nhóm (`confirmGroupAction()`):
    - Điểm danh vắng (lock=1)
    - Điểm danh có (lock=0)
    - Thu bài nhóm (nopbai)
  - Sau khi thao tác nhóm hoàn thành, `loadStudentAndTest()` refresh cả `status_object`/`tongtest`/`tongsv` lẫn danh sách sinh viên, loại bỏ stale statistics.

- **Thay `[innerHTML]` bằng text interpolation cho mô tả vi phạm:**
  - Template dialog vi phạm (dòng 380 cũ): `[innerHTML]="violationData['key'] | showlabel : dbConfig : 'key' : 'DESC'"` → `{{violationData['key'] | showlabel : dbConfig : 'key' : 'DESC'}}`.
  - Nội dung mô tả từ `dbConfig` (nguồn `localStorage`) được render dưới dạng text thuần, tránh XSS.

- **Cải thiện tracking cho thu bài nhóm:**
  - Thêm method `loopAddFormWithTracking(requests, key, tracking)` tracking `success`, `failed`, `skip`, `total` trong quá trình thực thi.
  - Áp dụng cho nhánh thu bài nhóm (`groupActionType === 'submit'`).
  - Kết quả toast hiển thị chi tiết: số thành công, số thất bại, số bỏ qua, tổng sinh viên.
  - Nếu có thất bại, toast chuyển sang `toastWarning` thay vì `toastSuccess`.
  - Modal progress bar vẫn hoạt động với `progressValue` được cập nhật qua từng request.

## 7. Static review theo code mới 2026-05-13

### 7.1. Tracking thất bại khi thu bài nhóm — đã hoàn thiện theo code hiện tại

- `loopAddFormWithTracking(requests, key, tracking)` hiện đã bắt lỗi từng request bằng `catchError()`.
- Request thành công tăng `tracking.success`; request lỗi tăng `tracking.failed`.
- Khi một request lỗi, batch vẫn tiếp tục xử lý request kế tiếp thay vì dừng toàn bộ Observable.
- Sau request cuối cùng, method emit summary cuối `{ success, failed, skip, total, groupName }`.
- Nhánh toast trong `confirmGroupAction()` đã phân biệt kết quả: có thất bại thì `toastWarning`, không thất bại thì `toastSuccess`.

### 7.2. `received_by` khi thu bài nhóm — đã cập nhật theo code mới

- Code hiện tại tạo mapping `student_id -> user_id` bằng `buildStudentUserMap(allGroupStudentIds)` rồi lấy `studentUserMap.get(test.student_id)` khi build `ClassPlanActivitiesTestsControl`.
- Nhánh thu bài nhóm đã bỏ fallback `received_by = 0`; control hiện dùng `received_by: userId`.
- Điểm cần lưu ý: nếu `studentUserMap` không trả về `user_id`, giá trị `received_by` có thể là `undefined`. Nếu muốn chặt chẽ hơn, bước tiếp theo là bỏ qua hoặc tính thất bại có kiểm soát cho sinh viên thiếu `user_id` trước khi tạo request.

### 7.3. Auto-refresh 15 giây — chưa tối ưu, có rủi ro dừng sau lỗi tạm thời

- Component vẫn dùng timer 15 giây qua `startSetInterval()` → `interLoadStudentAndTest()`.
- WebSocket đã cập nhật nhanh các trạng thái bắt đầu/dừng/nộp bài, nhưng chưa thay thế hoàn toàn refresh định kỳ.
- Nếu API trong luồng refresh lỗi sau khi `closeInterval()`, một số nhánh error không gọi lại `startSetInterval()`, nên auto-refresh có thể dừng cho tới khi người dùng reload/thao tác lại.
- Hướng chốt:
  1. Giữ timer 15 giây như safety net nếu chưa refactor realtime.
  2. Đảm bảo nhánh success/error/finalize đều lên lịch lại timer khi component còn active.
  3. Nếu tối ưu tiếp, ưu tiên WebSocket làm nguồn cập nhật chính và chỉ refresh đầy đủ khi cần đồng bộ thống kê.

### 7.4. Kiểm tra sau chỉnh sửa

- Static review chưa chạy build/test/app.
- Sau khi sửa nốt nên kiểm tra:
  1. Thu bài nhóm với tất cả request thành công.
  2. Thu bài nhóm có một vài request lỗi để xác nhận `failed` tăng và các request sau vẫn chạy.
  3. Thu bài nhóm có sinh viên thiếu `user_id` để xác nhận không ghi `received_by = 0` và summary đúng.
  4. Lỗi API tạm thời trong auto-refresh không làm dừng vòng refresh.
  5. Thống kê và danh sách sinh viên refresh đúng sau thao tác nhóm.

## 8. Trạng thái hiện tại

- **P1:** Đã hoàn thành.
- **P2:** Hoàn thành phần lớn: đồng bộ thống kê sau thao tác nhóm, bỏ `[innerHTML]` mô tả vi phạm, modal/summary thu bài nhóm, tracking success/failed/skip khi thu bài nhóm, bỏ fallback `received_by = 0`.
- **Còn lại trước khi chốt sạch kỹ thuật:**
  1. Chống auto-refresh dừng sau lỗi API tạm thời.
  2. Nếu muốn chặt chẽ hơn, xử lý rõ sinh viên thiếu `user_id` trước khi tạo request thu bài nhóm.
  3. Nếu có thời gian, tối ưu refresh 15 giây theo hướng ưu tiên WebSocket.
- **Trạng thái nhóm:** Đã đổi từ khóa/mở khóa đăng nhập nhóm sang điểm danh nhóm vắng/có.
- **Phạm vi thao tác nhóm:** Đã áp dụng theo toàn bộ thành viên nhóm từ API, không phụ thuộc dữ liệu đang hiển thị.
- **Compile/runtime check:** Chưa chạy lại trong review hiện tại.

## 9. P2 còn lại

1. ~~Đồng bộ thống kê sau thao tác nhóm~~ ✅
2. ~~Rà soát `[innerHTML]` cho mô tả vi phạm~~ ✅
3. ~~Cải thiện modal tiến trình thu bài nhóm~~ ✅
4. ~~Hoàn thiện tracking lỗi khi thu bài nhóm~~ ✅
5. ~~Sửa `received_by` trong control thu bài nhóm~~ ✅
   - Đã bỏ fallback `received_by = 0`; code hiện dùng `received_by: userId`.
   - Có thể tối ưu thêm bằng cách skip/failed rõ ràng nếu thiếu `user_id`.
6. **Ổn định auto-refresh 15 giây**
   - Không để vòng refresh dừng sau lỗi API tạm thời.
   - Sau đó mới cân nhắc tối ưu sâu bằng WebSocket.

## 10. Kết luận cuối về chức năng

Chức năng **Thường xuyên - Trắc nghiệm** đã đạt mức **có thể sử dụng nghiệp vụ chính**: quản lý danh sách sinh viên/bài kiểm tra, trạng thái realtime cơ bản, thao tác cá nhân, điểm danh nhóm, thu bài nhóm và đồng bộ thống kê sau thao tác nhóm đều đã có trong code.

Tuy nhiên chưa nên coi là “hoàn tất sạch kỹ thuật” cho tới khi đảm bảo auto-refresh không tự dừng sau lỗi tạm thời. Việc bỏ fallback `received_by = 0` đã hoàn tất theo code mới; tối ưu WebSocket sâu hơn là cải tiến tiếp theo, không phải blocker nghiệp vụ chính.