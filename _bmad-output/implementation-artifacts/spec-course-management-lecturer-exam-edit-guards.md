---
title: 'Phủ lớp trong suốt lên phần học phần chưa được phân công'
type: 'bugfix'
created: '2026-11-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'e241c983e0ca474aa95f71e312299b19a99fa401'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Giảng viên được giao một phần của học phần cần xem được các phần còn lại, nhưng không được nhập, lưu hoặc kích hoạt thao tác ở phần chưa được phân công.

**Approach:** Chỉ trên route Giảng viên, khi Giảng viên được phân công ít nhất một phần, vẫn hiển thị toàn bộ mode/tab và dữ liệu học phần như hiện tại; phủ một lớp trong suốt trên toàn vùng nội dung của mode chưa được phân công để chặn chuột và bàn phím, thay vì khóa riêng từng input/select. Route các vai trò khác giữ nguyên.

**Always:** Chỉ overlay khi đang truy cập từ route Giảng viên và mode hiện tại không khớp phân công (`creator_plan_id` cho Kế hoạch giảng dạy, `creator_exam_id` cho Kiểm tra đánh giá). Học phần không được giao ở cả hai phạm vi vẫn bị chặn hoàn toàn. Không phủ overlay trên route khác hoặc thu hẹp quyền của vai trò cao hơn.

**Never:** Không đổi API ghi, dữ liệu, bộ lọc danh sách hoặc route; không disable từng input/select; không thay đổi quyền xóa/sao chép học phần.

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management.component.ts` — danh sách Giảng viên đã lọc học phần theo `creator_plan_id` hoặc `creator_exam_id`; giữ nguyên.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.ts` and `course-management-detail.html` — hiện lọc tab/mode theo phân công và không tạo vùng xem chỉ-đọc; đây là nơi quyết định hiển thị mode và đặt lớp phủ chung.
- `children/monhoc-thongtin`, `monhoc-muctieu-cdr`, `monhoc-noidung`, `monhoc-question-cdr`, `monhoc-formde`, `monhoc-kiemtra-danhgia` — một số component tự thêm điều kiện truy vấn assignment nên không tải nội dung mode khác; giữ trạng thái `canAdded` để quyền sửa nội bộ không bị mở rộng.
- `children/monhoc-question-cdr` and `monhoc-formde` — diff hiện có thêm `canEditExamContent()` cùng các disable riêng lẻ; thay bằng lớp phủ toàn vùng theo yêu cầu mới, nhưng giữ các guard ghi trực tiếp có liên quan.

## Tasks & Acceptance

**Execution:**
- [x] Trong `course-management-detail.ts` và `.html`, chỉ trên route Giảng viên giữ tất cả mode/tab hiển thị cho người được giao học phần; phủ một overlay trong suốt duy nhất trên toàn vùng nội dung của mode không được phân công, dùng `inert` để chặn cả bàn phím; không thay đổi header điều hướng hoặc hành vi route khác.
- [x] Cập nhật các child component liệt kê trong Code Map để tải dữ liệu học phần khi người dùng được giao một trong hai phần; giữ nguyên `canAdded` và guard ghi trực tiếp hiện có.
- [x] Thay các disable từng control vừa được thêm trong Form đề/ma trận bằng overlay ở shell; kiểm tra overlay chặn tương tác toàn vùng nhưng không che header và không đổi giao diện bên dưới.
- [x] Thêm kiểm thử hồi quy cho cả mode được giao (không có overlay), mode chưa giao (nội dung tải được, overlay phủ toàn vùng/inert), và học phần không được giao (vẫn bị chặn).

**Acceptance Criteria:**
- Given người dùng đang ở route Giảng viên và được giao học phần qua một trong hai trường phân công, when mở mode không được giao, then nội dung mode vẫn tải và hiển thị dưới một lớp phủ trong suốt bao toàn vùng nội dung, các thao tác chuột/bàn phím không tác động lên nội dung.
- Given Giảng viên được giao một mode, when mở mode được giao, then không có lớp phủ và các thao tác hiện có vẫn hoạt động.
- Given Giảng viên không khớp cả `creator_plan_id` lẫn `creator_exam_id`, when mở URL chi tiết trực tiếp, then học phần vẫn bị chặn như hiện tại.
- Given người dùng truy cập route khác hoặc có vai trò quản lý cao hơn, when mở chi tiết học phần, then không xuất hiện lớp phủ và quyền hiện có được giữ nguyên.
- Given người dùng thuộc vai trò quản lý hiện được hỗ trợ, when mở các phần này, then quyền hiện tại không bị thu hẹp.

## Implementation Notes

- `CourseManagementDetail` vẫn từ chối Giảng viên không được gán cả `creator_plan_id` lẫn `creator_exam_id`; nếu có ít nhất một phân công thì mode chưa gán vẫn hiển thị dưới overlay trong suốt phủ vùng nội dung, còn thanh mode/tab không bị phủ.
- Bỏ điều kiện assignment riêng ở các child loader để nội dung mode còn lại tải được; giữ `canAdded` và guard lưu để quyền thao tác không được mở rộng.
- Gỡ các binding `disabled` mới thêm từng ô/nút; giữ guard ở handler ghi của Ma trận/Form đề và Form KTHP.

## Verification

**Commands:**
- `npm run build` — thành công (Angular AOT).
- `git diff --check` — thành công.
- Không chạy test theo chỉ dẫn trước đó của người dùng.

## Review Triage Log

1. `false` — Truy vấn chi tiết lặp `id` ở cả nhánh phân công Kế hoạch và Kiểm tra đánh giá; mỗi nhánh đều giới hạn vào đúng học phần đang mở.
2. `false` — Danh sách Giảng viên lặp các bộ lọc chung ở nhánh OR cho `creator_plan_id` và `creator_exam_id`, nên mỗi nhánh vẫn chịu cùng điều kiện.
3. `false` — Điều kiện tìm kiếm được lặp cùng các bộ lọc chung ở cả hai nhánh phân công; không có bằng chứng nhánh nào bỏ qua bộ lọc.
4. `false` — Lớp phủ nằm trên toàn panel và `inert` chặn tương tác người dùng; gọi handler trực tiếp từ mã ngoài giao diện không chứng minh người dùng có thể thao tác qua giao diện.
5. `false` — Các handler mục tiêu/CDR nằm trong panel bị phủ và inert khi mode không được giao; không có luồng tương tác giao diện nào bỏ qua lớp phủ.
6. `false` — `MonhocThongtin` chỉ hiện không phủ khi mode Kế hoạch được phân công; quyền gán giảng viên vẫn qua `canAssignTeacher`.
7. `false` — Model học phần khai báo `category_ids` và `nganh_bomon_id` là số; không có dữ liệu hoặc hợp đồng API chứng minh các giá trị này là mảng/chuỗi phân tách.
8. `false` — Vai trò quản lý cao hơn được loại khỏi hạn chế Giảng viên theo đúng intent; luồng danh sách hiện có cung cấp route Giảng viên cho người chỉ có vai trò Giảng viên.
9. `false` — `goBack()` có fallback rõ ràng về danh sách Đào tạo khi thiếu hoặc không hợp lệ `returnUrl`; đây không phải lỗi của overlay.
10. `false` — Không có route `lanhdao-truong/quanly-monhoc` trong cấu hình hiện tại; route lãnh đạo trường không mở danh sách học phần này.
11. `defer` — Test Form đề gọi các handler nhưng chưa khẳng định trực tiếp service ghi không bị gọi; cần bổ sung kiểm thử riêng cho các guard handler.
12. `defer` — `needsReview` của nội dung mô tả cũ chỉ hiện cảnh báo, còn `prepareProtectedValue()` cho phép tiếp tục lưu; đây là hành vi của thay đổi editor độc lập.
13. `maybe-false` — Chưa chứng minh thao tác Quill cụ thể có thể làm sai cấu trúc tiêu đề; cần kiểm thử runtime các thao tác paste, undo, xóa ranh giới và thay đổi Delta để kết luận.
14. `defer` — Thay đổi route mới và route legacy chưa có kiểm thử điều hướng; đây là phạm vi migration route độc lập.
15. `false` — Luồng thông thường của Giảng viên vào trang chi tiết xuất phát từ danh sách Giảng viên; người có vai trò quản lý cao hơn không bị giới hạn theo intent.
16. `false` — Như finding 10, không tồn tại route danh sách học phần của `lanhdao-truong` để cần thêm vào allowlist.
17. `defer` — Test danh sách chỉ kiểm tra tham số gọi service, chưa kiểm tra dữ liệu trả về có loại đúng học phần; logic lọc danh sách không thuộc thay đổi overlay này.
18. `defer` — Thiếu kiểm thử hồi quy cho route migration đã nêu ở finding 14; cần kiểm tra riêng các route theo vai trò và route legacy.
19. `defer` — Chưa có kiểm thử runtime cho controller bảo vệ tiêu đề và serialization; đây là phần việc editor độc lập.
20. `defer` — Chưa có assertion service không bị gọi cho guard lưu Form đề, Ma trận CĐR và Sinh đề; đây là phần kiểm thử handler độc lập với việc phủ panel.
