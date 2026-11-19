---
title: 'Áp dụng overlay theo luồng truy cập Giảng viên'
type: 'bugfix'
created: '2026-11-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '2134b4d2b22df2ccfdb203da1653688732bea586'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Trang chi tiết học phần được mở từ danh sách Giảng viên bằng URL có `returnUrl=/admin/giang-vien/quanly-monhoc`, nhưng không áp dụng overlay theo ngữ cảnh route cho tài khoản có đồng thời vai trò Giảng viên và vai trò quản lý cao hơn. Hiện `CourseManagementDetail` nhận diện Giảng viên theo danh sách vai trò và bỏ hạn chế nếu có vai trò cao hơn; `returnUrl` chỉ dùng cho nút quay lại.

**Approach:** Khi tài khoản có vai trò Giảng viên mở trang chi tiết từ danh sách Giảng viên, xác định ngữ cảnh bằng `returnUrl` để áp dụng quyền theo `creator_plan_id`/`creator_exam_id`, kể cả khi tài khoản có thêm vai trò quản lý cao hơn. Giữ overlay trong suốt trên mode chưa được phân công; mode được phân công vẫn sửa được như yêu cầu trước.

**Always:** `returnUrl=/admin/giang-vien/quanly-monhoc` cùng vai trò Giảng viên là ngữ cảnh quyết định quyền cho trang chi tiết; mode được gán vẫn thao tác được, mode còn lại phải bị overlay chặn. Các luồng ngoài Giảng viên và tài khoản chỉ có vai trò quản lý giữ nguyên quyền. Học phần không được gán cho tài khoản Giảng viên vẫn bị từ chối.

**Never:** Không đổi API, bộ lọc danh sách, thao tác xóa/sao chép hoặc kiểu overlay. Không khóa mode đã được phân công.

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management.component.html` — link chi tiết gửi `returnUrl` theo route danh sách, ví dụ `/admin/giang-vien/quanly-monhoc`.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.ts` — `isLecturer` hiện chỉ dựa trên role và loại trừ role quản lý; `resolveLecturerAccess()` lấy phân công và chọn mode đầu tiên được giao khi URL không có `tab`/`mode`.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.html` and `.css` — lớp phủ và `inert` đã bọc toàn bộ nội dung, được điều khiển bởi `activeModeAllowed()`.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.spec.ts` — có test Giảng viên thuần và test vai trò admin override; chưa có case vai trò kép khi `returnUrl` là route Giảng viên.

## Tasks & Acceptance

**Execution:**
- [x] `course-management-detail.ts` — dùng ngữ cảnh route Giảng viên để áp dụng quyền phân công cho tài khoản vai trò kép.
- [x] `course-management-detail.spec.ts` — kiểm tra URL từ danh sách Giảng viên, vai trò kép, mode được/không được phân công và luồng ngoài Giảng viên.

**Acceptance Criteria:**
- Given tài khoản Giảng viên mở link từ `/admin/giang-vien/quanly-monhoc`, when vào mode chưa được phân công, then nội dung bị phủ overlay và không thể tương tác.
- Given tài khoản Giảng viên mở mode được phân công, when thao tác trên nội dung, then quyền sửa hiện có được giữ nguyên.
- Given tài khoản chỉ có vai trò quản lý hoặc vào từ luồng khác, when mở chi tiết học phần, then quyền hiện tại không bị thay đổi.

## Implementation Notes

- URL người dùng gửi không có `tab`/`mode`; khi tài khoản được nhận diện là Giảng viên, trang tự chọn mode đầu tiên được phân công. Mode đó được sửa là hành vi hiện tại theo yêu cầu trước, không phải mode cần overlay.
- Đã chốt áp dụng giới hạn phân công khi route nguồn là danh sách Giảng viên, kể cả với tài khoản vai trò kép. Không thể xác minh mode/phân công thực tế trên trình duyệt tích hợp vì URL chuyển về trang đăng nhập.
- `isLecturer` tiếp tục giới hạn truy cập theo role Giảng viên, nhưng role quản lý cao hơn chỉ bỏ giới hạn khi `returnUrl` không phải danh sách Giảng viên.

## Verification

**Commands:**
- `npm run build` — thành công (Angular AOT).
- `git diff --check` — thành công.
- Test tập trung — implementation agent báo 21 passed, 2 failed do assertion tên tab đã cũ; không chạy lại để giữ nguyên chỉ dẫn trước đó.

**Manual checks:**
- Chưa xác minh đăng nhập trên trình duyệt; trang localhost trong browser tích hợp chuyển về đăng nhập.

## Review Triage Log

1. `false` — Truy vấn chi tiết lặp đúng `id` ở cả nhánh Kế hoạch và nhánh Kiểm tra đánh giá; mỗi nhánh phân công vẫn giới hạn vào học phần đang mở.
2. `false` — `returnUrl` chỉ làm tài khoản có role Giảng viên chịu giới hạn chặt hơn; bỏ tham số chỉ giữ quyền vốn có của role quản lý cao hơn.
3. `false` — `CourseManagementComponent` được khởi tạo sau khi Angular kích hoạt route tương ứng; `Router.url` lúc đó đã chứa path role hiện tại.
4. `false` — Luồng nội bộ chỉ cập nhật `tab`/`mode` và merge các query params; đổi route list sẽ tạo route component mới, nên ngữ cảnh được tính lại.
5. `maybe-false` — Chưa có bằng chứng hồ sơ người dùng có thể trùng; cần xác nhận ràng buộc duy nhất hoặc hợp đồng API trước khi kết luận việc lấy phần tử đầu gây sai phạm vi Khoa/Bộ môn.
6. `false` — Chuyển giữa các route role-specific khác nhau không giữ nguyên component route theo cấu hình hiện tại; các filter signals không mang trạng thái sang role mới.
7. `false` — Khi tải lỗi, template hiển thị nhánh lỗi thay vì bảng cũ; khi retry, `loadCourses()` chuyển state sang loading trước khi hiển thị lại dữ liệu.
8. `false` — Giữ route legacy dưới dạng comment là quyết định đã duyệt trong spec migration; không tạo route hoạt động và không bị thay đổi bởi bugfix hiện tại.
9. `defer` — `needsReview` của editor mô tả cũ vẫn chỉ cảnh báo và không chặn lưu; đây là vấn đề độc lập với ngữ cảnh quyền Giảng viên.

Hai reviewer layer Edge Case và Verification Gap không trả kết quả do lỗi kết nối; các finding từ Blind Hunter đã được kiểm tra trực tiếp.
