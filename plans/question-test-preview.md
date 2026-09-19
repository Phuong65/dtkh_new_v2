# Kế hoạch chức năng - Kiểm thử câu hỏi trong create-form

## Phạm vi hiện tại

Luồng kiểm thử nằm trong nhóm chức năng tạo/sửa câu hỏi trắc nghiệm v2.

File chính:

- [cauhoi-tracnghiem-create-form.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component.ts)
- [cauhoi-tracnghiem-chitiet.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.html)
- [question-test-preview.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/question-test-preview/question-test-preview.component.ts)
- [question-test-preview.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/question-test-preview/question-test-preview.component.html)
- [question-test-preview.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/question-test-preview/question-test-preview.component.css)

## Mục tiêu

Cho người soạn thử tương tác câu hỏi trong tab `Kiểm thử`, kiểm tra đáp án đúng/sai, xem highlight lỗi trước khi lưu hoặc gửi duyệt.

## Thiết kế thực tế theo code

- Form tạo/sửa không mở modal riêng; `openKiemThu()` emit bản clone qua `testPreview`.
- Parent [cauhoi-tracnghiem-chitiet.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.html) nhận `(testPreview)` rồi render tab `Kiểm thử`.
- Preview dùng component standalone `app-question-test-preview`.
- `QuestionTestPreviewComponent` nhận:
  - `question: Question | CourseQuestions`
  - `testFormat: 'monkhac' | 'tienganh'`
  - output `close`
- Preview tự lưu `initialQuestion` bằng deep clone để `Thử lại`/`Đóng` reset state trong tab.
- `openKiemThu()` clone từ form trước khi emit, giúp thao tác preview không mutate dữ liệu form gốc.
- `question_direction` được sync từ reactive form trước khi clone.
- `openKiemThu()` vẫn chạy validator hiện tại theo `testFormat` + `question_type`; không đổi parser/normalization đáp án.

## UI/UX hiện có

- Tab `Tạo câu hỏi/Sửa câu hỏi` chứa form editor.
- Tab `Kiểm thử` chứa preview; nếu chưa có preview thì hiện empty state.
- Preview render trong khung A4, nền xám, scroll nội bộ.
- Footer preview có:
  - `Đóng`
  - `Thử lại` sau khi đã kiểm tra
  - `Kiểm tra đáp án`
- Sau khi kiểm tra hiển thị badge `Kết quả: Đúng/Sai`.
- Nếu có children, hiển thị tổng hợp `x / y câu hỏi đúng`.

## Type đang hỗ trợ trong preview

- `monkhac`:
  - `radio`
  - `checkbox`
  - `inputbox`
  - `group-input`
  - `group-radio`
  - `drag_drop`
  - `grouping`
  - `reorder_words`
  - `arrange_paragraphs`
- `tienganh`:
  - `radio`
  - `inputbox`
  - `drag_drop`
  - `reorder_words`
  - `arrange_paragraphs`
  - `grouping`
- `matching`: chưa render/check trong preview.

## Logic kiểm tra đáp án theo code

- `radio`: so sánh option `isSelected` với `answer_correct`.
- `checkbox`: so sánh tập option `isSelected` với `answer_correct`.
- `inputbox`: so sánh `userAnswer` với các đáp án tách bằng `|`.
- `group-input`: check từng child như inputbox.
- `group-radio`: check từng child như radio.
- `drag_drop`: check `child.answer[0].id` với id lấy từ `answer_correct`.
- `grouping`: check tập `child.answer[].id` với `answer_correct` tách bằng `;`.
- `reorder_words`: join `userSentence` rồi so với đáp án tách bằng `|`.
- `arrange_paragraphs`: so sánh thứ tự `answer_option[].id` với `answer_correct`.

## State preview

- `previewChecked`: đã bấm kiểm tra.
- `previewIsCorrect`: kết quả tổng.
- `previewChildCorrectCount`: số child đúng.
- `previewChildTotal`: tổng child.
- Trạng thái highlight được gắn tạm lên clone:
  - `showCorrectAnswer`
  - `isCorrect`
  - `isWrong`
  - `answer_option[].isCorrect/isWrong`
  - `answer[].isCorrect/isWrong`

## Quy tắc bảo toàn dữ liệu

- Dữ liệu dùng để lưu vẫn là `question` trong create-form.
- Preview chỉ thao tác trên clone đã emit sang parent.
- `Thử lại` phục hồi clone ban đầu của preview.
- `Đóng` reset state preview rồi emit `close`.
- Không upload lại media/audio trong preview.
- Không bật `matching` khi chưa có model/editor/reset đầy đủ.

## Điểm lệch plan cũ đã được chuẩn hóa

- Bỏ mô tả dialog `kiemthuModal`; code hiện dùng tab `Kiểm thử`.
- Bỏ `previewQuestion` trong create-form; code hiện dùng `testPreview.emit(cloneQuestion(question))`.
- Bỏ yêu cầu render trực tiếp trong create-form template; preview nằm ở parent detail.
- Giữ yêu cầu chống mutate form gốc, nhưng mô tả theo cơ chế clone + emit hiện tại.
- Giữ yêu cầu không đổi parser/normalization đáp án.

## Việc còn nên tối ưu

1. Chuẩn hóa text type `drag-drop` vs `drag_drop` trong guard/template nếu còn lệch ở nơi khác.
2. Xem lại `reorder_words`: cần guard khi `child.userSentence` chưa có để tránh lỗi runtime khi bấm kiểm tra sớm.
3. Xem lại `answer_option` access ở `radio`/`checkbox`/`group-radio`; nên dùng fallback `[]` nếu dữ liệu thiếu.
4. CSS đang dùng `::ng-deep`; nếu sau này refactor component view, ưu tiên input class/state rõ hơn thay vì xuyên encapsulation.
5. [cauhoi-tracnghiem-create-form.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component.css) còn width `1024px` cho `app-question-test-preview`; nên đổi responsive nếu UI tràn.
6. Comment trong [question-test-preview.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/question-test-preview/question-test-preview.component.ts) đang có mojibake tiếng Việt; nên sửa hoặc bỏ comment khi chỉnh code.

## Tiêu chí hoàn thành

- Click kiểm thử từ create-form tạo preview clone và chuyển/hiển thị tab `Kiểm thử`.
- Preview render đúng component theo `question_type` và `testFormat`.
- Thao tác trong preview không đổi dữ liệu form gốc.
- `Kiểm tra đáp án` hiển thị đúng/sai tổng.
- Child question có summary đúng/tổng.
- Đáp án người dùng chọn/nhập sai được highlight đỏ.
- `Thử lại` reset về dữ liệu preview ban đầu.
- `Đóng` reset preview và quay lại trạng thái không preview.
- Không ảnh hưởng `saveQuestion()`.
- Không bật `matching`.

## Kiểm thử thủ công khi được phép chạy app

- `radio`: chọn đúng/sai, kiểm tra highlight + kết quả.
- `checkbox`: chọn đủ/thiếu/thừa đáp án.
- `inputbox`: nhập đúng/sai; thử viết hoa/thường.
- `group-input`: child đúng/sai xen kẽ, kiểm tra summary.
- `group-radio`: child đúng/sai xen kẽ, kiểm tra summary.
- `drag_drop`: kéo đúng/sai; thử bấm kiểm tra khi chưa kéo.
- `grouping`: kéo đúng/sai nhiều item; kiểm tra delimiter `;`.
- `reorder_words`: xếp đúng/sai; thử bấm kiểm tra khi chưa chọn từ.
- `arrange_paragraphs`: đổi thứ tự đúng/sai.
- Tiếng Anh `radio`, `inputbox`, `drag_drop`, `reorder_words`, `arrange_paragraphs`, `grouping`.
- Đóng preview rồi quay lại form, xác nhận form gốc không đổi.
- Mở lại preview sau khi sửa form, xác nhận lấy dữ liệu mới.
- Câu hỏi có audio/media: phát preview đúng, không upload lại.
