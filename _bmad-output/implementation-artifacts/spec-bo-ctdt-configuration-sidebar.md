---
title: 'Phiên cấu hình Bộ CTĐT'
type: 'feature'
created: '2026-11-10'
status: 'in-progress'
route: 'dispatch'
baseline_commit: 'cfd925ddace277eee77da5b4c6eca9a46c233c45'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Gộp sửa thông tin, PEO và PLO của Bộ CTĐT vào một phiên cấu hình giống subject-template-detail. Sidebar đúng ba mục lớn **Thông tin chung / PEO / PLO**, không mục con. Nội dung, biểu mẫu thêm/sửa nằm trực tiếp bên phải.

## Boundaries & Constraints

**Always:**
- Một nút Cấu hình thay nút sửa và hai nút PEO/PLO ở bảng. Mở mặc định Thông tin chung; đóng quay lại trang/bộ lọc cũ.
- Thông tin chung gồm mã, tên, năm, Khoa áp dụng; lưu riêng. PLO vẫn quản lý cả PI con.
- Dùng API, validation, quyền và xác nhận xóa hiện có; chế độ chỉ đọc vẫn xem được.
- Chặn chuyển mục/đóng khi đang ghi dữ liệu. Xác nhận trước khi bỏ bản nháp chưa lưu; lỗi lưu giữ draft.
- Giữ tạo mới, chọn môn học bằng drawer ngoài phiên, xóa Bộ CTĐT và click tên mở chương trình như hiện tại.
- Làm trên workspace hiện tại, giữ thay đổi khác; người dùng đã xác nhận.

**Never:** thêm route; thêm mục sidebar thứ tư; drawer thêm/sửa trong phiên; chạy test/build; commit.

## I/O & Edge-Case Matrix

| Trường hợp | Kết quả |
|---|---|
| Mở Cấu hình | Header tên/mã, X, ba mục sidebar, form chung inline |
| Chọn PEO/PLO | Chỉ section tương ứng được mount/tải |
| Thêm/sửa PEO/PLO/PI | Editor inline, Lưu/Hủy trong main, không drawer |
| Lưu thông tin thành công | Cập nhật header và row list, đánh dấu pristine |
| Lưu lỗi | Thông báo lỗi, giữ nguyên draft |
| Chuyển mục/đóng khi dirty | Xác nhận; hủy xác nhận giữ nguyên nội dung |
| Lưu/xóa/confirm đang chạy | Không chuyển context, tránh callback trên section đã hủy |
| Quyền chỉ đọc | Cho xem; chặn sửa/lưu và CRUD trái quyền |

</frozen-after-approval>

## Code Map

Gốc thay đổi: `src/app/modules/admin/features/bo-ctdt/bo-ctdt/`.
- `bo-ctdt.component.ts/html/css`: hiện dùng selectedTemplateBo/selectedPeoBo, boForm, loadFormDonVi, normalizeCategoryIds, IctuFormControl2; chọn môn học là luồng riêng, không sửa.
- `bo-ctdt-peo/bo-ctdt-peo.component.ts/html/css`: input selectedBo/quyền; own form, drawerVisible, busy, loadRows/submit/deleteRow và cancelContext$.
- `bo-ctdt-cdr/bo-ctdt-cdr.component.ts/html/css`: tương tự, thêm parent/PI/percent validation và PLO expand.
- `src/app/modules/shared/services/bo-ctdt.service.ts`: update trả BoCtdt; không đổi service.
- `src/app/modules/admin/features/subject-management/subject-template-detail/`: mẫu layout sáng và keyboard sidebar; không sửa component này.
- `src/app/core-new/service/notification.service.ts`: confirm cho draft, confirmDelete2 cho xóa.

## Tasks & Acceptance

- [ ] `bo-ctdt.component.ts`: selectedConfigBo + activeConfigSection, mở/đóng, guard draft/busy, keyboard/focus. Tách lưu inline khỏi trạng thái drawer tạo mới; cập nhật row/header mà không reset phiên.
- [ ] `bo-ctdt.component.html/css`: một nút Cấu hình, sidebar ba mục, form chung inline có Lưu/Hủy; giữ drawer ngoài phiên. Dùng lại markup form qua template nếu hợp lý, không duplicate ID.
- [ ] `bo-ctdt-peo/bo-ctdt-peo.component.ts/html/css`: thêm embedded=false, header riêng chỉ standalone, dùng chung editor template cho inline/drawer, giữ CRUD. Expose busy/dirty cho shell; chặn ghi đè draft khi mở editor khác.
- [ ] `bo-ctdt-cdr/bo-ctdt-cdr.component.ts/html/css`: cùng hợp đồng embedded, bảo toàn PLO/PI và tỷ lệ PI; không nhân đôi logic API.
- [ ] CSS embedded dùng chiều cao vùng chứa thay viewport; sidebar trắng, focus-visible, ARIA, scroll main; tooltip trái, nút X danger-reverse.
- [ ] Bổ sung/điều chỉnh spec kiểm thử component phù hợp ma trận trên nhưng không chạy. Review và diagnostics tĩnh các file thay đổi.

**Acceptance Criteria:**
- Given bảng Bộ CTĐT, when mở Cấu hình, then chỉ có ba mục sidebar, mặc định Thông tin chung.
- Given mỗi mục, when thêm/sửa, then mọi form trong phiên nằm inline và quyền vẫn được kiểm tra.
- Given draft hoặc request đang chạy, when chuyển/đóng, then không mất draft hoặc hủy request ghi âm thầm.
- Given quay lại list, when dùng tạo mới/chọn môn học/xóa/mở chương trình, then luồng cũ vẫn được giữ.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Không chạy test/build. Dùng VS Code diagnostics và review mã; phân biệt diagnostics rỗng với đã kiểm chứng runtime. Kiểm tra cấu trúc ba mục, readonly, dirty/busy, lỗi API, update row, editor inline, đồng thời giữ độc lập hai drawer bên ngoài. Bàn giao checklist UI cho người dùng; không khẳng định đã kiểm thử trình duyệt.
