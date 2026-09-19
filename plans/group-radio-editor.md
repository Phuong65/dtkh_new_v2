# Group Radio Editor

> Component `GroupRadioEditorComponent` — bộ soạn đáp án cho câu hỏi nhóm dạng **radio / checkbox** (`group-radio` / `group-checkbox`). Mỗi child có `answer_option[]` riêng; `isSelected` chính là đáp án đúng, **được sync ngược vào `child.answer_correct`** ngay khi chọn.

## 1. Vị trí & phạm vi

Thư mục: [text-import-answer-editor/group-radio-editor/](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-radio-editor/)

| File | Vai trò |
| --- | --- |
| [group-radio-editor.component.ts](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-radio-editor/group-radio-editor.component.ts) | Logic component (standalone) |
| [group-radio-editor.component.html](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-radio-editor/group-radio-editor.component.html) | Template — 1 `<ng-template>` dùng cho cả parent và children |
| [group-radio-editor.component.css](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-radio-editor/group-radio-editor.component.css) | Style riêng (font 14px, no-shadow, indigo accent) |

Component **standalone**, nhúng bởi `text-import-question` khi gặp `question_type === 'group-radio'` / `'group-checkbox'`.

## 2. Mục đích

Hiển thị + soạn đáp án cho câu hỏi nhóm (`courseQuestion`) gồm:

- **Tiêu đề phần** (khi `av === 1` — môn tiếng Anh): `code` đã thay `-` thành space.
- **Hướng dẫn phần** (`question_direction`) — render HTML qua `safeHtml`, hỗ trợ Katex + audio.
- **Danh sách câu hỏi con** (`children`): mỗi child render `question_direction` + grid `answer_option` với card A/B/C…
- **Component luôn ở chế độ soạn** — không còn read-only, không có nút "Xem đáp án", không hiển thị đúng/sai riêng. Đáp án đúng chính là card đang `state-active`.

## 3. Inputs

| Input | Kiểu | Mô tả |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Câu hỏi nhóm. Cần `id`, `code`, `question_direction`, `children[]`; mỗi child cần `question_type`, `answer_option[]`, `answer_correct`. |
| `av` | `number` | `1` = môn tiếng Anh (render `part-header` + audio). Khác `1` = thường. |

**Đã bỏ** `@Input() isReadOnly` và `@Input() buttonKiemtra`. Component luôn soạn.

## 4. State nội bộ

| Field | Kiểu | Mục đích |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input + enrich `title_part` + gắn `isSelected` lên `answer_option` của parent & children. |
| `key_ans` | `string[]` | `KEY_ANSWER_new` — map index → chữ cái đáp án (A/B/C…). |
| `ANSEXTEND` | `interface` | Mở rộng `Answers` thêm `isSelected?`. Đã bỏ `isCorrect?`. |

## 5. Luồng xử lý

### 5.1 `ngOnChanges(courseQuestion)`

1. `course_question = courseQuestion`.
2. `syncData(course_question)` — populate `isSelected` từ `answer_correct`.
3. Nếu có `children`:
   - Sort theo `question_number` (ưu tiên) hoặc `id`.
   - `syncData(f)` cho từng child.
4. `title_part = (code ?? '').replace(/\-/gi, ' ')`.

### 5.2 `syncData(question)`

- `answer_correct` → strip `|`, kiểm tra `","`:
  - Có `,` → split `","` → `correctIds[]`.
  - Không → `correctIds = [raw]`.
- Với mỗi `opt` trong `answer_option`: `opt.isSelected = correctIds.includes(String(opt.id))`.

> Đã hợp nhất `getIsCorrectAns` (cũ) + populate `isCorrect` → `syncData` populate `isSelected` (mới). Không còn `isCorrect`.

### 5.3 `onSelect(q, ans)`

| Điều kiện | Hành vi |
| --- | --- |
| `course_question.question_type === 'group-radio'` | Clear `isSelected` của tất cả `answer_option`, set `ans.isSelected = true` (single choice). |
| Còn lại (`group-checkbox`) | Toggle `ans.isSelected` (multi choice). |

> **Convention dữ liệu (case 2):** `question_type` chỉ có trên **parent** (`course_question`); children **không** mang type riêng. Vì vậy `onSelect` / `syncAnswer` / template ngClass đều đọc `this.course_question.question_type` thay vì `q.question_type`.

Sau khi đổi `isSelected` → gọi `syncAnswer(q)`.

> **Đã bỏ guard `isReadOnly`** — component luôn soạn, click luôn có hiệu lực.

### 5.4 `syncAnswer(q)` — sync ngược `answer_correct`

- Lọc `answer_option` có `isSelected === true` → `selectedIds = [...].map(a => a.id)`.
- **`group-radio`**: 0 hoặc nhiều đáp án chọn → chỉ lấy đáp án đầu tiên → format `|id|`. Rỗng → `''`.
- **`group-checkbox`**: nối `,` → format `|id1,id2,id3|`. Rỗng → `''`.

> Format chuẩn hoá theo yêu cầu: `|a|` cho radio, `|a,b,c|` cho checkbox.
> Type check dùng `this.course_question.question_type` (xem 5.3).

### 5.5 `getColClass(q)`

Đọc `q.config?.cols` (1–4) → map sang class Bootstrap:

| cols | class |
| --- | --- |
| 1 | `col-12` |
| 2 | `col-6` |
| 3 | `col-4` |
| 4 | `col-3` |
| undefined / khác | `col-6` |

### 5.6 `getKey(index)`

`String.fromCharCode(65 + index)` → A, B, C…

## 6. Format `answer_correct` (mỗi child)

| Loại | Khi chọn | Khi bỏ chọn hết |
| --- | --- | --- |
| `group-radio` | `\|id\|` (1 id duy nhất) | `''` |
| `group-checkbox` | `\|id1,id2,id3\|` (nhiều id, phân cách `,`) | `''` |

## 7. Template — 1 `<ng-template>` + `*ngTemplateOutlet`

### 7.1 Outer

- `.quiz-viewport > div`:
  - `.part-container`: `.part-header` chứa `title_part` + `question_direction` (Katex + audio).
  - `.questions-list`: outer `*ngFor="let child_q of course_question.children; let i = index"` → gọi `#questionTmpl` với context `{ $implicit: child_q, idx: i + 1 }`.

> **Đã bỏ** `.answer-action-bar` + nút "Xem đáp án" — không còn `buttonKiemtra` / `openAns()` / `showAns`.

### 7.2 `#questionTmpl` (inner, dùng cho mỗi child)

- `.question-block`:
  - `.question-header-section.question-header-section-group-radio`: tag index (`q.question_number` hoặc `getKey(idx-1).toLowerCase()` + `)`) + `question_direction`.
  - `.row.no-gutters`: `*ngFor="let ans of q.answer_option"` — mỗi ans render `.ans-card` với class động theo `ngClass`:
    - `type-circle` khi `course_question.question_type === 'group-radio'`
    - `type-square` khi `course_question.question_type === 'group-checkbox'`
    - `state-active` khi `ans.isSelected`
  - `(click)="onSelect(q, ans)"`

> **Đã bỏ**: `state-readonly`, `is-answer-correct`, `is-answer-wrong`, block "Đáp án: …" cuối block.
> **Type check** dùng `course_question.question_type` (parent) thay vì `q.question_type` — children inherit type từ parent (xem 5.3).

## 8. CSS

- Font **14px**, không shadow, không outline.
- Border-radius đồng bộ **6–14px**, màu nhấn indigo `#4f46e5` / `#6366f1`.
- Class giữ lại: `.quiz-viewport`, `.part-container`, `.part-header`, `.part-title-text`, `.part-desc-text`, `.questions-list`, `.question-block`, `.question-header-section-group-radio`, `.q-index-tag`, `.q-content-text`, `.ans-card`, `.type-circle`, `.type-square`, `.state-active`, `.ans-label`, `.ans-body`, `.ans-txt`, `.audio-custom`.

**Đã dọn (2026-07-15):** xoá các class dead — `.state-readonly`, `.is-answer-correct`, `.is-answer-wrong`, `.answer-action-bar`, `.mode-switch`, `.readonly-on`, `.switch-knob`, `.text-mode`, `.ans-img`, `.ans-tag-correct`, `.ans-tag`, `.answer-input`, `.form-control`, `.sentence-item`, `.sentence-list`, `.sentence-box`, `.word-chip`, `.word-btn`, `.custom-placeholder`, `.cdk-drag-preview`, `.correct-feedback`, `.answer-body-section`. Gộp các duplicate `.q-index-tag` / `.q-content-text` / `.quiz-viewport` / `.ans-card` (giữ bản cuối). Đơn giản `.ans-card:hover` (bỏ `:not(.state-readonly)`).

## 9. Khác biệt với các editor khác trong cùng nhóm

| Aspect | group-radio-editor | group-input-editor | drag-drop-editor |
| --- | --- | --- | --- |
| Dạng đáp án | Radio / checkbox card | Input text trống | Drag-drop matching |
| Items/zone | Nhiều (grid theo `cols`) | Nhiều (free list) | Tối đa 1 / child |
| Format answer | `\|id\|` (radio) / `\|id1,id2\|` (checkbox) | `\|a\|b\|` | `\|id\|` hoặc `\|id1;id2\|` |
| Read-only mode | Đã bỏ — luôn editable | Đã bỏ | Đã bỏ |
| Đồng bộ ngược | `syncAnswer(q)` → `\|id\|` / `\|id1,id2\|` | `syncAnswerCorrect(q)` | `syncAnswer(item)` |
| "Đáp án đúng" UI | Card `state-active` = đáp án đúng (chính nó) | Block riêng | Item trong zone |

## 10. Quan hệ với các editor khác

Cùng nhóm `text-import-answer-editor/`:
- `radio-and-checkbox-editor`, `inputbox-editor`, `drag-drop-editor`, `arrange-paragraphs-editor`, `group-input-editor`.
- `group-radio-editor` = group nhiều câu hỏi con, mỗi con dùng pattern radio/checkbox card.

## 11. Câu hỏi mở / cần xác nhận

1. ~~**Convention `question_type`**~~ — ✅ Resolved: parent (`course_question`) mang `question_type`, children inherit (không có type riêng). Đã sửa `onSelect`, `syncAnswer`, template ngClass đọc `course_question.question_type`.
2. ~~**`getKey(idx - 1).toLowerCase()`**~~ — ✅ Cố ý: giữ nguyên fallback `a)`, `b)`… (lowercase).
3. ~~**CSS dead classes**~~ — ✅ Đã dọn toàn bộ (xem mục 8).
4. **`ButtonModule` import** — đã bỏ import (không còn button "Xem đáp án"). Xác nhận không còn dùng nơi khác trong component.

## 12. Lịch sử thay đổi

- **2026-07-15 (lần 1)**
  - Tạo plan từ code analysis (snapshot đầu — còn `isReadOnly`, `buttonKiemtra`, `isCorrect`, `showAns`, `isWrong`).
- **2026-07-15 (lần 2) — đồng bộ với sibling editors**
  - **Bỏ `@Input() isReadOnly`** — component luôn soạn. Bỏ guard `if (this.isReadOnly) return;` trong `onSelect`.
  - **Bỏ `@Input() buttonKiemtra`** — bỏ field, bỏ button "Xem đáp án", bỏ `openAns()`, bỏ `showAns`, bỏ block "Đáp án: …" trong template.
  - **Bỏ field `isSelected: Answers[]`** (khai báo nhưng không dùng — dead state).
  - **Bỏ field `isCorrect`** trên `ANSEXTEND` + logic `getIsCorrectAns` cũ → thay bằng `syncData(question)` populate `isSelected`.
  - **Bỏ flag `q.showCorrectAnswer` + class `is-answer-correct`** — không còn hiển thị đúng/sai riêng.
  - **Bỏ flag `ans.isWrong` + class `is-answer-wrong`** — không còn hiển thị sai riêng.
  - **Thêm `syncAnswer(q)`** — sync ngược `answer_correct` ngay khi `onSelect`:
    - `group-radio` → `|id|` (lấy đáp án đầu tiên nếu lỡ chọn nhiều, về lý thuyết single-choice đã clear).
    - `group-checkbox` → `|id1,id2,id3|` (phân cách `,`).
    - Rỗng → `''`.
  - **Template đơn giản**: chỉ còn `state-active` (dựa trên `ans.isSelected`); bỏ `state-readonly`, `is-answer-correct`, `is-answer-wrong`.
  - **Bỏ `ButtonModule` import** — không còn dùng button.
- **2026-07-15 (lần 3) — dọn CSS + fix convention**
  - **Fix convention data** (case 2): `question_type` chỉ trên parent. Đổi `q.question_type` → `course_question.question_type` trong `onSelect`, `syncAnswer`, và template ngClass (`type-circle` / `type-square`). Children inherit type từ parent.
  - **Dọn CSS dead classes**: xoá `.state-readonly`, `.is-answer-correct`, `.is-answer-wrong`, `.answer-action-bar`, `.mode-switch`, `.readonly-on`, `.switch-knob`, `.text-mode`, `.ans-img`, `.ans-tag-correct`, `.ans-tag`, `.answer-input`, `.form-control`, `.sentence-item`, `.sentence-list`, `.sentence-box`, `.word-chip`, `.word-btn`, `.custom-placeholder`, `.cdk-drag-preview`, `.correct-feedback`, `.answer-body-section`. Gộp các duplicate `.q-index-tag` / `.q-content-text` / `.quiz-viewport` / `.ans-card`. Đơn giản `.ans-card:hover` (bỏ `:not(.state-readonly)`).
  - **Giữ nguyên** `getKey(idx - 1).toLowerCase()` — fallback lowercase `a)`, `b)`… là cố ý.

## 13. Trạng thái

- Code đã sửa xong (TS + HTML + CSS).
- Plan đã cập nhật (mục 5.3, 5.4, 7.2, 8, 11, 12 phản ánh code mới + dọn CSS).
- Chưa build, chưa test.
