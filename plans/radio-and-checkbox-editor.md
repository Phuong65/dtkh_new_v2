# Kế hoạch: RadioAndCheckboxEditor

## Mục đích

Component standalone dùng trong luồng **Import câu hỏi trắc nghiệm từ text**, render câu hỏi dạng **radio** và **checkbox** cho phép user chọn đáp án. Thao tác của user đồng bộ ngược lại model `answer_correct`. Component **không hiển thị trạng thái đúng/sai** — đó là việc của màn hình chấm/đánh giá, không thuộc phạm vi preview này.

Thay thế cho `QuestionTypeRadioAndCheckboxComponent` (cũ, nằm trong folder `question-types-view/`).

## Đường dẫn

`src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/radio-and-checkbox-editor/`

| File | Vai trò |
|---|---|
| `radio-and-checkbox-editor.component.ts` | Class, logic preload + sync |
| `radio-and-checkbox-editor.component.html` | Template render radio/checkbox với part-header khi `av === 1` |
| `radio-and-checkbox-editor.component.css` | Style card, highlight state-active |

## Metadata

| Thuộc tính | Giá trị |
|---|---|
| Selector | `app-radio-and-checkbox-editor` |
| Class | `RadioAndCheckboxEditorComponent` |
| Standalone | `true` |
| Implements | `OnInit`, `OnChanges` |

## Inputs

| Input | Type | Mặc định | Mô tả |
|---|---|---|---|
| `courseQuestion` | `CourseQuestions \| any` | — | Câu hỏi cha (có thể chứa `children[]` cho part-header) |
| `av` | `number` | — | `1` = môn tiếng Anh (hiển thị part-header + render children), khác `1` = render trực tiếp câu hỏi |

## State nội bộ

| Field | Type | Mô tả |
|---|---|---|
| `course_question` | `CourseQuestions` | Tham chiếu trực tiếp vào `courseQuestion` (không clone — chấp nhận mutate input để đồng bộ `answer_correct`) |
| `key_ans` | `any` | `KEY_ANSWER_new` từ `@modules/shared/utils/syscat` |

## Chức năng chi tiết

### 1. Preload UI khi load câu hỏi (`ngOnChanges`)
- Nhận `courseQuestion` → gán vào `course_question`.
- Gọi `preloadSelection()` trên câu hỏi hiện tại: parse `answer_correct` theo format `|...|` (radio = `|id|`, checkbox = `|id1,id2|`) → strip `|` → split `,` → set `isSelected = true` cho từng option có `id` nằm trong danh sách. Đáp án đúng lưu sẵn trong model sẽ hiển thị như đang chọn ngay khi load.
- Nếu có `children[]`: sort theo `question_number` (nếu có) hoặc `id`; gọi `preloadSelection()` cho từng child.
- Set `title_part` từ `code` (replace `-` → space).

> **Phạm vi:** Component hiển thị trạng thái chọn (selected), **không hiển thị** màu sắc đúng/sai — đó là việc của màn hình chấm, không thuộc preview editor này.

### 2. Render template
- **`av === 1`** (môn tiếng Anh):
  - Hiển thị `part-header` (title + direction HTML + audio nếu có media).
  - Loop `course_question.children` qua `questionTmpl` (entry point).
- **`av !== 1`**: render trực tiếp `course_question` qua `questionTmpl`.
- **Bên trong `questionTmpl`:** nếu `q.children?.length` → loop qua `childQuestionTmpl`.
- **Bên trong `childQuestionTmpl`:** nếu `q.children?.length` → loop qua `childQuestionTmpl` (đệ quy đến tận leaf).

### 2a. Số đáp án trên 1 hàng
- Mỗi `q` tự quyết định thông qua `q.config.cols`. Không thêm `@Input` mới.
- `getColClass(q)` map `q.config.cols` → `col-12 / col-6 / col-4 / col-3`, fallback `col-6`.
- Áp dụng đồng nhất cho root lẫn mọi cấp child (mỗi child có `config.cols` riêng nếu muốn khác).

### 3. Template `questionTmpl` (đệ quy theo q)
- **Header:** hiển thị `q.question_number` (hoặc `Câu N` khi không phải `av===1`) + direction HTML.
- **Answer grid:** loop `q.answer_option`, áp `getColClass(q)` (1/2/3/4 cột theo `q.config.cols`, mặc định 2 cột).
- **Answer card classes:**
  - `type-circle` khi `q.question_type === 'radio'`.
  - `type-square` khi `q.question_type === 'checkbox'`.
  - `state-active` khi `ans.isSelected`.
- **Label:** ký tự A/B/C/... qua `getKey(i)`.
- **Body:** render `ans.value` qua `safeHtml` + directive katex-img + load-media-on-text.

### 4. Logic chọn đáp án (`onSelect`)
- Luôn cho phép tương tác (component không có chế độ readonly).
- **radio:** clear `isSelected` của tất cả option, set `ans.isSelected = true`, đồng thời `q.answer_correct = `|${ans.id}|``.
- **checkbox:** toggle `ans.isSelected`, đồng thời rebuild:
  - Nếu còn ít nhất 1 id được chọn: `q.answer_correct = `|${ids.filter(isSelected).join(',')}|``
  - Nếu bỏ chọn hết: `q.answer_correct = ''`

> **Hệ quả:** Mỗi click đồng bộ ngược `answer_correct` của model theo đúng format backend yêu cầu. Đáp án user chọn **trở thành** đáp án đúng trong data — đúng theo ngữ nghĩa "preview = editor".

### 5. Helpers
| Method | Mô tả |
|---|---|
| `preloadSelection(question)` | Parse `question.answer_correct` theo format `|...|` (strip `|`, split `,`), set `isSelected = true` cho option matching `id`. Gọi trên root + từng child. |
| `getColClass(q)` | Map `q.config.cols` → class Bootstrap (`col-12` / `col-6` / `col-4` / `col-3`), mặc định `col-6` |
| `getKey(index)` | `String.fromCharCode(65 + index)` → A, B, C... |

### Format `answer_correct`
| `question_type` | Trạng thái | Format | Ví dụ |
|---|---|---|---|
| `radio` | luôn 1 id | `\|<id>\|` | `\|1\|` |
| `checkbox` | ≥1 id chọn | `\|<id1>,<id2>,...\|` | `\|1,2\|` |
| `checkbox` | không có id nào | `''` | `''` |

- Radio luôn đúng format `\|<id>\|` vì luôn có đúng 1 option được chọn.
- Checkbox phải có fallback `''` khi user bỏ chọn hết — tránh ghi `\|\|` (hai pipe rỗng) gây data rác.
- Khi đọc phải strip `\|`; khi ghi phải bao lại bằng `\|...\|` (trừ checkbox rỗng).

## Quan hệ với hệ thống

### Được sử dụng bởi
- Wrapper `TextImportPreviewComponent` (`text-import-question/text-import-preview/`) — render qua `*ngSwitchCase="'radio'"` và `*ngSwitchCase="'checkbox"'`.
- Truyền `[courseQuestion]` + `[av]` lấy từ `selectedCourse?.av`. Component luôn cho user tương tác (không có chế độ readonly).

### Tham chiếu kế hoạch
- [[plans/text-import-preview.md]] — kế hoạch tổng thể luồng import + lịch sử tách folder `text-import-answer-editor/`.

## Trạng thái

- [x] Đổi tên folder `question-type-radio-and-checkbox` → `radio-and-checkbox-editor`.
- [x] Đổi tên class `QuestionTypeRadioAndCheckboxComponent` → `RadioAndCheckboxEditorComponent`.
- [x] Đổi selector `app-question-type-radio-and-checkbox` → `app-radio-and-checkbox-editor`.
- [x] Cập nhật `templateUrl` / `styleUrls` theo đường dẫn mới.
- [x] Sửa implicit-any trên `getKey(index: number)`.
- [x] Logic preload `isSelected` từ `answer_correct` qua `preloadSelection()`.
- [x] Logic sync ngược `answer_correct` trong `onSelect` (radio + checkbox).
- [ ] Build check end-to-end sau khi các type component khác cùng folder xong.
- [ ] Verify runtime: load câu radio/checkbox → click option → `answer_correct` cập nhật đúng format.

## Changelog

### 2026-07-13 — Tổng hợp refactor lần 3 (preview = editor + bỏ hiển thị đúng/sai)

**Loại bỏ UI highlight đúng/sai**
- TS: xóa `getIsCorrectAns()` + 2 call sites (trên root + từng child).
- ANSEXTEND: bỏ field `isCorrect?: boolean`.
- Field class: xóa `isSelected: Answers[]` (dead — `isSelected` thực chất nằm trên từng ANSEXTEND).
- Template: bỏ `is-answer-correct` / `is-answer-wrong` / `q.showCorrectAnswer` khỏi `ngClass` của `.ans-card`.
- CSS: dọn dead rules từ toggle read-only cũ — `.mode-switch`, `.switch-knob`, `.readonly-on .switch-knob`, `.text-mode`.
- Plan: bỏ Mục **Helpers** `getIsCorrectAns`; sửa **Mục đích** nhấn mạnh component không hiển thị trạng thái đúng/sai.

**Chuẩn hóa `preloadSelection` + sync `answer_correct`**
- TS: thêm method `preloadSelection(question)` chỉ set `isSelected`, không set `isCorrect`. Gọi trên root + từng child trong `ngOnChanges`.
- `onSelect`: bổ sung sync `answer_correct` — radio gán `ans.id`, checkbox build lại từ `answer_option.filter(isSelected).map(id).join(',')`.
- Hệ quả: mọi click của user đồng thời cập nhật đáp án đúng trong model. "Đáp án đang chọn" luôn đồng nhất với "đáp án đúng".

**Chuẩn hóa format `answer_correct` (`|...|`)**
- TS: `preloadSelection` thêm `.replace(/\|/g, '')` trước `.split(",")` để chịu format `|1|` / `|1,2|`.
- `onSelect`:
  - radio: `q.answer_correct = `|${ans.id}|``
  - checkbox: `q.answer_correct = `|${ids.join(',')}|``
- Plan: thêm mục **Format `answer_correct`** liệt kê chuẩn; Mục 1 + Mục 4 + Helpers ghi rõ strip pipe.

**Checkbox fallback `''` khi rỗng**
- TS: `onSelect` checkbox — nếu sau khi toggle không còn id nào được chọn, ghi `q.answer_correct = ''` thay vì `\|\|`.
- Plan: Mục 4 tách 2 nhánh (≥1 id / không còn id); bảng Format `answer_correct` thêm row `checkbox` rỗng → `''`.

**Dọn debug + mô tả plan**
- TS: xóa `console.log(this.courseQuestion)` cuối `onSelect`.
- Plan: 
  - Sửa State nội bộ — `course_question` không phải clone, là tham chiếu trực tiếp (chấp nhận mutate input).
  - Bỏ dòng `buttonKiemtra` trong Inputs table (đã xoá từ lâu, dòng dư).
  - Sửa mô tả CSS — bỏ "mode-switch" đã xoá.

### 2026-07-13 — Loại bỏ `buttonKiemtra`
- Xóa `@Input() buttonKiemtra`, biến `showAns`, method `openAns()`, `getAnsCorrect()`.
- Template: bỏ block `*ngIf="buttonKiemtra"` (nút "Xem đáp án") + `*ngIf="showAns"` (text đáp án).
- CSS: xóa 4 rule `.answer-action-bar` (display, hover, mobile, button radius).
- TS: bỏ import `ButtonModule` (chỉ dùng cho nút trên).
- Còn sót dead CSS (chưa dọn): `.mode-switch`, `.switch-knob`, `.readonly-on`, `.text-mode` — từ toggle read-only cũ.

### 2026-07-13 — Loại bỏ `isReadOnly`
- Xóa `@Input() isReadOnly` khỏi TS.
- Bỏ guard `if (this.isReadOnly) return;` trong `onSelect`.
- Template: `state-active` chỉ theo `ans.isSelected`; xóa class `state-readonly`.
- CSS: xóa rule `.state-readonly`, merge `.ans-card:not(.state-readonly):hover` → `.ans-card:hover` (2 chỗ).
- Parent html: xóa `[isReadOnly]="false"` ở 2 vị trí gọi `<app-radio-and-checkbox-editor>`.

### 2026-07-13 — Đổi tên folder + lint
- Rename `question-type-radio-and-checkbox` → `radio-and-checkbox-editor`.
- Cập nhật selector/class/file paths.
- Sửa `getKey(index: number)` để tắt lint hint TS7044.

### 2026-07-09 — Tách folder + sửa logic (xem [[plans/text-import-preview.md]])
- Tách ra folder `text-import-answer-editor/` độc lập với `question-types-view/`.
- Thêm preload `isSelected` từ `answer_correct` trong `getIsCorrectAns`.
- Sync ngược `answer_correct` trong `onSelect`.
- Bỏ UI nút "Xem đáp án" (giữ method `openAns`/`showAns`/`getAnsCorrect` để tránh vỡ build).
