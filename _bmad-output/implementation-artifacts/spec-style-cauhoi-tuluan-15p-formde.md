---
title: 'Tinh gọn danh sách câu hỏi tự luận KT 15p'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '1ee0eb14e9e03fcdc4e6212bcdd515c7c98a1570'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Danh sách Câu hỏi tự luận trong Form đề → KT 15p có card cao, metadata nhiều tầng, khoảng trống lớn; chế độ nhúng không hiện ô tìm mã câu hỏi dù đã có bộ lọc.

**Approach:** Chỉ tinh gọn danh sách quản lý câu hỏi: thanh tìm kiếm và số lượng rõ ràng, card nhẹ hơn, metadata trên một hàng có thể xuống dòng, hành động Sửa/Xóa dễ nhận biết. Hướng dẫn chấm dài được thu gọn nhưng có thể mở xem đầy đủ.

## Boundaries & Constraints

**Always:** Giữ nội dung câu hỏi đầy đủ, `safeHtml`, `appKatexImg`, `appLoadMediaOnText`; giữ handlers, điều kiện quyền/disabled và loading/error. Thay đổi chỉ ở HTML/CSS của component mới trong `course-management-detail/children/cauhoi-tuluan-15p`.

**Never:** Không sửa form CDR, màn nhập/sửa câu hỏi, editor, rubric AI, API, component cha Form đề, bản legacy `quanly-monhoc`, Subject hoặc thay đổi chưa commit khác. Không commit; không chạy test tự động hay mutation trên API thật.

## I/O & Edge-Case Matrix

| Tình huống | Trạng thái | Kết quả |
|---|---|---|
| Danh sách nhúng | Chọn Quản lý câu hỏi trong KT 15p | Thêm/Đóng giữ nguyên; có ô tìm mã và số câu khớp bộ lọc |
| Card | Câu hỏi có CĐR, điểm, rubric | Metadata gọn; Sửa/Xóa giữ nguyên quyền và trạng thái đang xóa |
| Nội dung dài | HTML, công thức, ảnh hoặc bảng | Không cắt nội dung; cuộn ngang chỉ bên trong nội dung rộng |
| Hướng dẫn chấm | Có `note` | Thu gọn bằng details/summary; mở bằng chuột hoặc bàn phím, không mất dữ liệu |
| Không có kết quả/lỗi | Danh sách rỗng, lọc không khớp, lỗi tải | Giữ thông báo, nút thêm/tải lại và disabled hiện có |
| Màn hẹp | Khoảng 375–620px | Toolbar xuống dòng, card không tràn ngang, thao tác đủ lớn |
| Ngoài danh sách | Mở nhập/sửa hoặc form CDR | Cấu trúc và style các form giữ nguyên |

</frozen-after-approval>

## Code Map

Thư mục target: `src/app/modules/admin/features/course-management/course-management-detail/children/cauhoi-tuluan-15p/`.

- `cauhoi-tuluan-15p.component.html`: embedded subbar (74–82); `templateListCauhoi` (114–330); form bắt đầu ở `templateLessonForm` (332) và `templateQuestion` (415), không sửa các form này.
- `cauhoi-tuluan-15p.component.css`: danh sách/card (284–365), toolbar độc lập (214–281), responsive list (556–594). Các selector drawer/form và style dùng chung ngoài danh sách không thay đổi.
- `cauhoi-tuluan-15p.component.ts`: tái sử dụng `search_id_question`, `cdrFilteredQuestions`, `selectedQuestionCdr`, `openAddCauhoi`, `editCauhoi`, `deleteCauhoi`; không sửa TypeScript.
- `../monhoc-formde/monhoc-formde.component.html:415–420`: parent nhúng với context, closed/changed; không sửa parent.

## Tasks & Acceptance

**Execution:**
- [x] `cauhoi-tuluan-15p.component.html` — thêm ô tìm mã vào subbar nhúng, sử dụng đúng pipe/filter hiện có; count hiển thị số câu khớp. Giữ nguyên CĐR đã chọn từ context.
- [x] `cauhoi-tuluan-15p.component.html` — tinh gọn card header; giữ nhãn Sửa/Xóa và bổ sung aria-label/tooltip theo mã câu. Chuyển note trong card sang details/summary, không thay nội dung hay directive.
- [x] `cauhoi-tuluan-15p.component.css` — spacing card 10–12px, gap 8–10px, metadata một hàng wrap; giảm bóng/gradient; toolbar linh hoạt thay chiều rộng cố định. Scope mọi đổi mới dưới subbar hoặc workspace danh sách, tránh tác động drawer.
- [x] `cauhoi-tuluan-15p.component.css` — responsive, focus-visible và touch target tối thiểu 44px ở màn hẹp; giữ font/token quản trị sẵn có.
- [x] Rà soát diff, diagnostics và build; ghi rõ kiểm tra nào không chạy.

**Acceptance Criteria:**
- Given màn KT 15p nhúng, when nhập mã tìm kiếm, then danh sách/count thay đổi đúng bộ lọc hiện có và xóa tìm kiếm khôi phục danh sách.
- Given danh sách có nội dung dài, when thu hẹp màn hình, then card/toolbar không tràn khung; nội dung câu hỏi vẫn xem đầy đủ.
- Given tài khoản chỉ xem, when mở danh sách, then không mở được thao tác thêm/sửa/xóa bị khóa trước đó.
- Given mở nhập/sửa câu hỏi hoặc form CDR, when áp dụng style mới, then không thay template/binding/style của các form.

## Implementation Notes

- Chỉ thay HTML/CSS trước `templateLessonForm`; không sửa TypeScript, parent, form CDR hoặc drawer nhập/sửa.
- Embedded subbar dùng `search_id_question` và pipe `filter` có sẵn; count phản ánh danh sách sau tìm mã.
- Card question giảm padding/shadow, đưa metadata cùng hàng; thao tác vẫn có nhãn và thêm aria/tooltip theo ID.
- Hướng dẫn AI chấm dùng `details/summary`, giữ nguyên `appLoadMediaOnText` và `safeHtml`.
- Không chạy unit test theo yêu cầu/ranh giới spec; chưa chạy browser manual.

## Spec Change Log

- 2026-11-10: Thu hẹp theo yêu cầu “chỉ phần câu hỏi tự luận thôi”; loại bỏ cải tiến form CDR và màn nhập/sửa khỏi spec trước khi duyệt.

## Review Triage Log

| Finding | Verdict | Action |
|---|---|---|
| Form CDR/drawer hoặc TypeScript bị thay đổi ngoài phạm vi | false | So sánh từ `<ng-template #templateLessonForm>` đến cuối HTML và TypeScript với baseline: không thay đổi. |
| List có thể tràn ngang ở màn hẹp | maybe-false | CSS có `min-width: 0` và wrap; chưa kiểm chứng kích thước thực trong trình duyệt ở 375px, nên chưa kết luận không tràn ngang. |
| Tìm mã trong embedded mode chưa có automated test | low, rejected | Khoảng trống xác minh có thật; frozen scope cấm chạy automated test và chỉ cho sửa HTML/CSS, nên không thêm spec test. Build/template diagnostics đã kiểm tra; browser manual vẫn là giới hạn. |
| Disclosure hướng dẫn AI chưa có automated interaction test | low, rejected | Khoảng trống xác minh có thật; thêm test vượt ranh giới đã duyệt. Dùng native `details/summary` với focus-visible, giữ nguyên nội dung/directive; chưa browser manual. |

## Verification

- `npm run build`: PASS, Angular build thành công.
- VS Code diagnostics target HTML/CSS: sạch.
- `git diff --check`: PASS; chỉ cảnh báo LF/CRLF có sẵn.
- So sánh phần từ `templateLessonForm` trở xuống với baseline: không đổi.
- So sánh TypeScript component với baseline: không đổi.
- Unit test: không chạy theo ranh giới spec/user request.
- Browser manual: chưa chạy; cần mở Form đề → KT 15p ở desktop/375px để xác nhận cảm nhận spacing thực tế.
