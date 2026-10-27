---
title: 'Phân nhóm tab Cài đặt CTĐT'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab ngoài hiện hiển thị nhãn “Định hướng” nhưng đang chứa cả mục tiêu chung, PEO, chuẩn đầu ra và ma trận, khiến nội dung dài và khó tìm.

**Approach:** Đổi nhãn tab ngoài thành “Cài đặt” và thêm bốn tab con “Mục tiêu chung”, “Định hướng”, “Mục tiêu cụ thể”, “Chuẩn đầu ra”. Phân nhóm các section hiện có theo yêu cầu, giữ nguyên API, route/query, phân quyền, lưu dữ liệu và trạng thái soạn thảo.

**Always:** Giữ `tab=muc-tieu`, component/API/model/quyền hiện tại; giữ instance CDR/editor bằng cách ẩn panel thay vì hủy nội dung; hỗ trợ ARIA và bàn phím cho tab con.

**Never:** Không đổi schema/API, không tạo route mới, không tách thành các component nghiệp vụ mới, không làm mất draft hoặc thay đổi quyền `daotao_new`.

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/ctdt-detail.ts` -- metadata tab ngoài; giữ ID `muc-tieu`, đổi label.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component.ts` -- state dữ liệu, draft, CRUD, permission và callback CDR; thêm state/keyboard cho tab con.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component.html` -- các section hiện tại: định hướng, ma trận PEO-định hướng, mục tiêu chung, PEO, CDR và sidebar summary; phân vào bốn panel.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component.css` -- layout grid, scroll và responsive; thêm style tab con/panel ẩn.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-cdr/ctdt-cdr.component.ts` -- component CDR nhúng; không đổi.

## Tasks & Acceptance

**Execution:**
- [x] Đổi label tab ngoài trong `ctdt-detail.ts`.
- [x] Thêm metadata, signal chọn tab và keyboard navigation trong `ctdt-muctieu-cdr.component.ts`.
- [x] Phân nhóm section và ARIA tab panels trong `ctdt-muctieu-cdr.component.html`.
- [x] Cập nhật CSS tab, hidden panel và responsive trong `ctdt-muctieu-cdr.component.css`.
- [x] Build Angular và kiểm tra diagnostics.

**Acceptance Criteria:**
- Given mở URL cũ có `tab=muc-tieu`, when giao diện tải, then tab ngoài hiển thị “Cài đặt” và tab con mặc định là “Mục tiêu chung”.
- Given chọn từng tab con, when chuyển tab, then đúng nhóm nội dung hiển thị, panel khác bị ẩn, editor/CDR và draft không bị hủy.
- Given dùng ArrowLeft/ArrowRight/Home/End trên tab con, when nhấn phím, then tab đúng được chọn và focus chuyển tới nút tương ứng.
- Given lưu hoặc CRUD dữ liệu, when thao tác hoàn tất, then API, thông báo, quyền và ma trận giữ hành vi hiện tại.

## Implementation Notes

- Chuyển khối Hồ sơ & định hướng phát triển vào tab con Hồ sơ phát triển trong Cài đặt bằng component standalone, form và payload lưu ba trường riêng; giữ card/editor cũ khỏi Thông tin chung.
- Test hồ sơ và tab Cài đặt đạt; TypeScript app/spec và diff whitespace đạt.
- Thanh tab giữ nền full width, nhóm 5 tab thu còn khoảng 60% desktop; mobile/tablet tự mở rộng và cuộn ngang.

- Người dùng xác nhận giữ nguyên các thay đổi ngoài phạm vi trong working tree. Không commit/push; chưa kiểm thử với backend dữ liệu thật.
- Đổi nhãn tab ngoài, giữ `muc-tieu` làm ID và query parameter tương thích.
- Thêm tab con bằng ARIA custom tabs, signal cục bộ và phím ArrowLeft/ArrowRight/Home/End; không thêm dependency.
- Chuyển section vào panel `[hidden]`, giữ editor, drawer và CDR instance trong DOM; tab Chuẩn đầu ra gồm CDR và hai khối tổng hợp.
- Chuyển grid hai cột vào panel Chuẩn đầu ra để ba tab đầu dùng toàn bộ chiều rộng.
- Giữ lifecycle và nghiệp vụ hiện có; không mở rộng thay đổi sang CRUD hoặc chuyển tab ngoài. Nhận xét về mất cấu hình sau partial delete bị bác bỏ: cả `resolveConfig()` và `applyDinhHuongRows()` ưu tiên các dòng custom còn lại, không cần marker khi danh sách custom không rỗng.

## Verification

**Commands:**
- `npm run build -- --configuration development-lowram` -- passed; Angular build completed successfully.
- `npx tsc -p tsconfig.app.json --noEmit` and `npx tsc -p tsconfig.spec.json --noEmit` -- passed.
- `npm test -- --watch=false --browsers=ChromeHeadless --include="src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component.spec.ts"` -- passed; 3 specs.
- `git diff --check` -- passed; only line-ending warnings from existing working-tree files.

**Manual checks:**
- Xác nhận bốn tab đúng thứ tự, URL cũ hoạt động, draft editor còn nguyên khi chuyển tab, panel responsive và drawer/ma trận vẫn dùng được.
