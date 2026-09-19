# Group Input Editor

> Mô tả chức năng component `GroupInputEditorComponent` — bộ soạn đáp án cho câu hỏi nhóm (group question) gồm nhiều câu hỏi con nhập liệu dạng text, mỗi câu con có block thêm/sửa/xóa đáp án đúng đồng bộ ngược `child.answer_correct`.

## 1. Vị trí & phạm vi

Thư mục: [text-import-answer-editor/group-input-editor/](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-input-editor/)

| File | Vai trò |
| --- | --- |
| [group-input-editor.component.ts](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-input-editor/group-input-editor.component.ts) | Logic component (standalone) |
| [group-input-editor.component.html](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-input-editor/group-input-editor.component.html) | Template — 2 `<ng-template>` lồng nhau |
| [group-input-editor.component.css](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-input-editor/group-input-editor.component.css) | Style riêng (font 14px, no-shadow, indigo accent) |

Component **standalone**, nhúng bởi `text-import-question` khi gặp loại câu hỏi group-input.

## 2. Mục đích

Hiển thị + soạn đáp án cho câu hỏi nhóm (`courseQuestion`) gồm:

- **Tiêu đề phần** (khi `av === 1` — môn tiếng Anh): `code` đã thay `-` thành space.
- **Hướng dẫn phần** (`question_direction`) — render HTML qua `safeHtml`, hỗ trợ Katex + audio.
- **Danh sách câu hỏi con** (`children`): mỗi child hiển thị nội dung + block đáp án đúng riêng (thêm/sửa/xóa).

## 3. Inputs

| Input | Kiểu | Mô tả |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Câu hỏi nhóm. Cần `id`, `code`, `question_direction`, `children[]`. |
| `av` | `number` | `1` = tiếng Anh (part-header, audio, đánh số theo `question_number`). Khác `1` = thường. |

**Đã bỏ** `@Input() isReadOnly`. Component luôn ở chế độ soạn.

## 4. State nội bộ

| Field | Kiểu | Mục đích |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input, giữ `title_part`, `new_answer_correct`. |
| `newAnswerInput` | `{ [qId: string]: string }` | Input trống cuối danh sách để thêm đáp án, key = `child.id`. |
| `editingAnswer` | `{ [key: string]: string }` | Giá trị đang gõ chưa commit, key = `${child.id}\|${index}`. |

## 5. Luồng xử lý

### 5.1 `ngOnChanges(courseQuestion)`

1. `course_question = courseQuestion`.
2. Nếu có `children`: sort theo `question_number` (ưu tiên) hoặc `id`; gọi `getIsCorrectAns(f)` cho từng child.
3. `title_part = code.replace(/\-/gi, ' ')`.

### 5.2 `getIsCorrectAns(question)`

- Có `answer_correct` → split `|`, filter rỗng → `new_answer_correct: string[]`.
- Không có → `new_answer_correct = new_answer_correct ?? []`.

### 5.3 Hành động quản lý đáp án (per child)

| Method | Trigger | Hành vi |
| --- | --- | --- |
| `onEditInputChange(q, i, value)` | Gõ ô sửa | Lưu vào `editingAnswer`. |
| `onEditCommit(q, i)` | Enter / blur | **Guard**: nếu key chưa tồn tại trong `editingAnswer` (focus rồi blur ngay, chưa gõ) → bỏ qua, không xóa. Có gõ: trim; rỗng → `splice`; có → gán `new_answer_correct[i]`. Gọi `syncAnswerCorrect`. |
| `onNewInputChange(q, value)` | Gõ ô "+ Thêm" | Lưu vào `newAnswerInput[q.id]`. |
| `onNewCommit(q)` | Enter / blur | Trim; có → `push`. Gọi `syncAnswerCorrect`. |
| `removeAnswer(q, i)` | Click `×` | `splice` + dọn `editingAnswer`. Gọi `syncAnswerCorrect`. |
| `syncAnswerCorrect(q)` | Sau mọi thay đổi | `q.answer_correct = '\|' + new_answer_correct.join('\|') + '\|'`. |
| `editKey(q, i)` | — | Trả về `${q.id}\|${i}`. |
| `getEditingValue(q, i)` | — | Ưu tiên `editingAnswer`, fallback `new_answer_correct[i]`. |
| `trackByIndex(i)` | `trackBy` ngFor | Giữ identity khi splice. |

### 5.4 Format `answer_correct`

`|a|b|c|` — tất cả `a, b, c` đều là đáp án đúng hợp lệ.

## 6. Template — 2 `<ng-template>` lồng nhau

### 6.1 `#questionTmpl` (outer)

Nhận `q` (CourseQuestions), render:

- **Header câu hỏi** (chỉ khi `av !== 1`): số thứ tự + `question_direction` (Katex + media).
- **`.input-area > .children-list`**: outer `*ngFor="let child of q.children"` — mỗi child = 1 câu hỏi.
  - `.child-direction`: `(ci + 1)` + `child.question_direction`.
  - **Gọi `#childAnswerTmpl`** qua `*ngTemplateOutlet="childAnswerTmpl; context: { $implicit: child }"` — truyền `child` vào scope con.

### 6.2 `#childAnswerTmpl` (inner)

Nhận `child` (1 câu hỏi con) qua `let-child`, render:

- `.answer-correct-block`:
  - `.answer-hint` (giữ): `Nhấn Enter hoặc click ra ngoài ô để lưu từng đáp án. Có thể nhập nhiều đáp án đúng.`
  - `.answer-correct-list`: inner `*ngFor="let ans of child['new_answer_correct']"` — mỗi answer:
    - `<input>` sửa + nút `×` xóa.
  - `.answer-row.answer-row-add`: input dashed placeholder "+ Thêm đáp án đúng".

### 6.3 Lý do tách 2 template

Biến `let-child` ở outer `*ngFor` không propagate xuống binding inner do Angular tạo embedded view riêng. Tách template con truyền qua `context: { $implicit: child }` giải quyết scope leak. Compile lỗi trước đó ở dòng `(blur)="onEditCommit(child, ai)"` đã được fix theo cách này.

## 7. CSS

- Font **14px**, không shadow, không outline.
- Border-radius đồng bộ **6–10px**, màu nhấn indigo `#4f46e5` / `#6366f1`.

### 7.1 Class giữ lại

`.quiz-viewport`, `.question-block`, `.q-index-tag`, `.q-content-text`, `.part-header`, `.part-title-text`, `.part-desc-text`, `.question-header-section`, `.audio-custom`, `.input-area`, `.children-list`, `.child-block`, `.child-direction`, `.child-index`, `.answer-correct-block`, `.answer-correct-list`, `.answer-row`, `.answer-row-controls`, `.answer-row-add`, `.answer-input-chip`, `.answer-input-add`, `.btn-remove-answer`, `.answer-hint`.

### 7.2 Khác biệt CỐ Ý so với `inputbox-editor.component.css`

| Class | inputbox-editor | group-input-editor | Lý do |
| --- | --- | --- | --- |
| `.answer-correct-block` | `margin-top: 4px` | `margin-top: 12px; padding-left: 20px` | Tăng margin-top để tách khỏi header câu con; padding-left thụt vào trong cho đẹp. |
| `.answer-correct-list` | `gap: 6px` | `gap: 6px` | Khớp bản gốc. |
| `.answer-row` | row, `gap: 6px` | column, `gap: 4px` | Group lồng — header câu con + controls xếp dọc. |
| `.answer-row-controls` | — | mới, row, `gap: 6px` | Hàng ngang chứa input + nút ×. |
| `.answer-input-chip:focus` | — | thêm `border-color: #6366f1; background: #f8fbff` | Cải thiện UX. |

### 7.3 Đã dọn

`.mode-switch`, `.readonly-on`, `.switch-knob`, `.text-mode`, `.sentence-item`, `.sentence-list`, `.custom-placeholder`, `.cdk-drag-preview`, `.cdk-drag-enter`, `.cdk-drop-list-dragging`, `.order-badge`, `.correct-box-list`, `.label-ans`, `.step-check`, `.step-text`, `.correct-box`, `.ans-card`, `.ans-label`, `.ans-tag-correct`, `.answer-body-section`, `.drag-area`, `.word-chip`, `.word-btn`, `.correct-feedback`, `.pi`, `.input-container` (không dùng — thay bằng `.children-list`).

## 8. Quan hệ với các editor khác

Cùng nhóm `text-import-answer-editor/`:
- `radio-and-checkbox-editor`, `inputbox-editor`, `drag-drop-editor`, `arrange-paragraphs-editor`.
- `group-input-editor` = group nhiều câu hỏi con, mỗi con dùng pattern inputbox (thêm/sửa/xóa đáp án đúng).

## 9. Câu hỏi mở

1. **`isWrong`** — `inputbox-editor` dùng class `is-answer-wrong` khi `child.isWrong = true`. `group-input-editor` hiện không dùng. Logic chấm đúng/sai do parent xử lý?
2. **CSS dùng chung** — nhiều class giống `inputbox-editor` (`.answer-input-chip`, `.btn-remove-answer`…). Có nên tách `_shared-answer-editor.scss`?
3. **`answer-hint` màu đỏ** — kế thừa `inputbox-editor`. Có nên đổi sang màu neutral?

## 10. Lịch sử thay đổi

- **2026-07-14**
  - Bỏ `@Input() isReadOnly`. Component luôn soạn.
  - Thêm `newAnswerInput` + `editingAnswer` + 9 methods (mirror `inputbox-editor`).
  - Tách template thành `#questionTmpl` + `#childAnswerTmpl` (fix compile lỗi scope leak).
  - `.answer-correct-block`: `margin-top: 12px; padding-left: 20px`.
  - `.answer-correct-list`: `gap: 6px` (khớp bản gốc).
  - Dọn ~30 class CSS cũ không dùng.
  - Fix bug focus → blur ngay làm mất đáp án: thêm guard `if (!(key in this.editingAnswer)) return;` đầu `onEditCommit`. Cùng bug đã sửa ở `inputbox-editor.component.ts`.

## 11. Trạng thái

- Code đã sửa xong (TS + HTML + CSS).
- Plan đã cập nhật (mục 6 + 7 phản ánh cấu trúc 2 template + CSS chốt).
- Chưa build, chưa test.
