---
title: 'Chuyển các route quản lý môn học sang course-management'
type: 'feature'
created: '2026-11-19'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các route quản lý môn học của Đào tạo, Giảng viên, Lãnh đạo khoa và Lãnh đạo bộ môn vẫn tải các component trong `features/quanly-monhoc`, trong khi bộ component mới nằm trong `features/course-management`.

**Approach:** Chuyển các route liên quan sang component tương ứng trong `features/course-management`, giữ nguyên các giới hạn quyền và phạm vi dữ liệu theo vai trò.

**Route decisions:** Bốn route gốc theo vai trò hiển thị `CourseManagementComponent`; khi chọn học phần, mở trang `CourseManagementDetail` theo route `/hoc-phan?code=...` hiện có.

**Actions decision:** Không bổ sung các thao tác thêm/sửa/xóa cũ vào danh sách mới; giữ các thao tác vốn có của `CourseManagementComponent`.

**Always:** Không làm mất giới hạn dữ liệu theo giảng viên, khoa hoặc bộ môn. Giữ các đường dẫn hiện có trừ khi người dùng chọn đổi chiến lược.

**Never:** Không đổi nghiệp vụ API hoặc sửa các consumer không phải router chỉ vì chúng còn import tiện ích từ `features/quanly-monhoc`.

</frozen-after-approval>

## Open Questions

1. Các URL con cũ như `monhoc-thongtin`, `monhoc-muctieu`, `monhoc-noidung`, `monhoc-cauhinh` có nên tiếp tục hoạt động?
   - **A — Giữ alias (đề xuất):** Mỗi URL cũ tải `CourseManagementDetail` và chọn tab tương ứng; giữ bookmark/liên kết cũ, gồm cả tab Cấu hình.
   - **B — Bỏ URL con cũ:** Chỉ giữ danh sách tại route `quanly-monhoc`; người dùng mở chi tiết qua `/hoc-phan?code=...`; bookmark cũ không còn hoạt động.

## Code Map

- `modules/admin/routings/dao-tao/dao-tao-routing.module.ts` -- route `quanly-monhoc` của Đào tạo.
- `modules/admin/routings/giang-vien/giang-vien-routing.module.ts` -- route của Giảng viên.
- `modules/admin/routings/lanhdao-khoa/lanhdao-khoa-routing.module.ts` -- route của Lãnh đạo khoa.
- `modules/admin/routings/lanhdao-bomon/lanhdao-bomon-routing.module.ts` -- route của Lãnh đạo bộ môn.
- `modules/admin/features/quanly-monhoc/quanly-monhoc-routing.module.ts` -- router cũ, gồm danh sách và bảy route chi tiết; áp dụng `AdminGuard`.
- `modules/admin/features/quanly-monhoc/danhsach-monhoc/danhsach-monhoc.component.ts` -- danh sách cũ lọc theo `creator_plan_id`, `category_ids`, `nganh_bomon_id`; có thao tác thêm/sửa/import/báo cáo.
- `modules/admin/features/course-management/course-management.component.ts` -- danh sách mới; hiện chưa áp dụng scope dữ liệu cho ba vai trò không quản trị/đào tạo và không có các thao tác thêm/sửa/import/báo cáo.
- `modules/admin/features/course-management/course-management-detail/course-management-detail.ts` -- shell chi tiết hiện hỗ trợ sáu tab qua query param `tab`; quay lại cố định về danh sách Đào tạo; chưa có tab Cấu hình.
- `modules/admin/features/course-management/course-management-detail/children/` -- các component chi tiết mới tương ứng, gồm `monhoc-cauhinh`.
- `app-routing.module.ts` -- route chuẩn `/hoc-phan` tải `CourseManagementDetail`.
- Các import tiện ích `PlanActivityCdr` từ thư mục cũ không phải route và nằm ngoài phạm vi.

## Tasks & Acceptance

**Execution:**
- [ ] Tạo route group trong `features/course-management` và chuyển cả bốn route vai trò sang route group mới, giữ `AdminGuard`.
- [ ] Ánh xạ danh sách và mọi route con sang component `course-management` theo quyết định ở câu hỏi 1.
- [ ] Bảo toàn lọc dữ liệu và quyền theo vai trò; xử lý các chức năng danh sách theo quyết định ở câu hỏi 2.

**Acceptance Criteria:**
- Given người dùng thuộc một trong bốn vai trò, when mở route `quanly-monhoc`, then route tải danh sách mới và chỉ hiển thị học phần đúng phạm vi vai trò.
- Given người dùng mở một route con hiện có, when route được kích hoạt, then component/tab tương ứng trong `course-management` được hiển thị và giữ đúng mã học phần.
- Given người dùng không có quyền truy cập học phần, when tải chi tiết, then hành vi từ chối hiện có vẫn được giữ nguyên.

## Implementation Notes

## Verification

**Commands:**
- Không chạy test theo yêu cầu người dùng; có thể chạy build để xác nhận route/component compile.

**Manual checks (if no CLI):**
- Kiểm tra route danh sách và từng route con trong bốn base route; xác nhận lọc theo vai trò và query `code`.
