---
title: 'Cập nhật Input Group ma trận câu hỏi/CDR'
type: 'feature'
created: '2026-10-14'
status: 'in-progress'
route: 'dispatch'
baseline_commit: 'e9ab123df451f0ef510e7bf545a21ed8a0b5afc9'
review_loop_iteration: 0
context:
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html'
  - 'E:/New folder (3)/dtkh_new_v2/src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cụm điều khiển phân bổ số câu hỏi theo CDR hiện đã dùng `p-inputgroup` nhưng addon, input và đường viền chưa tạo thành một control liền khối nhất quán. Khoảng đệm, kích thước chữ và trạng thái tương tác chưa làm nổi bật vùng nhập số trong ma trận câu hỏi/CDR.

**Approach:** Giữ nguyên cấu trúc và dữ liệu hiện tại của mỗi ô: addon trái `[mức tối thiểu ≤]`, input số ở giữa, addon phải `[= tỷ lệ %]`. Chuẩn hoá nhóm thành Input Group liền khối trong phạm vi component, với viền xám, bo góc ngoài, padding compact, font dễ đọc và focus/hover rõ ràng; không thay đổi logic phân bổ, tính tỷ lệ, validation hoặc lưu dữ liệu.

## Boundaries & Constraints

**Always:** Giữ nguyên thứ tự ba phần `[Trái ≤] [Input Số] [= Tỷ lệ %]`, binding `[(ngModel)]`, event `keyup`, `keydown`, `#inputNumberQuestion`, `type="number"`, class `p-inputgroup`/`p-inputgroup-addon` và khả năng chuyển focus bằng Tab. Chỉ áp dụng style cho component `monhoc-question-cdr`. Addon giữ nền trung tính, chữ tương phản đủ, input có focus ring nhìn thấy được bằng chuột và bàn phím. Trạng thái dòng CDR lỗi màu đỏ vẫn được ưu tiên hiển thị.

**Never:** Không đổi tên biến, cấu trúc dữ liệu `cdr_cauhoi`/`cdr_percent`, công thức hoặc ngưỡng validation; không thay API, không thêm thư viện UI, không thay layout bảng hoặc sidebar; không dùng hover làm cơ chế duy nhất để truyền trạng thái; không xoá outline/focus indicator nếu chưa có thay thế rõ ràng.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Giá trị hợp lệ | Người dùng nhập số nguyên không âm | Input cập nhật như hiện tại, tỷ lệ bên phải cập nhật, group không nhảy layout | Không đổi xử lý hiện tại |
| Focus bàn phím | Tab tới input hoặc click input | Input có focus ring rõ; ba phần vẫn liền khối, không che nội dung lân cận | Không mất khả năng Tab |
| Hover group | Di chuột qua input/addon | Viền hoặc nền phản hồi nhẹ, không làm thay đổi giá trị hay trạng thái validation | Không dùng animation gây rung layout |
| Dòng bị cảnh báo | `require_cdr` hoặc điều kiện CDR không đạt | Màu cảnh báo hiện tại vẫn thắng style trung tính của group | Không che màu đỏ bằng selector mới |
| CDR bị disabled | `cdr.disabled === true` | Không hiển thị input editable như hiện tại; header disabled không bị ảnh hưởng | Không mở rộng style sang component khác |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html` — vùng table body khoảng dòng 117–135 đã có `div.p-inputgroup`, addon trái hiển thị `min_cdr_question` và `≤`, input số bind `child.cdr_cauhoi[cdr.id]`, addon phải hiển thị `cdr_percent` và `%`. Chỉ chỉnh class/markup tối thiểu nếu cần để style ổn định; giữ nguyên binding và event.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css` — các selector scoped hiện tại khoảng dòng 150–183 điều khiển group, addon và input; dòng 8–13 có `.tag-cdr-cauhoi-percent` cũ. Tập trung thay thế/chuẩn hoá các selector này, tránh ảnh hưởng `.phanbo-cdr-layout` khác.
- `src/app/modules/admin/features/quanly-kehoach-hoctap/phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component.css` — pattern tương đồng cho `p-inputgroup`; dùng làm tham chiếu cấu trúc, nhưng không sửa file này.
- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.ts` — `setNumberCdrCauhoi`, `checkCdrCourse`, `saveCdrQuestion` xử lý tính toán/validation/lưu; không cần thay đổi.

## User Stories & Acceptance

### Story 1 — Nhập số trong Input Group liền khối

**Là** người phân bổ câu hỏi theo CDR, **tôi muốn** mỗi ô hiển thị một cụm `[mức tối thiểu ≤] [số câu hỏi] [= tỷ lệ %]` gọn và rõ, **để** nhận biết ràng buộc và kết quả ngay tại chỗ.

**Phụ thuộc:** Không. Đây là nền tảng cho Story 2.

**Thực hiện:**
- [x] `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html` — chỉ thêm class/markup cần thiết cho nhóm ba phần; giữ nguyên ngModel, type, event và thứ tự DOM.
- [x] `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css` — viền xám liền mạch không double border; bo góc ngoài; addon padding đồng đều, font dễ đọc; input flex co giãn trong ô bảng, cao khoảng 30–32px.

**Acceptance Criteria:**
- **Given** CDR có thể chỉnh sửa, **when** bảng hiển thị, **then** đúng ba phần theo thứ tự trái–giữa–phải, không có khoảng hở hoặc đường viền chồng nhau.
- **Given** số tối thiểu hoặc tỷ lệ có một hay nhiều chữ số, **when** giá trị được render, **then** addon hiển thị trọn nội dung; input còn vùng nhập nhìn thấy được, không đè chữ.
- **Given** vùng bảng hẹp hoặc sidebar được đóng/mở, **when** kích thước ô thay đổi, **then** nhóm không làm tràn body trang hay che dữ liệu; cuộn bảng hiện hữu vẫn dùng được.
- **Given** người dùng nhập số, **when** Angular xử lý `keyup`, **then** `child.cdr_cauhoi[cdr.id]`, tỷ lệ và tổng số vẫn cập nhật theo logic cũ.

### Story 2 — Trạng thái tương tác và cảnh báo dễ nhận biết

**Là** người nhập bằng chuột hoặc bàn phím, **tôi muốn** cụm nhập phản hồi khi hover/focus mà không che cảnh báo, **để** xác định đúng ô đang thao tác.

**Phụ thuộc:** Story 1 hoàn tất.

**Thực hiện:**
- [x] `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.css` — hover nhẹ trên cụm; focus indicator tương phản, không đổi kích thước; giữ ưu tiên màu đỏ của `.require-cdr-backgroud-color`; giới hạn selector vào cụm trong component.
- [x] `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/monhoc-question-cdr.component.html` — chỉ bổ sung tên truy cập cho input nếu kiểm tra cho thấy thiếu; không thay binding, event hoặc Tab navigation.

**Acceptance Criteria:**
- **Given** con trỏ hover trên cụm, **when** hover bắt đầu/kết thúc, **then** viền/nền đổi nhẹ và trở lại bình thường; vị trí, kích thước và số liệu không đổi.
- **Given** người dùng click hoặc Tab tới input, **when** input nhận focus, **then** focus indicator hiện rõ quanh vùng nhập/cụm và không bị bảng cắt mất.
- **Given** dòng CDR đang vi phạm quy tắc, **when** hover hoặc focus, **then** chữ cảnh báo đỏ vẫn nhìn thấy trên dòng, input và addon; trạng thái focus vẫn phân biệt được.
- **Given** `cdr.disabled`, **when** bảng hiển thị, **then** không xuất hiện input mới và header disabled giữ nguyên.
- **Given** người dùng nhập, nhấn Tab và lưu, **when** thao tác hoàn tất, **then** thứ tự focus, ràng buộc dữ liệu, cảnh báo và kết quả lưu không thay đổi.

**Hoàn thành chung:** `npm run build` thành công; kiểm tra thủ công cả hai story trên dữ liệu có CDR thường, disabled và cảnh báo. Không sửa TypeScript, API, component tương tự ở module khác.

## Implementation Notes

Phạm vi lần triển khai được người dùng duyệt: **chỉ Story 1**. Story 2 (hover/focus/cảnh báo) để dành cho yêu cầu sau; không đánh dấu Story 2 hoàn thành và không thêm trạng thái tương tác mới. Chỉ sửa HTML/CSS của component tại `course-management`; không thay TypeScript hoặc component cùng tên ở `quanly-monhoc`. Matrix dòng hover/focus thuộc Story 2, không phải gate hoàn thành Story 1. Tôn trọng mọi thay đổi có sẵn trong working tree. UI guidance: giữ `type="number"`, giữ focus hiện hữu; kiểm tra selector `:host ::ng-deep` trước khi thay đổi để không mở rộng phạm vi ngoài component.

Đã triển khai Story 1 trong `monhoc-question-cdr.component.html` và `.css`: thêm class cục bộ cho ba phần; nhóm cao 32px, viền nối không chồng, bo góc ngoài, input co giãn; addon co theo nội dung để không cắt tỷ lệ dài. Không sửa TS. `npm run build` thành công ngày 2026-10-14; `git diff --check` sạch; VS Code diagnostics không báo lỗi cho CSS. Code-review agent cuối không xác minh được do chạy trong checkout cô lập không chứa target path; không coi đó là phê duyệt. Chưa kiểm tra trực quan bằng trình duyệt trên dữ liệu thực; Story 2 còn mở.

### Triển khai Story 2

Người dùng đã duyệt Story 2 ở lượt tiếp theo; giới hạn chỉ Story 1 ở ghi chú trước là lịch sử, không còn là phạm vi hiện tại. Đã thêm hover viền xám không đổi kích thước, chỉ báo focus nằm trong ô nhập và `aria-label` gồm tên mức CDR cùng ký hiệu dòng. Không đổi binding/event/TypeScript, điều kiện disabled hoặc logic lưu. `npm run build` thành công; `git diff --check` sạch. VS Code chỉ báo hint `styleClass` deprecated có sẵn ở bảng. Chưa xác minh trực quan và luồng lưu với dữ liệu thực; chưa đánh dấu mọi AC hoàn tất.

## Design Notes

Thiết kế ưu tiên mật độ cao phù hợp bảng quản trị: addon cố định độ rộng vừa đủ nội dung, input chiếm phần còn lại, chiều cao khoảng 30–32px theo pattern hiện tại. Bo góc chỉ ở đầu trái/phải của group; phần nối giữa dùng border chung. Hover chỉ tăng nhẹ độ tương phản; focus dùng outline/box-shadow có offset để không làm control nhảy kích thước.

## Verification

**Commands:**
- `npm run build` -- expected: Angular build hoàn tất không có lỗi template hoặc CSS.

**Manual checks:**
- Mở màn hình course-management có ma trận câu hỏi/CDR; kiểm tra CDR editable, CDR disabled, dòng cảnh báo, nhập số, hover, focus bằng Tab và viewport hẹp. Xác nhận không thay đổi số liệu, tỷ lệ, validation hoặc thao tác Lưu.
