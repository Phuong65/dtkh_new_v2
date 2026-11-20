---
title: 'Chuyển các route quản lý môn học sang course-management'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'e241c983e0ca474aa95f71e312299b19a99fa401'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Các route quản lý môn học của Đào tạo, Giảng viên, Lãnh đạo khoa và Lãnh đạo bộ môn vẫn tải các component trong `features/quanly-monhoc`, trong khi bộ component mới nằm trong `features/course-management`.

**Approach:** Chuyển các route liên quan sang component tương ứng trong `features/course-management`, giữ nguyên các giới hạn quyền và phạm vi dữ liệu theo vai trò.

**Route decisions:** Bốn route gốc theo vai trò hiển thị `CourseManagementComponent`; khi chọn học phần, mở trang `CourseManagementDetail` theo route `/hoc-phan?code=...` hiện có.

**Actions decision:** Không bổ sung các thao tác thêm/sửa/xóa cũ vào danh sách mới; giữ các thao tác vốn có của `CourseManagementComponent`.

**Legacy route decision:** Comment các route con `monhoc-*` trong router cũ; không tạo alias. Chi tiết chỉ mở từ danh sách mới qua `/hoc-phan?code=...`.

**Always:** Không làm mất giới hạn dữ liệu theo giảng viên, khoa hoặc bộ môn. Giữ các đường dẫn hiện có trừ khi người dùng chọn đổi chiến lược.

**Never:** Không đổi nghiệp vụ API hoặc sửa các consumer không phải router chỉ vì chúng còn import tiện ích từ `features/quanly-monhoc`.

</frozen-after-approval>

## Code Map

- `modules/admin/routings/dao-tao/dao-tao-routing.module.ts` -- route `quanly-monhoc` của Đào tạo.
- `modules/admin/routings/giang-vien/giang-vien-routing.module.ts` -- route của Giảng viên.
- `modules/admin/routings/lanhdao-khoa/lanhdao-khoa-routing.module.ts` -- route của Lãnh đạo khoa.
- `modules/admin/routings/lanhdao-bomon/lanhdao-bomon-routing.module.ts` -- route của Lãnh đạo bộ môn.
- `modules/admin/features/quanly-monhoc/quanly-monhoc-routing.module.ts` -- router cũ, gồm danh sách và bảy route chi tiết; áp dụng `AdminGuard`.
- `modules/admin/features/quanly-monhoc/danhsach-monhoc/danhsach-monhoc.component.ts` -- danh sách cũ lọc theo `creator_plan_id`, `category_ids`, `nganh_bomon_id`; có thao tác thêm/sửa/import/báo cáo.
- `modules/admin/features/course-management/course-management.component.ts` -- danh sách mới; scope theo route vai trò, lọc giảng viên/khoa/bộ môn và chỉ hiện bộ lọc dành cho Đào tạo/quản trị.
- `modules/admin/features/course-management/course-management.component.html` -- tên học phần đã dùng route `/hoc-phan?code=...` hiện có.
- `modules/admin/features/course-management/course-management-detail/course-management-detail.ts` -- shell chi tiết hiện đã được route tại `/hoc-phan`.
- `app-routing.module.ts` -- route chuẩn `/hoc-phan` tải `CourseManagementDetail`.
- `modules/admin/admin-routing.module.ts` và `core/guards/admin.guard.ts` -- guard cấp cha kiểm tra quyền theo URL; giữ nguyên path `quanly-monhoc` để giữ permission key hiện có.
- Các import tiện ích `PlanActivityCdr` từ thư mục cũ không phải route và nằm ngoài phạm vi.

## Tasks & Acceptance

**Execution:**
- [x] Trong bốn router Đào tạo/Giảng viên/Lãnh đạo khoa/Lãnh đạo bộ môn, thay `loadChildren` trỏ `QuanlyMonhocModule` bằng `CourseManagementComponent` tại cùng path `quanly-monhoc`.
- [x] Comment toàn bộ route cây cũ trong `quanly-monhoc-routing.module.ts`, gồm danh sách và các URL `monhoc-*`; không xóa file/module.
- [x] Cập nhật `CourseManagementComponent` để lọc danh sách theo vai trò (giảng viên: `creator_plan_id` hoặc `creator_exam_id`; lãnh đạo khoa: `category_ids`; lãnh đạo bộ môn: `nganh_bomon_id`), đồng thời chỉ hiện bộ lọc phù hợp với vai trò.
- [x] Giữ điều hướng từ tên học phần tới route `/hoc-phan?code=...`; không thêm thao tác danh sách cũ.
- [x] Với Giảng viên, giới hạn URL chi tiết vào các mode được phân công; không áp dụng kiểm tra assignment cho role cao hơn.
- [x] Chặn việc đổi query `tab`/`mode` sang phần không được phân công sau khi trang đã tải.

**Acceptance Criteria:**
- Given người dùng thuộc một trong bốn vai trò, when mở route `quanly-monhoc`, then route tải danh sách mới và chỉ hiển thị học phần đúng phạm vi vai trò.
- Given người dùng chọn tên học phần từ danh sách mới, when điều hướng, then `CourseManagementDetail` hiện có mở với đúng `code`.
- Given giảng viên mở trực tiếp URL chi tiết, when tải học phần, then chỉ phần khớp `creator_plan_id`/`creator_exam_id` của chính giảng viên được mở; role cao hơn không bị kiểm tra assignment này.
- Given người dùng mở URL chi tiết cũ `monhoc-*`, when router được cấu hình mới, then các route cũ không còn hoạt động và được giữ dưới dạng comment trong router legacy.
- Given người dùng không có quyền truy cập học phần, when tải chi tiết, then hành vi từ chối hiện có vẫn được giữ nguyên.

## Implementation Notes

- Bốn route giữ nguyên URL và tải `CourseManagementComponent`; vai trò được xác định theo route đang mở để tài khoản nhiều vai trò không vô tình nhận phạm vi rộng hơn.
- Thiếu hồ sơ hoặc mã Khoa/Bộ môn thì danh sách fail-closed và báo lỗi; không gửi yêu cầu API với ID thay thế.
- Liên kết chi tiết mang theo `returnUrl` nằm trong allowlist để nút quay lại trở về đúng danh sách vai trò; menu tab cũ trỏ tới các route `monhoc-*` đã được gỡ.
- Giảng viên chỉ thấy mode Kế hoạch giảng dạy khi khớp `creator_plan_id` và mode Kiểm tra đánh giá khi khớp `creator_exam_id`; không khớp trường nào thì từ chối URL trực tiếp. Các role quản lý/đào tạo/lãnh đạo được miễn kiểm tra assignment.

## Verification

**Commands:**
- `npm run build` — thành công (Angular AOT; sau cập nhật kiểm tra quyền theo phần được phân công).
- Không chạy test theo yêu cầu người dùng.

**Manual checks:**
- Chưa thực hiện kiểm tra thủ công trên trình duyệt.

## Review Triage Log

| Verdict | Evidence | Route |
| --- | --- | --- |
| medium | Khi thử lại sau lỗi tải hồ sơ, giao diện còn giữ thông báo lỗi trong lúc chờ; `loadRoleScope()` nay chuyển sang trạng thái loading và xóa lỗi trước khi gọi lại. Build AOT thành công. | patch — fixed |
| false | Finding cho rằng truy vấn chi tiết có thể trả về học phần khác: hai nhánh `creator_plan_id`/`creator_exam_id` đều kèm điều kiện `id` bằng đúng mã được yêu cầu; precedence AND/OR giữ nguyên điều kiện id ở mỗi nhánh. | rejected |
| false | Finding cho rằng truy vấn danh sách giảng viên bỏ qua bộ lọc chung: điều kiện chung được lặp lại ở nhánh kế hoạch và nhánh kiểm tra đánh giá; status/search/filter vẫn áp dụng cho cả hai nhánh. | rejected |
| medium | `courseListReturnUrl` trước đây thiếu tiền tố `/admin`, nên không khớp allowlist và nút quay lại rơi về trang Đào tạo; đã sửa để tạo URL đầy đủ `/admin/${routePath}`. | patch — fixed |
| medium | Finding độc lập về URL quay lại chỉ ra cùng nguyên nhân: URL do danh sách tạo không khớp allowlist. Sửa cùng `courseListReturnUrl`; test quay lại role-specific đã được thêm. | patch — fixed |
| false | Finding cho rằng có thể render học phần khác `code`: cả hai nhánh truy vấn chi tiết đều giới hạn bằng cùng `id` yêu cầu, trước khi kết quả được chấp nhận. | rejected |
| false | Trong danh sách Giảng viên, nếu học phần được giao cho người dùng ở `creator_exam_id`, tên hiển thị người phụ trách dùng chính người được giao; ở các route quản lý vẫn dùng `creator_plan_id`. Không có quy tắc trong intent yêu cầu ưu tiên người lập kế hoạch cho danh sách Giảng viên. | rejected |
| low | Đã thêm kiểm tra component cho scope Giảng viên/Khoa/Bộ môn và trường hợp thiếu scope; test sources được TypeScript kiểm tra, nhưng không chạy suite theo yêu cầu trong spec. | patch — partially verified |
| medium | Không thực hiện kiểm tra thủ công trình duyệt; vì vậy điều hướng route/returnUrl và hành vi danh sách theo vai trò chưa được xác nhận end-to-end. | defer — browser verification |
| low | Finding thiếu test scope danh sách đã được xử lý bằng test cho hai assignment Giảng viên, scope Khoa/Bộ môn và fail-closed khi thiếu hồ sơ; test chưa được chạy theo spec. | patch — partially verified |
| low | Đã thêm assertion kiểm tra điều kiện truy vấn cho Giảng viên, kiểm tra role cao hơn không nhận điều kiện assignment, và test quay lại allowlist; chỉ type-check, không chạy test theo spec. | patch — partially verified |
| medium | Lớp review chỉ ra thiếu kiểm tra `creator_exam_id` cho quyền sửa ở ba component exam; đã thêm case cho Form đề, nhưng `monhoc-question-cdr` và `monhoc-kiemtra-danhgia` chưa có regression test riêng. | defer — child edit coverage |
| low | Finding về test list không còn đúng sau khi thêm `course-management.component.spec.ts`; các case đã có chưa được thực thi. | patch — partially verified |
| low | Finding về assertion truy vấn chi tiết đã được xử lý bằng assertion `ConditionOption` cho GV và role cao hơn; test chưa được thực thi theo yêu cầu. | patch — partially verified |
| medium | Quyền chỉnh sửa ở Form đề, Phân bổ CĐR và Kiểm tra đánh giá phụ thuộc vào phân công `creator_exam_id`; chỉ Form đề hiện có regression test mới, hai component còn lại chưa được kiểm thử. | defer — child edit coverage |
| medium | Các case kiểm thử mới không được chạy theo chỉ dẫn ở phần Verification; build xác nhận compile nhưng không xác nhận kết quả runtime của các ràng buộc vai trò. | defer — test execution |
